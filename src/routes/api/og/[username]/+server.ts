import type { RequestHandler } from './$types';
import { fetchGitHubProfile } from '$lib/server/github';
import { generateOGImage } from '$lib/server/og';
import { error } from '@sveltejs/kit';

const OG_CACHE_KEY_PREFIX = 'https://og-cache/_/og/';
const OG_CACHE_TTL_SECONDS = 3600; // 1 hour

function buildCacheKey(username: string): string {
	return `${OG_CACHE_KEY_PREFIX}${username.toLowerCase()}`;
}

export const GET: RequestHandler = async ({ params, platform }) => {
	const { username } = params;

	// Try edge cache first
	if (platform?.caches) {
		try {
			const cacheKey = buildCacheKey(username);
			const cached = await platform.caches.default.match(new Request(cacheKey));
			if (cached) return cached;
		} catch {
			// Cache miss or error, continue to generation
		}
	}

	// Fetch profile data
	const result = await fetchGitHubProfile(username);

	if (!result.success) {
		if (result.error.type === 'NOT_FOUND') {
			error(404, 'User not found');
		}

		// On rate limit or other errors, fall back to avatar redirect
		const avatarFallback = `https://github.com/${username}.png?size=1200`;
		return new Response(null, {
			status: 302,
			headers: {
				Location: avatarFallback,
				'Cache-Control': 'public, max-age=300'
			}
		});
	}

	try {
		const png = await generateOGImage(result.data);

		const response = new Response(png, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': `public, max-age=${OG_CACHE_TTL_SECONDS}`,
				'CDN-Cache-Control': `public, max-age=${OG_CACHE_TTL_SECONDS}`
			}
		});

		// Store in edge cache (non-blocking)
		if (platform?.caches) {
			const cacheKey = buildCacheKey(username);
			const cacheResponse = new Response(png, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': `public, max-age=${OG_CACHE_TTL_SECONDS}`
				}
			});

			if (platform.context) {
				platform.context.waitUntil(
					platform.caches.default.put(new Request(cacheKey), cacheResponse)
				);
			} else {
				platform.caches.default
					.put(new Request(cacheKey), cacheResponse)
					.catch(() => {});
			}
		}

		return response;
	} catch (err) {
		console.error('OG image generation failed:', err);

		// Graceful degradation: redirect to GitHub avatar
		const avatarUrl = `${result.data.user.avatarUrl}&s=1200`;
		return new Response(null, {
			status: 302,
			headers: {
				Location: avatarUrl,
				'Cache-Control': 'public, max-age=300'
			}
		});
	}
};
