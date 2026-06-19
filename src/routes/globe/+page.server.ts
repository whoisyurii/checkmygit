import type { PageServerLoad } from './$types';
import { fetchGlobePoints } from '$lib/server/globe';

// Stream the points: return the promise (NOT awaited) so the page shell +
// loading shimmer paint immediately, then the globe hydrates when data lands.
// `platform` is undefined under plain `vite dev`; fetchGlobePoints handles that
// (KV guarded, SAMPLE fallback) and never throws.
export const load: PageServerLoad = ({ platform }) => {
	return { points: fetchGlobePoints({ platform }) };
};
