// OG Image generation orchestrator
// Combines font loading, card building, Satori SVG rendering, and Resvg PNG conversion

import satori from 'satori';
import type { GitHubProfile } from '$lib/types/github';
import { loadFonts } from './font';
import { ensureResvgInitialized, Resvg } from './resvg';
import { buildOGCard } from './card';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_SCALE = 2; // Render at 2x for crisp output

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	const chunks: string[] = [];
	const chunkSize = 8192;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		chunks.push(String.fromCharCode(...bytes.slice(i, i + chunkSize)));
	}
	return btoa(chunks.join(''));
}

async function fetchAvatarAsDataUrl(avatarUrl: string): Promise<string | null> {
	try {
		const response = await fetch(`${avatarUrl}&s=256`);
		if (!response.ok) return null;

		const buffer = await response.arrayBuffer();
		const contentType = response.headers.get('content-type') || 'image/png';
		const base64 = arrayBufferToBase64(buffer);
		return `data:${contentType};base64,${base64}`;
	} catch {
		return null;
	}
}

export async function generateOGImage(profile: GitHubProfile): Promise<Uint8Array> {
	// Initialize resvg WASM (cached after first call)
	await ensureResvgInitialized();

	// Load fonts (cached after first call)
	const fonts = await loadFonts();

	// Fetch avatar and convert to base64 data URL
	const avatarDataUrl = await fetchAvatarAsDataUrl(profile.user.avatarUrl);

	// Build the card virtual DOM
	const cardVdom = buildOGCard(profile, avatarDataUrl);

	// Render to SVG via Satori (yoga WASM is base64-inlined in yoga-layout)
	const svg = await satori(cardVdom as any, {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		fonts: [
			{
				name: 'Inter',
				data: fonts.regular,
				weight: 400,
				style: 'normal' as const
			},
			{
				name: 'Inter',
				data: fonts.bold,
				weight: 700,
				style: 'normal' as const
			}
		]
	});

	// Convert SVG to PNG at 2x resolution for crisp output
	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: OG_WIDTH * OG_SCALE }
	});
	const rendered = resvg.render();
	const png = rendered.asPng();

	return png;
}
