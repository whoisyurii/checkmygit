import type { PageServerLoad } from './$types';
import { fetchGitHubProfile } from '$lib/server/github';
import { getProfileViews } from '$lib/server/kv';

export const load: PageServerLoad = async ({ params, platform, cookies }) => {
	const { username } = params;

	// Return username immediately for optimistic UI
	// Stream the profile data so skeleton can show while loading
	const profilePromise = fetchGitHubProfile(username).then((result) => {
		if (!result.success) {
			// Throw a regular error that will be caught by {:catch} in the template
			const errorMessage =
				result.error.type === 'NOT_FOUND'
					? `User "${username}" not found on GitHub`
					: result.error.type === 'RATE_LIMIT'
						? 'GitHub API rate limit exceeded. Please try again later.'
						: result.error.message || 'Failed to fetch GitHub profile';
			throw new Error(errorMessage);
		}
		return result.data;
	});

	// Read-only: render the current count (with an optimistic +1 for new
	// visitors). The actual increment is persisted by the /api/view beacon, which
	// only fires in real browsers — keeping crawlers off the KV write path.
	const viewsPromise = getProfileViews({
		platform,
		username,
		cookies: { get: (name) => cookies.get(name) }
	}).catch(() => 0);

	return {
		username,
		profile: profilePromise,
		views: viewsPromise
	};
};
