import {
	DEFAULT_KV_RETRY_OPTIONS,
	DEV_PROFILE_VIEWS,
	DEV_GLOBAL_VIEWS,
	GLOBAL_VIEW_KEY,
	FALLBACK_VIEW_COUNT
} from './constants';
import type { ViewCountResult, ProfileViewResult, CookieAccessor, KVRetryOptions } from './types';
import { handleDeduplication, getIpHash } from './deduplication';
import {
	getCachedCount,
	setCachedCount,
	buildCacheKey,
	buildGlobalCacheKey,
	isCacheExpired,
	isCacheTooStale
} from './cache';

const IP_DEDUP_TTL = 3600; // 1 hour in seconds

// check if an error is a rate limit (429) error
function isRateLimitError(error: unknown): boolean {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		return msg.includes('429') || msg.includes('rate limit') || msg.includes('too many');
	}
	return false;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// check if platform has KV available (production vs local dev)
function isKVAvailable(platform: App.Platform | undefined): boolean {
	return !!platform?.env?.PROFILE_VIEWS;
}

// Extract KV type from App.Platform
type KV = App.Platform['env']['PROFILE_VIEWS'];

// read from KV with retry logic for rate limit errors
async function kvReadWithRetry(
	kv: KV,
	key: string,
	options: KVRetryOptions = DEFAULT_KV_RETRY_OPTIONS
): Promise<string | null> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
		try {
			return await kv.get(key);
		} catch (error) {
			lastError = error as Error;

			if (!isRateLimitError(error) || attempt === options.maxRetries) {
				throw error;
			}

			// Exponential backoff
			const delay = options.retryDelayMs * Math.pow(options.backoffMultiplier, attempt);
			await sleep(delay);
		}
	}

	throw lastError;
}

// get view count with caching and fallback chain
// This function is designed to NEVER throw - always returns a valid result
async function getViewCount(
	platform: App.Platform | undefined,
	key: string,
	cacheKey: string
): Promise<ViewCountResult> {
	// 1. Try edge cache first
	if (platform?.caches) {
		try {
			const cached = await getCachedCount(platform.caches, cacheKey);
			if (cached && !isCacheExpired(cached)) {
				return { count: cached.count, isStale: false, source: 'cache' };
			}
		} catch {
			// Cache read failed, continue to KV
		}
	}

	// 2. Try KV with retry
	if (platform?.env?.PROFILE_VIEWS) {
		try {
			const value = await kvReadWithRetry(platform.env.PROFILE_VIEWS, key);
			const count = value ? parseInt(value, 10) : 0;

			// Update cache on successful read (in background, never block)
			if (platform.caches) {
				const cachePromise = setCachedCount(platform.caches, cacheKey, {
					count,
					cachedAt: Date.now()
				}).catch((err) => console.error('Cache update failed:', err));

				if (platform.context?.waitUntil) {
					platform.context.waitUntil(cachePromise);
				}
				// If no waitUntil, promise runs but we don't await it
			}

			return { count, isStale: false, source: 'kv' };
		} catch (error) {
			console.error('KV read failed:', error);

			// 3. Fall back to stale cache on error
			if (platform?.caches) {
				try {
					const staleCache = await getCachedCount(platform.caches, cacheKey);
					if (staleCache && !isCacheTooStale(staleCache)) {
						return { count: staleCache.count, isStale: true, source: 'cache' };
					}
				} catch {
					// Stale cache also failed
				}
			}
		}
	}

	// 4. Ultimate fallback - show 1 because current user IS viewing
	return { count: FALLBACK_VIEW_COUNT, isStale: false, source: 'fallback' };
}

// write view counts to KV and update cache
async function writeViewCounts(
	platform: App.Platform,
	username: string,
	profileCount: number,
	globalCount: number
): Promise<void> {
	const kv = platform.env.PROFILE_VIEWS;

	try {
		// Write to KV
		await Promise.all([
			kv.put(username.toLowerCase(), profileCount.toString()),
			kv.put(GLOBAL_VIEW_KEY, globalCount.toString())
		]);

		// Update cache with new values
		if (platform.caches) {
			await Promise.all([
				setCachedCount(platform.caches, buildCacheKey(username), {
					count: profileCount,
					cachedAt: Date.now()
				}),
				setCachedCount(platform.caches, buildGlobalCacheKey(), {
					count: globalCount,
					cachedAt: Date.now()
				})
			]);
		}
	} catch (error) {
		console.error('Failed to write view counts:', error);
		// Writes failed, but page already loaded - log and move on
	}
}

// handle a profile view with deduplication, caching, and 429 fallback
// This function is designed to NEVER throw - always returns a valid result
export async function handleProfileView(options: {
	platform: App.Platform | undefined;
	username: string;
	cookies: CookieAccessor;
	ip: string;
}): Promise<ProfileViewResult> {
	const { platform, username, cookies, ip } = options;

	// Local dev: return mock data
	if (!isKVAvailable(platform)) {
		return {
			views: DEV_PROFILE_VIEWS,
			globalViews: DEV_GLOBAL_VIEWS,
			isStale: false,
			source: 'fallback'
		};
	}

	try {
		// 1. Check deduplication (Cookie + IP Check, wrapped in try-catch for safety)
		let shouldCount = true;

		try {
			// A. Check Cookie (Fastest check first)
			const result = handleDeduplication(cookies, username);
			shouldCount = result.shouldCount;

			// B. Check IP Hash in KV (Secure check for Incognito/Scripts)
			// Only check if cookie said "yes" and we have access to the DB
			if (shouldCount && isKVAvailable(platform) && ip) {
				const kv = platform!.env.PROFILE_VIEWS;
				const ipHash = getIpHash(ip);
				const dedupKey = `dedup:${ipHash}:${username.toLowerCase()}`;

				// Check if this IP has viewed this profile recently
				const hasViewedByIp = await kv.get(dedupKey);

				if (hasViewedByIp) {
					shouldCount = false;
				} else {
					// Mark this IP as "seen" for the next hour
					// Use waitUntil so we don't slow down the page load
					const writePromise = kv.put(dedupKey, '1', { expirationTtl: IP_DEDUP_TTL });

					if (platform!.context) {
						platform!.context.waitUntil(writePromise);
					} else {
						writePromise.catch((e: unknown) => console.error('Failed to log IP:', e));
					}
				}
			}
		} catch (err) {
			console.error('Deduplication check failed:', err);
			// Fail open: If DB errors, we count the view rather than breaking the page
		}

		// 2. Get current view counts (with caching/fallback)
		const [profileViews, globalViews] = await Promise.all([
			getViewCount(platform, username.toLowerCase(), buildCacheKey(username)),
			getViewCount(platform, GLOBAL_VIEW_KEY, buildGlobalCacheKey())
		]);

		// 3. Calculate display values
		let displayViews = profileViews.count;
		let displayGlobal = globalViews.count;

		if (shouldCount) {
			// Show incremented value to user immediately
			displayViews += 1;
			displayGlobal += 1;

			// 4. Perform writes in background (never block response)
			if (platform?.env?.PROFILE_VIEWS && platform.context?.waitUntil) {
				platform.context.waitUntil(
					writeViewCounts(platform, username, displayViews, displayGlobal)
				);
			} else if (platform?.env?.PROFILE_VIEWS) {
				// Fallback without waitUntil - fire and forget
				writeViewCounts(platform, username, displayViews, displayGlobal).catch((err) =>
					console.error('Background write failed:', err)
				);
			}
		}

		return {
			views: displayViews,
			globalViews: displayGlobal,
			isStale: profileViews.isStale || globalViews.isStale,
			source: profileViews.source
		};
	} catch (error) {
		// Ultimate safety net - if anything unexpected fails, return fallback
		// Show 1 because current user IS viewing the page
		console.error('handleProfileView failed:', error);
		return {
			views: FALLBACK_VIEW_COUNT,
			globalViews: FALLBACK_VIEW_COUNT,
			isStale: false,
			source: 'fallback'
		};
	}
}

// get global view count (for homepage)
// Uses caching to minimize KV reads
export async function getGlobalViewCount(
	platform: App.Platform | undefined
): Promise<ViewCountResult> {
	// Local dev: return mock data
	if (!isKVAvailable(platform)) {
		return {
			count: DEV_GLOBAL_VIEWS,
			isStale: false,
			source: 'fallback'
		};
	}

	return getViewCount(platform, GLOBAL_VIEW_KEY, buildGlobalCacheKey());
}
