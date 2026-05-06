import type { PageServerLoad } from './$types';
import { tryCachedTrending, fetchTrendingLive } from '$lib/server/trending';
import { normalizeTrendingWindow, normalizeTrendingLanguage } from '$lib/types/trending';

export const load: PageServerLoad = async ({ url, platform }) => {
	const since = normalizeTrendingWindow(url.searchParams.get('since'));
	const language = normalizeTrendingLanguage(url.searchParams.get('language'));

	const cached = await tryCachedTrending({
		since,
		language: language || undefined,
		caches: platform?.caches
	});

	if (cached) {
		return { since, language, repos: cached, ownsCanonical: true };
	}

	// Cold cache: stream the live fetch (unawaited Promise) so SvelteKit ships
	// the HTML shell + skeleton immediately and the data populates when it
	// resolves. Cache hit above keeps full HTML + JSON-LD for warm traffic.
	return {
		since,
		language,
		ownsCanonical: true,
		repos: fetchTrendingLive({
			since,
			language: language || undefined,
			caches: platform?.caches,
			waitUntil: platform?.context.waitUntil.bind(platform.context)
		})
	};
};
