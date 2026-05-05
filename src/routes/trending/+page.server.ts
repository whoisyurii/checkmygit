import type { PageServerLoad } from './$types';
import { fetchTrending } from '$lib/server/trending';
import { normalizeTrendingWindow, normalizeTrendingLanguage } from '$lib/types/trending';

export const load: PageServerLoad = async ({ url, platform }) => {
	const since = normalizeTrendingWindow(url.searchParams.get('since'));
	const language = normalizeTrendingLanguage(url.searchParams.get('language'));

	const repos = await fetchTrending({
		since,
		language: language || undefined,
		caches: platform?.caches,
		waitUntil: platform?.context.waitUntil.bind(platform.context)
	});

	return {
		since,
		language,
		repos,
		ownsCanonical: true
	};
};
