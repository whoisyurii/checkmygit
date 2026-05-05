import type { TrendingRepository, TrendingResult, TrendingWindow } from '$lib/types/trending';
import { fetchTopRepositories } from './rankings';

const TRENDING_URL = 'https://github.com/trending';
const USER_AGENT = 'CheckMyGit/1.0 (+https://checkmygit.com)';

const TTL_BY_WINDOW: Record<TrendingWindow, { fresh: number; swr: number }> = {
	daily: { fresh: 60 * 60, swr: 60 * 60 * 6 },
	weekly: { fresh: 60 * 60 * 6, swr: 60 * 60 * 24 },
	monthly: { fresh: 60 * 60 * 24, swr: 60 * 60 * 24 * 7 }
};

function buildCacheKey(since: TrendingWindow, language: string | undefined): string {
	const lang = language ? language.toLowerCase() : 'all';
	return `https://kv-cache/_/trending/${since}/${lang}`;
}

function buildTrendingUrl(since: TrendingWindow, language: string | undefined): string {
	const params = new URLSearchParams({ since });
	const url = new URL(TRENDING_URL);
	if (language) url.pathname = `/trending/${encodeURIComponent(language.toLowerCase())}`;
	url.search = params.toString();
	return url.toString();
}

const ARTICLE_RE = /<article class="Box-row">([\s\S]*?)<\/article>/g;
const REPO_HREF_RE = /<h2 class="h3 lh-condensed">[\s\S]*?<a [^>]*href="\/([^"]+)"/;
const DESC_RE = /<p class="col-9 color-fg-muted my-1 tmp-pr-4">\s*([\s\S]*?)\s*<\/p>/;
const LANG_NAME_RE = /<span itemprop="programmingLanguage">([^<]+)<\/span>/;
const LANG_COLOR_RE = /<span class="repo-language-color" style="background-color:\s*([^"]+)"/;
const STARS_RE = /href="\/[^"]+\/stargazers"[\s\S]*?<\/svg>\s*([\d,]+)\s*<\/a>/;
const FORKS_RE = /href="\/[^"]+\/forks"[\s\S]*?<\/svg>\s*([\d,]+)\s*<\/a>/;
const PERIOD_STARS_RE = /class="d-inline-block float-sm-right">[\s\S]*?<\/svg>\s*([\d,]+)\s+stars/;

function decodeHtmlEntities(s: string): string {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ');
}

function parseNumberWithCommas(text: string): number {
	return parseInt(text.replace(/,/g, ''), 10) || 0;
}

function parseTrendingHtml(html: string): TrendingRepository[] {
	const repos: TrendingRepository[] = [];
	let match: RegExpExecArray | null;
	let rank = 0;

	ARTICLE_RE.lastIndex = 0;
	while ((match = ARTICLE_RE.exec(html)) !== null) {
		const block = match[1];
		const repoMatch = REPO_HREF_RE.exec(block);
		if (!repoMatch) continue;

		const path = repoMatch[1].trim();
		const [owner, name] = path.split('/');
		if (!owner || !name) continue;

		const descMatch = DESC_RE.exec(block);
		const description = descMatch
			? decodeHtmlEntities(descMatch[1].replace(/\s+/g, ' ').trim())
			: null;

		const langName = LANG_NAME_RE.exec(block)?.[1] ?? null;
		const langColor = LANG_COLOR_RE.exec(block)?.[1]?.trim() ?? null;
		const language = langName ? { name: langName, color: langColor || '#888' } : null;

		const starsMatch = STARS_RE.exec(block);
		const forksMatch = FORKS_RE.exec(block);
		const periodMatch = PERIOD_STARS_RE.exec(block);

		rank += 1;
		repos.push({
			rank,
			owner,
			name,
			nameWithOwner: `${owner}/${name}`,
			url: `https://github.com/${owner}/${name}`,
			description: description || null,
			language,
			stargazerCount: starsMatch ? parseNumberWithCommas(starsMatch[1]) : 0,
			forkCount: forksMatch ? parseNumberWithCommas(forksMatch[1]) : 0,
			periodStars: periodMatch ? parseNumberWithCommas(periodMatch[1]) : 0,
			avatarUrl: `https://avatars.githubusercontent.com/${owner}?size=80`
		});
	}

	return repos;
}

async function fetchAndParse(
	since: TrendingWindow,
	language: string | undefined
): Promise<TrendingRepository[]> {
	const response = await fetch(buildTrendingUrl(since, language), {
		headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
		cf: { cacheTtl: TTL_BY_WINDOW[since].fresh, cacheEverything: true }
	} as RequestInit);

	if (!response.ok) {
		throw new Error(`GitHub trending fetch failed: ${response.status}`);
	}

	const html = await response.text();
	return parseTrendingHtml(html);
}

interface FetchTrendingOptions {
	since: TrendingWindow;
	language?: string;
	caches?: CacheStorage & { default: Cache };
	waitUntil?: (p: Promise<unknown>) => void;
}

export async function fetchTrending({
	since,
	language,
	caches,
	waitUntil
}: FetchTrendingOptions): Promise<TrendingResult> {
	const cacheKey = buildCacheKey(since, language);
	const ttl = TTL_BY_WINDOW[since];

	if (caches) {
		const cached = await caches.default.match(new Request(cacheKey));
		if (cached) {
			const data = (await cached.json()) as TrendingRepository[];
			return { success: true, data, source: 'cache' };
		}
	}

	try {
		const data = await fetchAndParse(since, language);
		if (data.length === 0) throw new Error('Parsed zero repositories');

		if (caches) {
			const cacheResponse = new Response(JSON.stringify(data), {
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': `public, max-age=${ttl.fresh}, stale-while-revalidate=${ttl.swr}`
				}
			});
			const put = caches.default.put(new Request(cacheKey), cacheResponse);
			if (waitUntil) waitUntil(put);
			else await put;
		}

		return { success: true, data, source: 'live' };
	} catch (error) {
		const fallback = await fetchTopRepositories(language, 25, true);
		if (fallback.success) {
			const data: TrendingRepository[] = fallback.data.map((r) => ({
				rank: r.rank,
				owner: r.owner.login,
				name: r.nameWithOwner.split('/')[1] ?? r.nameWithOwner,
				nameWithOwner: r.nameWithOwner,
				url: r.url,
				description: r.description,
				language: r.primaryLanguage,
				stargazerCount: r.stargazerCount,
				forkCount: r.forkCount,
				periodStars: 0,
				avatarUrl: r.owner.avatarUrl
			}));
			// Cache the fallback shorter than fresh TTL so a github.com/trending outage
			// doesn't hammer the GraphQL API on every request, but recovers quickly.
			if (caches) {
				const cacheResponse = new Response(JSON.stringify(data), {
					headers: {
						'Content-Type': 'application/json',
						'Cache-Control': `public, max-age=${Math.min(ttl.fresh, 1800)}`
					}
				});
				const put = caches.default.put(new Request(cacheKey), cacheResponse);
				if (waitUntil) waitUntil(put);
				else await put;
			}
			return {
				success: true,
				data,
				source: 'fallback',
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}

		return {
			success: false,
			data: [],
			source: 'fallback',
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}
