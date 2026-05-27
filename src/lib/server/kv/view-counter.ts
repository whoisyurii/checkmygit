import {
	DEV_PROFILE_VIEWS,
	DEV_GLOBAL_VIEWS,
	GLOBAL_VIEW_KEY,
	FALLBACK_VIEW_COUNT
} from './constants';
import type { ViewCountResult, CookieAccessor } from './types';
import {
	handleDeduplication,
	getCookieName,
	parseSeenCookie,
	shouldCountView
} from './deduplication';
import {
	getCachedCount,
	setCachedCount,
	buildCacheKey,
	buildGlobalCacheKey,
	isCacheExpired,
	isCacheTooStale
} from './cache';
import { kvReadWithRetry } from './retry';
import { recordGlobalView } from './global-counter';

// check if platform has KV available (production vs local dev)
function isKVAvailable(platform: App.Platform | undefined): boolean {
	return !!platform?.env?.PROFILE_VIEWS;
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

// SSR display path: read-only profile view count. Never writes to KV and never
// sets cookies. Adds an optimistic +1 when this visitor hasn't been counted yet
// so the number reflects the current view immediately; the real increment is
// persisted later by the /api/view beacon.
// Designed to NEVER throw - always returns a number.
export async function getProfileViews(options: {
	platform: App.Platform | undefined;
	username: string;
	cookies: Pick<CookieAccessor, 'get'>;
}): Promise<number> {
	const { platform, username, cookies } = options;

	// Local dev: return mock data
	if (!isKVAvailable(platform)) return DEV_PROFILE_VIEWS;

	const result = await getViewCount(platform, username.toLowerCase(), buildCacheKey(username));

	// The fallback count already represents "1 for the current viewer" — don't
	// stack another optimistic increment on top of it.
	if (result.source === 'fallback') return result.count;

	let optimistic = 0;
	try {
		const seen = parseSeenCookie(cookies.get(getCookieName()));
		if (shouldCountView(seen, username)) optimistic = 1;
	} catch {
		// Cookie parse failure: just show the persisted count
	}

	return result.count + optimistic;
}

// Write path: dedupe by cookie, increment the per-profile counter, and record a
// (debounced) global view. Invoked by the /api/view beacon, which only fires in
// real browsers — so crawlers (which don't run JS) never reach the write path.
// Designed to NEVER throw.
export async function recordProfileView(options: {
	platform: App.Platform | undefined;
	username: string;
	cookies: CookieAccessor;
}): Promise<void> {
	const { platform, username, cookies } = options;

	// Local dev or missing binding: nothing to persist.
	if (!platform || !isKVAvailable(platform)) return;

	try {
		// Now that only real browsers reach this path, the cookie window is enough
		// on its own: it both decides whether to count and records the visit (24h).
		const { shouldCount } = handleDeduplication(cookies, username);
		if (!shouldCount) return;

		const kv = platform.env.PROFILE_VIEWS;
		const caches = platform.caches;
		const waitUntil = platform.context?.waitUntil
			? platform.context.waitUntil.bind(platform.context)
			: undefined;

		const key = username.toLowerCase();

		// Read-then-increment. If the read fails, skip the write so a transient
		// error can never reset the counter to a low value.
		let current: number | null = null;
		try {
			const value = await kvReadWithRetry(kv, key);
			current = value ? parseInt(value, 10) : 0;
		} catch (error) {
			console.error('Profile count read failed, skipping increment:', error);
		}
		if (current === null || Number.isNaN(current)) return;

		const next = current + 1;
		await kv.put(key, next.toString());

		// Refresh the display cache so the next SSR read reflects the new value.
		if (caches) {
			await setCachedCount(caches, buildCacheKey(username), {
				count: next,
				cachedAt: Date.now()
			});
		}

		// Global total: buffered and flushed at most once per minute.
		await recordGlobalView({ kv, caches, waitUntil });
	} catch (error) {
		console.error('recordProfileView failed:', error);
	}
}

// get global view count (for homepage) - read-only, cache-first.
// Uses caching to minimize KV reads.
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
