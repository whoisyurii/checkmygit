// Types for the /globe feature.
//
// A GlobePoint is a single plottable developer marker: their identity
// (login/name/avatar/followers), their original free-text GitHub location
// string, the resolved country, and the final lat/lng the marker is drawn at
// (a country centroid plus a small deterministic per-login jitter so
// co-located devs don't stack on the exact same pixel).

export interface GlobePoint {
	login: string;
	name: string | null;
	avatarUrl: string;
	followers: number;
	/** Original free-text GitHub location (kept for the tooltip/list). */
	location: string;
	/** Final marker latitude (centroid + deterministic jitter). */
	lat: number;
	/** Final marker longitude (centroid + deterministic jitter). */
	lng: number;
}
