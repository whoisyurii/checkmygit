// WASM initialization wrapper for @resvg/resvg-wasm
// The WASM binary lives at /resvg_bg.wasm (static asset)

import { initWasm, Resvg } from '@resvg/resvg-wasm';

let initialized = false;

export async function ensureResvgInitialized(originUrl: string): Promise<void> {
	if (initialized) return;

	const wasmUrl = `${originUrl}/resvg_bg.wasm`;
	const wasmResponse = await fetch(wasmUrl);

	if (!wasmResponse.ok) {
		throw new Error(`Failed to fetch resvg WASM: ${wasmResponse.status}`);
	}

	await initWasm(wasmResponse);
	initialized = true;
}

export { Resvg };
