// Server-side data layer for the /globe feature.
//
// fetchGlobePoints() returns a GlobePoint[] (sorted by followers, desc) for the
// cobe globe + the accessible list. It runs a LEAN GitHub GraphQL user search
// (no per-user repository sub-query -- that nested query is slow and 502s at
// first:100), geocodes each user's free-text location to a country centroid,
// applies a deterministic per-login jitter, and aggregates the result.
//
// Resilient by design:
//   - KV cache is used ONLY when the Cloudflare binding exists
//     (platform?.env?.PROFILE_VIEWS); plain `vite dev` skips it.
//   - It NEVER throws: any failure (no token, rate limit, no geocodable users)
//     falls back to a curated SAMPLE_POINTS set so the globe is never empty.

import { env } from '$env/dynamic/private';
import { geocodeLocation, jitterPoint } from './geo/geocode';
import { kvReadWithRetry, type KV } from './kv/retry';
import type { GlobePoint } from '$lib/types/globe';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const KV_KEY = 'globe:points:v3';
const KV_TTL_SECONDS = 86_400; // 24h
// GitHub search caps `first` at 100 per request, and only ~60% of top users
// have a geocodable location, so we page through and accumulate geocoded devs
// until we reach TARGET_POINTS.
const PAGE_SIZE = 100; // max GitHub allows per search request
const MAX_PAGES = 3; // safety bound on requests (~300 candidates)
const TARGET_POINTS = 100; // plotted devs we aim for

// Lean user search (identity + followers + location only), paginated via `after`.
const TOP_USERS_LEAN_QUERY = `
query GlobeUsers($query: String!, $first: Int!, $after: String) {
  search(query: $query, type: USER, first: $first, after: $after) {
    pageInfo { endCursor hasNextPage }
    nodes {
      ... on User {
        login
        name
        avatarUrl
        location
        followers { totalCount }
      }
    }
  }
}`;

interface LeanUserNode {
	login: string;
	name: string | null;
	avatarUrl: string;
	location: string | null;
	followers: { totalCount: number };
}

// SAMPLE DATA -- curated, well-known developers with known cities/countries.
// Used ONLY as a fallback when the live fetch yields no geocodable users
// (missing token, rate limit, all-junk locations) so the globe never renders
// empty. Coordinates are produced through the same geocode + jitter path as
// live data, so they look identical on the globe.
const SAMPLE_SEED: Array<{ login: string; name: string; followers: number; location: string }> = [
	{ login: 'torvalds', name: 'Linus Torvalds', followers: 230000, location: 'Portland, OR' },
	{ login: 'yyx990803', name: 'Evan You', followers: 100000, location: 'Singapore' },
	{ login: 'gaearon', name: 'Dan Abramov', followers: 95000, location: 'London, UK' },
	{ login: 'sindresorhus', name: 'Sindre Sorhus', followers: 70000, location: 'Norway' },
	{ login: 'tiangolo', name: 'Sebastián Ramírez', followers: 50000, location: 'Berlin, Germany' },
	{ login: 'addyosmani', name: 'Addy Osmani', followers: 45000, location: 'Mountain View, CA' },
	{ login: 'Rich-Harris', name: 'Rich Harris', followers: 40000, location: 'New York, USA' },
	{ login: 'tj', name: 'TJ Holowaychuk', followers: 40000, location: 'San Francisco, CA' },
	{ login: 'kentcdodds', name: 'Kent C. Dodds', followers: 35000, location: 'Utah, USA' },
	{ login: 'antfu', name: 'Anthony Fu', followers: 32000, location: 'Paris, France' },
	{ login: 'taylorotwell', name: 'Taylor Otwell', followers: 30000, location: 'Arkansas, USA' },
	{ login: 'peng-zhihui', name: 'Zhihui Peng', followers: 28000, location: 'Shanghai, China' },
	{ login: 'ruanyf', name: 'Ruan Yifeng', followers: 80000, location: 'Shanghai, China' },
	{ login: 'midudev', name: 'Miguel Ángel Durán', followers: 20000, location: 'Barcelona, Spain' },
	{
		login: 'hiteshchoudhary',
		name: 'Hitesh Choudhary',
		followers: 25000,
		location: 'Jaipur, India'
	}
];

function seedToPoint(seed: {
	login: string;
	name: string;
	followers: number;
	location: string;
}): GlobePoint | null {
	const geo = geocodeLocation(seed.location);
	if (!geo) return null;
	const j = jitterPoint(seed.login, geo.lat, geo.lng);
	return {
		login: seed.login,
		name: seed.name,
		avatarUrl: `https://avatars.githubusercontent.com/${seed.login}`,
		followers: seed.followers,
		location: seed.location,
		lat: j.lat,
		lng: j.lng
	};
}

function buildSamplePoints(): GlobePoint[] {
	return SAMPLE_SEED.map(seedToPoint)
		.filter((p): p is GlobePoint => p !== null)
		.sort((a, b) => b.followers - a.followers);
}

function nodeToPoint(node: LeanUserNode): GlobePoint | null {
	const geo = geocodeLocation(node.location);
	if (!geo) return null;
	const j = jitterPoint(node.login, geo.lat, geo.lng);
	const raw = node.location?.trim();
	return {
		login: node.login,
		name: node.name,
		avatarUrl: node.avatarUrl,
		followers: node.followers.totalCount,
		location: raw && raw.length > 0 ? raw : geo.country,
		lat: j.lat,
		lng: j.lng
	};
}

async function fetchLivePoints(): Promise<GlobePoint[]> {
	const token = env.GITHUB_TOKEN;
	if (!token) return [];

	const points: GlobePoint[] = [];
	const seen = new Set<string>();
	let after: string | null = null;

	// Page through the most-followed users, geocoding as we go, until we have
	// TARGET_POINTS plotted devs (or run out of pages).
	for (let page = 0; page < MAX_PAGES && points.length < TARGET_POINTS; page++) {
		const response = await fetch(GITHUB_GRAPHQL_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
				'User-Agent': 'CheckMyGit'
			},
			body: JSON.stringify({
				query: TOP_USERS_LEAN_QUERY,
				variables: { query: 'followers:>1000 sort:followers type:user', first: PAGE_SIZE, after }
			})
		});

		if (!response.ok) break;

		const json = (await response.json()) as {
			data?: {
				search?: {
					nodes?: (LeanUserNode | null)[];
					pageInfo?: { endCursor: string | null; hasNextPage: boolean };
				};
			};
			errors?: unknown;
		};
		if (json.errors || !json.data?.search?.nodes) break;

		for (const node of json.data.search.nodes) {
			if (!node || typeof node.login !== 'string' || seen.has(node.login)) continue;
			seen.add(node.login);
			const pt = nodeToPoint(node);
			if (pt) points.push(pt);
		}

		const pageInfo = json.data.search.pageInfo;
		if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break;
		after = pageInfo.endCursor;
	}

	return points.sort((a, b) => b.followers - a.followers).slice(0, TARGET_POINTS);
}

function isKVAvailable(platform: App.Platform | undefined): boolean {
	return !!platform?.env?.PROFILE_VIEWS;
}

/**
 * Fetch the GlobePoint[] for the /globe page, sorted by followers (desc).
 * Never throws; always returns a populated array (cached, live, or SAMPLE).
 */
export async function fetchGlobePoints({
	platform
}: {
	platform?: App.Platform;
}): Promise<GlobePoint[]> {
	const kv: KV | null = isKVAvailable(platform) ? platform!.env.PROFILE_VIEWS : null;

	// 1. KV cache (guarded -- only when the binding exists).
	if (kv) {
		try {
			const cached = await kvReadWithRetry(kv, KV_KEY);
			if (cached) {
				const parsed = JSON.parse(cached) as GlobePoint[];
				if (Array.isArray(parsed) && parsed.length > 0) return parsed;
			}
		} catch {
			// Ignore cache read/parse errors and recompute.
		}
	}

	// 2. Compute live (lean query). Swallow failures -> SAMPLE fallback.
	let points: GlobePoint[] = [];
	try {
		points = await fetchLivePoints();
	} catch {
		points = [];
	}

	// 3. Fall back to curated SAMPLE data when nothing geocoded.
	if (points.length === 0) return buildSamplePoints();

	// 4. Cache the live result (guarded; never let a KV failure throw).
	if (kv) {
		try {
			await kv.put(KV_KEY, JSON.stringify(points), { expirationTtl: KV_TTL_SECONDS });
		} catch {
			// Ignore cache write errors.
		}
	}

	return points;
}
