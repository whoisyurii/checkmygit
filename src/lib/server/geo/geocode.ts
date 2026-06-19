// Free-text GitHub "location" -> globe coordinates.
//
// geocodeLocation() turns messy, user-entered location strings into a
// country centroid {lat, lng, country} | null. It is intentionally coarse:
// we only resolve to country granularity (good enough for globe markers).
//
// Strategy (first hit wins):
//   1. Reject junk ("remote", "earth", "127.0.0.1", pure emoji, ...).
//   2. Split on commas; scan tokens right-to-left for:
//        - a US state name/abbreviation -> United States (only on
//          multi-token input, so a bare "Georgia" stays the country)
//        - a known subnational region (e.g. Ontario -> Canada)
//        - a known country (alias map / centroid table)
//        - a major tech city -> its country
//   3. null if nothing resolves.
//
// jitterPoint() applies a small, DETERMINISTIC offset (hashed from the
// login string, never Math.random) so co-located devs don't stack on the
// exact same coordinate and renders stay stable across reloads/SSR.
//
// Dependency-free by design.

import { COUNTRY_CENTROIDS, COUNTRY_ALIASES, type Centroid } from './country-centroids';

export interface GeocodeResult {
	lat: number;
	lng: number;
	country: string;
}

// Strings that are not real places. Compared against the fully-normalized
// (lowercased, trimmed) raw value AND against individual tokens.
const JUNK_LOCATIONS = new Set<string>([
	'remote',
	'remote-first',
	'fully remote',
	'work from home',
	'wfh',
	'earth',
	'planet earth',
	'world',
	'worldwide',
	'global',
	'globe',
	'everywhere',
	'anywhere',
	'somewhere',
	'nowhere',
	'here',
	'there',
	'home',
	'internet',
	'the internet',
	'on the internet',
	'the cloud',
	'cloud',
	'localhost',
	'127.0.0.1',
	'0.0.0.0',
	'::1',
	'/dev/null',
	'n/a',
	'na',
	'none',
	'null',
	'undefined',
	'unknown',
	'tbd',
	'somewhere on earth',
	'milky way',
	'mars',
	'moon',
	'metaverse',
	'cyberspace',
	'matrix',
	'your heart',
	'your mom',
	'in transit',
	'nomad',
	'digital nomad',
	'traveling',
	'travelling'
]);

// US state names + abbreviations + DC -> all map to United States.
const US_STATES = new Set<string>([
	'alabama',
	'al',
	'alaska',
	'ak',
	'arizona',
	'az',
	'arkansas',
	'ar',
	'california',
	'ca',
	'cali',
	'colorado',
	'co',
	'connecticut',
	'ct',
	'delaware',
	'de',
	'florida',
	'fl',
	'georgia', // ambiguous w/ the country; US-state lookup only runs on multi-token input
	'ga',
	'hawaii',
	'hi',
	'idaho',
	'id',
	'illinois',
	'il',
	'indiana',
	'in',
	'iowa',
	'ia',
	'kansas',
	'ks',
	'kentucky',
	'ky',
	'louisiana',
	'la',
	'maine',
	'me',
	'maryland',
	'md',
	'massachusetts',
	'ma',
	'mass',
	'michigan',
	'mi',
	'minnesota',
	'mn',
	'mississippi',
	'ms',
	'missouri',
	'mo',
	'montana',
	'mt',
	'nebraska',
	'ne',
	'nevada',
	'nv',
	'new hampshire',
	'nh',
	'new jersey',
	'nj',
	'new mexico',
	'nm',
	'new york',
	'new york city',
	'nyc',
	'ny',
	'north carolina',
	'nc',
	'north dakota',
	'nd',
	'ohio',
	'oh',
	'oklahoma',
	'ok',
	'oregon',
	'or',
	'pennsylvania',
	'pa',
	'rhode island',
	'ri',
	'south carolina',
	'sc',
	'south dakota',
	'sd',
	'tennessee',
	'tn',
	'texas',
	'tx',
	'utah',
	'ut',
	'vermont',
	'vt',
	'virginia',
	'va',
	'washington',
	'wa',
	'washington dc',
	'washington d.c.',
	'd.c.',
	'dc',
	'west virginia',
	'wv',
	'wisconsin',
	'wi',
	'wyoming',
	'wy',
	'puerto rico',
	'pr'
]);

// Well-known non-US subnational regions (provinces / states) -> canonical
// country. Consulted in the right-to-left scan so a trailing region token
// (e.g. "London, Ontario") resolves to the correct country before a
// left-token city name (e.g. "London" -> United Kingdom) can win.
const SUBNATIONAL_REGIONS: Record<string, string> = {
	// Canada
	ontario: 'Canada',
	quebec: 'Canada',
	québec: 'Canada',
	'british columbia': 'Canada',
	alberta: 'Canada',
	manitoba: 'Canada',
	saskatchewan: 'Canada',
	'nova scotia': 'Canada',
	'new brunswick': 'Canada',
	// Australia
	'new south wales': 'Australia',
	nsw: 'Australia',
	victoria: 'Australia',
	queensland: 'Australia',
	'western australia': 'Australia',
	'south australia': 'Australia',
	tasmania: 'Australia'
};

// ~70 major tech / dev hubs -> canonical country name (key of
// COUNTRY_CENTROIDS). Used when a token is a bare city with no country.
const CITY_TO_COUNTRY: Record<string, string> = {
	// United States
	'san francisco': 'United States',
	sf: 'United States',
	'sf bay area': 'United States',
	'bay area': 'United States',
	'silicon valley': 'United States',
	'palo alto': 'United States',
	'mountain view': 'United States',
	'san jose': 'United States',
	'los angeles': 'United States',
	la: 'United States',
	'new york': 'United States',
	nyc: 'United States',
	brooklyn: 'United States',
	seattle: 'United States',
	austin: 'United States',
	boston: 'United States',
	chicago: 'United States',
	denver: 'United States',
	portland: 'United States',
	'san diego': 'United States',
	atlanta: 'United States',
	miami: 'United States',
	washington: 'United States',
	// Canada
	toronto: 'Canada',
	vancouver: 'Canada',
	montreal: 'Canada',
	montréal: 'Canada',
	ottawa: 'Canada',
	waterloo: 'Canada',
	// United Kingdom
	london: 'United Kingdom',
	manchester: 'United Kingdom',
	edinburgh: 'United Kingdom',
	cambridge: 'United Kingdom',
	bristol: 'United Kingdom',
	// Europe
	berlin: 'Germany',
	munich: 'Germany',
	münchen: 'Germany',
	hamburg: 'Germany',
	cologne: 'Germany',
	paris: 'France',
	lyon: 'France',
	amsterdam: 'Netherlands',
	rotterdam: 'Netherlands',
	madrid: 'Spain',
	barcelona: 'Spain',
	lisbon: 'Portugal',
	lisboa: 'Portugal',
	porto: 'Portugal',
	milan: 'Italy',
	milano: 'Italy',
	rome: 'Italy',
	roma: 'Italy',
	zurich: 'Switzerland',
	zürich: 'Switzerland',
	geneva: 'Switzerland',
	vienna: 'Austria',
	wien: 'Austria',
	stockholm: 'Sweden',
	oslo: 'Norway',
	copenhagen: 'Denmark',
	københavn: 'Denmark',
	helsinki: 'Finland',
	dublin: 'Ireland',
	brussels: 'Belgium',
	warsaw: 'Poland',
	warszawa: 'Poland',
	kraków: 'Poland',
	krakow: 'Poland',
	prague: 'Czechia',
	praha: 'Czechia',
	budapest: 'Hungary',
	bucharest: 'Romania',
	bucureşti: 'Romania',
	athens: 'Greece',
	moscow: 'Russia',
	москва: 'Russia',
	'saint petersburg': 'Russia',
	'st petersburg': 'Russia',
	kyiv: 'Ukraine',
	kiev: 'Ukraine',
	tallinn: 'Estonia',
	// Asia
	bangalore: 'India',
	bengaluru: 'India',
	mumbai: 'India',
	delhi: 'India',
	'new delhi': 'India',
	hyderabad: 'India',
	pune: 'India',
	chennai: 'India',
	tokyo: 'Japan',
	osaka: 'Japan',
	kyoto: 'Japan',
	seoul: 'South Korea',
	beijing: 'China',
	shanghai: 'China',
	shenzhen: 'China',
	guangzhou: 'China',
	hangzhou: 'China',
	'hong kong': 'Hong Kong',
	taipei: 'Taiwan',
	singapore: 'Singapore',
	'kuala lumpur': 'Malaysia',
	jakarta: 'Indonesia',
	bangkok: 'Thailand',
	'ho chi minh city': 'Vietnam',
	hanoi: 'Vietnam',
	manila: 'Philippines',
	karachi: 'Pakistan',
	lahore: 'Pakistan',
	dhaka: 'Bangladesh',
	'tel aviv': 'Israel',
	dubai: 'United Arab Emirates',
	'abu dhabi': 'United Arab Emirates',
	istanbul: 'Turkey',
	tehran: 'Iran',
	// Africa
	lagos: 'Nigeria',
	abuja: 'Nigeria',
	nairobi: 'Kenya',
	'cape town': 'South Africa',
	johannesburg: 'South Africa',
	cairo: 'Egypt',
	accra: 'Ghana',
	// South / Central America & Oceania
	'sao paulo': 'Brazil',
	'são paulo': 'Brazil',
	'rio de janeiro': 'Brazil',
	'buenos aires': 'Argentina',
	'mexico city': 'Mexico',
	'ciudad de méxico': 'Mexico',
	bogota: 'Colombia',
	bogotá: 'Colombia',
	santiago: 'Chile',
	lima: 'Peru',
	sydney: 'Australia',
	melbourne: 'Australia',
	brisbane: 'Australia',
	auckland: 'New Zealand',
	wellington: 'New Zealand'
};

// Strip emoji / pictographic codepoints and collapse whitespace. Used both
// to detect pure-emoji input and to clean tokens (e.g. flag-emoji + city).
function stripEmoji(value: string): string {
	// Remove emoji, symbols, regional indicators, variation selectors, ZWJ.
	return value
		.replace(
			/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{FE00}-\u{FE0F}\u{200D}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}]/gu,
			' '
		)
		.replace(/\s+/g, ' ')
		.trim();
}

function normalize(value: string): string {
	return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Resolve a single normalized token to a canonical country name, or null.
// `allowUsState` gates the ambiguous US-state path (so a bare "georgia"
// stays the country, but "Atlanta, Georgia" / "Georgia, USA" resolves to US).
//
// ORDER MATTERS: the US-state check runs FIRST (when allowed) so that a
// two-letter state abbreviation like "ca"/"in"/"co"/"de"/"id" in a
// "City, ST" location resolves to the United States rather than colliding
// with the ISO-2 country-code aliases in COUNTRY_ALIASES (ca=Canada,
// in=India, co=Colombia, de=Germany, id=Indonesia).
// Lowercased canonical country name -> canonical name, built once for O(1)
// lookup (avoids re-scanning + lowercasing every country name per token).
const COUNTRY_BY_LOWER = new Map(
	Object.keys(COUNTRY_CENTROIDS).map((name) => [name.toLowerCase(), name])
);

function resolveToken(token: string, allowUsState: boolean): string | null {
	if (!token) return null;
	// US state (only when context allows it) -- BEFORE alias/canonical lookup
	// so state abbreviations beat ISO-2 country codes.
	if (allowUsState && US_STATES.has(token)) return 'United States';
	// Known non-US subnational region (e.g. Ontario -> Canada).
	if (SUBNATIONAL_REGIONS[token]) return SUBNATIONAL_REGIONS[token];
	// Direct country alias (covers "usa", "uk", "deutschland", native names, ...).
	if (COUNTRY_ALIASES[token]) return COUNTRY_ALIASES[token];
	// Direct canonical country name (e.g. "germany", "japan").
	const canonical = COUNTRY_BY_LOWER.get(token);
	if (canonical) return canonical;
	// Major tech city.
	if (CITY_TO_COUNTRY[token]) return CITY_TO_COUNTRY[token];
	return null;
}

/**
 * Geocode a free-text GitHub location into a country centroid.
 * Returns null for junk / unrecognized input.
 */
export function geocodeLocation(raw: string | null): GeocodeResult | null {
	if (!raw) return null;

	// Pure-emoji or symbol-only input -> nothing left after stripping.
	const deEmojied = stripEmoji(raw);
	if (!deEmojied) return null;

	const full = normalize(deEmojied);
	if (!full) return null;
	if (JUNK_LOCATIONS.has(full)) return null;

	// Split into comma-separated parts; each part is its own token.
	const parts = full
		.split(',')
		.map((p) => normalize(p))
		.filter((p) => p.length > 0 && !JUNK_LOCATIONS.has(p));
	if (parts.length === 0) return null;

	const multiToken = parts.length > 1;

	// Country/state context is most reliable in the rightmost parts
	// ("City, State, Country"), so scan right-to-left first.
	for (let i = parts.length - 1; i >= 0; i--) {
		const country = resolveToken(parts[i], multiToken);
		if (country && COUNTRY_CENTROIDS[country]) {
			const c: Centroid = COUNTRY_CENTROIDS[country];
			return { lat: c.lat, lng: c.lng, country };
		}
	}

	// Fallback: a whole-string lookup (handles single tokens that contain a
	// space but no comma, e.g. "new york", "san francisco", "hong kong").
	const whole = resolveToken(full, multiToken);
	if (whole && COUNTRY_CENTROIDS[whole]) {
		const c: Centroid = COUNTRY_CENTROIDS[whole];
		return { lat: c.lat, lng: c.lng, country: whole };
	}

	return null;
}

// FNV-1a style 32-bit string hash. Deterministic, dependency-free.
function hashString(value: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < value.length; i++) {
		hash ^= value.charCodeAt(i);
		// hash *= 16777619, kept in 32-bit range via Math.imul.
		hash = Math.imul(hash, 0x01000193);
	}
	// Force to unsigned 32-bit.
	return hash >>> 0;
}

/**
 * Spread co-located developers around a shared centroid with a small,
 * deterministic offset derived from the login string. Same login always
 * yields the same offset (stable across SSR / reloads), and NO Math.random.
 * Offset magnitude is ~+/-1.5 degrees on each axis.
 */
export function jitterPoint(login: string, lat: number, lng: number): { lat: number; lng: number } {
	const SPREAD = 1.5; // max degrees of offset per axis
	const h = hashString(login);
	// Two independent pseudo-random-but-deterministic fractions in [0, 1).
	const fracLat = (h & 0xffff) / 0x10000;
	const fracLng = ((h >>> 16) & 0xffff) / 0x10000;
	// Map [0,1) -> [-SPREAD, +SPREAD).
	const dLat = (fracLat * 2 - 1) * SPREAD;
	const dLng = (fracLng * 2 - 1) * SPREAD;
	// Clamp latitude to valid range; wrap longitude into [-180, 180).
	let nextLat = lat + dLat;
	if (nextLat > 90) nextLat = 90;
	if (nextLat < -90) nextLat = -90;
	let nextLng = lng + dLng;
	if (nextLng >= 180) nextLng -= 360;
	if (nextLng < -180) nextLng += 360;
	return { lat: nextLat, lng: nextLng };
}
