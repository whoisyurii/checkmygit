// WASM initialization wrapper for @resvg/resvg-wasm
// Fetches WASM binary from jsDelivr CDN (worker can't fetch its own static assets)

import { initWasm, Resvg } from '@resvg/resvg-wasm';

const RESVG_WASM_URL = 'https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm';

let initialized = false;

export async function ensureResvgInitialized(): Promise<void> {
	if (initialized) return;

	const wasmResponse = await fetch(RESVG_WASM_URL);
	if (!wasmResponse.ok) {
		throw new Error(`Failed to fetch resvg WASM: ${wasmResponse.status}`);
	}

	await initWasm(wasmResponse);
	initialized = true;
}

export { Resvg };
