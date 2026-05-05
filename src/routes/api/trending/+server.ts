import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchTrending } from '$lib/server/trending';
import { normalizeTrendingWindow, normalizeTrendingLanguage } from '$lib/types/trending';

export const GET: RequestHandler = async ({ url, platform }) => {
	const since = normalizeTrendingWindow(url.searchParams.get('since'));
	const language = normalizeTrendingLanguage(url.searchParams.get('language'));

	const result = await fetchTrending({
		since,
		language: language || undefined,
		caches: platform?.caches,
		waitUntil: platform?.context.waitUntil.bind(platform.context)
	});

	return json(result);
};
