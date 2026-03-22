// Font loader for Satori OG image generation
// Fetches Inter WOFF from fontsource CDN and caches in module-level memory

let fontRegularCache: ArrayBuffer | null = null;
let fontBoldCache: ArrayBuffer | null = null;

const FONT_URLS = {
	regular: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff',
	bold: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff'
};

export async function loadFonts(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
	if (fontRegularCache && fontBoldCache) {
		return { regular: fontRegularCache, bold: fontBoldCache };
	}

	const [regular, bold] = await Promise.all([
		fetch(FONT_URLS.regular).then((r) => {
			if (!r.ok) throw new Error(`Failed to fetch regular font: ${r.status}`);
			return r.arrayBuffer();
		}),
		fetch(FONT_URLS.bold).then((r) => {
			if (!r.ok) throw new Error(`Failed to fetch bold font: ${r.status}`);
			return r.arrayBuffer();
		})
	]);

	fontRegularCache = regular;
	fontBoldCache = bold;

	return { regular, bold };
}
