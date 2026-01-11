import type { PageServerLoad } from './$types';
import { fetchTopRepositories, fetchTopUsers } from '$lib/server/rankings';

export const load: PageServerLoad = async ({ url }) => {
	const tab = url.searchParams.get('tab') || 'repos';
	const language = url.searchParams.get('language') || '';

	// Return promises directly for streaming - page navigates immediately
	// Data loads in background while skeleton is shown
	return {
		tab,
		language,
		streamed: {
			repos: fetchTopRepositories(language || undefined),
			users: fetchTopUsers('followers', 30)
		}
	};
};
