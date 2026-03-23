import type { RequestHandler } from './$types';
import { fetchGitHubProfile } from '$lib/server/github';
import { error } from '@sveltejs/kit';

// Simple OG image endpoint - returns user avatar for now
// TODO: Implement full Satori-based OG image generation
export const GET: RequestHandler = async ({ params, url }) => {
	const { username } = params;
	const template = url.searchParams.get('template') || 'github';

	// Fetch profile to get avatar URL
	const result = await fetchGitHubProfile(username);

	if (!result.success) {
		if (result.error.type === 'NOT_FOUND') {
			error(404, 'User not found');
		}
		error(500, result.error.message);
	}

	// For now, redirect to GitHub avatar
	// In production, you'd use Satori + Resvg to generate a custom OG image
	const avatarUrl = `${result.data.user.avatarUrl}&s=1200`;

	return new Response(null, {
		status: 302,
		headers: {
			Location: avatarUrl,
			'Cache-Control': 'public, max-age=3600'
		}
	});
};

// TODO: Full Satori implementation would look like:
/*
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export const GET: RequestHandler = async ({ params, url }) => {
	const { username } = params;
	const template = url.searchParams.get('template') || 'github';

	const result = await fetchGitHubProfile(username);
	if (!result.success) {
		error(404, 'User not found');
	}

	const profile = result.data;

	// Create SVG with Satori
	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					width: '1200px',
					height: '630px',
					backgroundColor: '#0d1117',
					color: '#f0f6fc'
				},
				children: [
					{
						type: 'img',
						props: {
							src: profile.user.avatarUrl,
							width: 200,
							height: 200,
							style: { borderRadius: '100px' }
						}
					},
					{
						type: 'h1',
						props: {
							children: profile.user.name || profile.user.login,
							style: { fontSize: '48px', marginTop: '24px' }
						}
					}
				]
			}
		},
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: 'Inter',
					data: await fetch('https://fonts.gstatic.com/s/inter/...').then(r => r.arrayBuffer()),
					weight: 600
				}
			]
		}
	);

	// Convert SVG to PNG
	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: 1200 }
	});
	const png = resvg.render().asPng();

	return new Response(png, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
*/
