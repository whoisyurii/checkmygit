import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchTopRepositories, fetchTopUsers } from '$lib/server/rankings';

export const GET: RequestHandler = async ({ url }) => {
	const type = url.searchParams.get('type') || 'repos';
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 25);
	const language = url.searchParams.get('language') || '';
	const repoType = url.searchParams.get('repoType') || 'original';
	const excludeForks = repoType === 'original';

	if (type === 'repos') {
		const result = await fetchTopRepositories(language || undefined, limit, excludeForks);
		return json(result);
	} else if (type === 'users') {
		const result = await fetchTopUsers('followers', limit, excludeForks);
		return json(result);
	}

	return json({ success: false, data: [], error: 'Invalid type' });
};
