import type { PageServerLoad } from './$types';
import { fetchTopRepositories, fetchTopUsers } from '$lib/server/rankings';

export const load: PageServerLoad = async ({ url }) => {
	const tab = url.searchParams.get('tab') || 'repos';
	const language = url.searchParams.get('language') || '';
	const repoType = (url.searchParams.get('repoType') as 'all' | 'original') || 'original';
	const excludeForks = repoType === 'original';

	// Only fetch data for the active tab - reduces API load and improves performance
	// Use smaller initial limits (10) to ensure fast response
	return {
		tab,
		language,
		repoType,
		streamed: {
			// Only fetch repos if on repos tab
			repos: tab === 'repos' ? fetchTopRepositories(language || undefined, 10, excludeForks) : Promise.resolve({ success: true, data: [] }),
			// Only fetch users if on users tab
			users: tab === 'users' ? fetchTopUsers('followers', 10, excludeForks) : Promise.resolve({ success: true, data: [] })
		}
	};
};
