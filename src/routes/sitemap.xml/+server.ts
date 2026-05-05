import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/constants';
import { fetchTopUsers } from '$lib/server/rankings';
import { RANKING_LANGUAGES } from '$lib/types/rankings';

const CACHE_KEY = `${SITE_URL}/__sitemap_cache_v2`;
const CACHE_TTL_SECONDS = 60 * 60 * 24;

type Changefreq = 'daily' | 'weekly' | 'monthly';

type StaticUrl = {
	path: string;
	changefreq: Changefreq;
	priority: string;
};

const STATIC_URLS: StaticUrl[] = [
	{ path: '/', changefreq: 'weekly', priority: '1.0' },
	{ path: '/rankings', changefreq: 'daily', priority: '0.9' },
	{ path: '/trending', changefreq: 'daily', priority: '0.9' },
	{ path: '/trending?since=weekly', changefreq: 'weekly', priority: '0.8' },
	{ path: '/trending?since=monthly', changefreq: 'monthly', priority: '0.7' },
	{ path: '/about', changefreq: 'monthly', priority: '0.5' },
	{ path: '/privacy', changefreq: 'monthly', priority: '0.3' }
];

const TRENDING_LANG_PRIORITIES: Record<Changefreq, string> = {
	daily: '0.7',
	weekly: '0.6',
	monthly: '0.5'
};

function buildTrendingLanguageUrls(): StaticUrl[] {
	const urls: StaticUrl[] = [];
	for (const lang of RANKING_LANGUAGES) {
		const langParam = encodeURIComponent(lang);
		(['daily', 'weekly', 'monthly'] as const).forEach((since) => {
			urls.push({
				path: `/trending?language=${langParam}&since=${since}`,
				changefreq: since,
				priority: TRENDING_LANG_PRIORITIES[since]
			});
		});
	}
	return urls;
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function buildSitemap(userLogins: string[]): string {
	const lastmod = new Date().toISOString().split('T')[0];

	const allStatic = [...STATIC_URLS, ...buildTrendingLanguageUrls()];

	const staticEntries = allStatic.map(
		({ path, changefreq, priority }) =>
			`  <url>\n` +
			`    <loc>${SITE_URL}${escapeXml(path)}</loc>\n` +
			`    <lastmod>${lastmod}</lastmod>\n` +
			`    <changefreq>${changefreq}</changefreq>\n` +
			`    <priority>${priority}</priority>\n` +
			`  </url>`
	);

	const userEntries = userLogins.map(
		(login) =>
			`  <url>\n` +
			`    <loc>${SITE_URL}/${escapeXml(login)}</loc>\n` +
			`    <lastmod>${lastmod}</lastmod>\n` +
			`    <changefreq>weekly</changefreq>\n` +
			`    <priority>0.7</priority>\n` +
			`  </url>`
	);

	return (
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		[...staticEntries, ...userEntries].join('\n') +
		`\n</urlset>\n`
	);
}

export const GET: RequestHandler = async ({ platform }) => {
	const caches = platform?.caches;

	if (caches) {
		const cached = await caches.default.match(new Request(CACHE_KEY));
		if (cached) {
			return cached.clone();
		}
	}

	let userLogins: string[] = [];
	try {
		const result = await fetchTopUsers('followers', 100, true);
		if (result.success) {
			userLogins = result.data.map((u) => u.login);
		}
	} catch {
		// Static-only sitemap is a valid fallback when GitHub rate-limits or the token is missing
	}

	const body = buildSitemap(userLogins);
	const response = new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}, stale-while-revalidate=604800`
		}
	});

	if (caches) {
		platform?.context.waitUntil(caches.default.put(new Request(CACHE_KEY), response.clone()));
	}

	return response;
};
