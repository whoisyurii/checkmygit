<script lang="ts">
	import { pushState } from '$app/navigation';
	import Card from '$lib/components/ui/Card.svelte';
	import TrendIcon from '$lib/components/ui/TrendIcon.svelte';
	import SegmentedTabs from '$lib/components/ui/SegmentedTabs.svelte';
	import TrendingTable from '$lib/components/rankings/TrendingTable.svelte';
	import TrendingTableSkeleton from '$lib/components/rankings/TrendingTableSkeleton.svelte';
	import TrendingFilters from '$lib/components/rankings/TrendingFilters.svelte';
	import { SITE_URL } from '$lib/constants';
	import {
		TRENDING_WINDOWS,
		WINDOW_LABEL,
		WINDOW_PERIOD_TEXT,
		DEFAULT_TRENDING_WINDOW,
		type TrendingWindow,
		type TrendingResult
	} from '$lib/types/trending';

	const windowItems = TRENDING_WINDOWS.map((w) => ({ value: w, label: WINDOW_LABEL[w] }));
	// Empty result used while a streamed SSR promise or a client filter-switch
	// fetch is in flight. `loading` gates rendering, so callers never see this
	// as a real result — `source` is just a stable placeholder.
	const PENDING_REPOS: TrendingResult = { success: true, data: [], source: 'fallback' };
	const FAILED_REPOS: TrendingResult = {
		success: false,
		data: [],
		source: 'fallback',
		error: 'Failed to load'
	};

	let { data } = $props();

	// `data.repos` is `TrendingResult` on cache hit (full HTML in initial response)
	// or `Promise<TrendingResult>` on cache miss (streamed). Initialize repos/loading
	// to match so the SSR HTML reflects the cache state.
	/* svelte-ignore state_referenced_locally */
	let since = $state<TrendingWindow>(data.since);
	/* svelte-ignore state_referenced_locally */
	let language = $state<string>(data.language);
	/* svelte-ignore state_referenced_locally */
	let repos = $state<TrendingResult>(data.repos instanceof Promise ? PENDING_REPOS : data.repos);
	/* svelte-ignore state_referenced_locally */
	let loading = $state<boolean>(data.repos instanceof Promise);

	let inFlightFetch: AbortController | null = null;
	// Token to ignore stale streamed-promise resolutions if the loader re-runs
	// (or a client filter switch fires) before the original promise settles.
	let streamToken = 0;

	// Re-sync when the load function actually re-runs (e.g. arriving via a header link
	// to /trending with different params). pushState-driven changes don't fire this.
	// Cancel any client fetch first so a stale response can't clobber fresh server data.
	$effect(() => {
		if (inFlightFetch) {
			inFlightFetch.abort();
			inFlightFetch = null;
		}
		since = data.since;
		language = data.language;

		const incoming = data.repos;
		if (incoming instanceof Promise) {
			loading = true;
			repos = PENDING_REPOS;
			const token = ++streamToken;
			incoming
				.then((result) => {
					if (token !== streamToken) return;
					repos = result;
					loading = false;
				})
				.catch(() => {
					if (token !== streamToken) return;
					repos = FAILED_REPOS;
					loading = false;
				});
		} else {
			streamToken++;
			repos = incoming;
			loading = false;
		}
	});

	$effect(() => {
		const handler = () => {
			const u = new URL(window.location.href);
			const nextSince = (u.searchParams.get('since') as TrendingWindow) || DEFAULT_TRENDING_WINDOW;
			const nextLang = u.searchParams.get('language') || '';
			if (nextSince === since && nextLang === language) return;
			since = nextSince;
			language = nextLang;
			void fetchData();
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	});

	async function fetchData() {
		inFlightFetch?.abort();
		// Invalidate any pending streamed SSR promise so its late resolution
		// can't clobber the response we're about to fetch here.
		streamToken++;
		const controller = new AbortController();
		inFlightFetch = controller;
		loading = true;

		const apiUrl = new URL('/api/trending', window.location.origin);
		apiUrl.searchParams.set('since', since);
		if (language) apiUrl.searchParams.set('language', language);

		try {
			const res = await fetch(apiUrl.toString(), { signal: controller.signal });
			const result = (await res.json()) as TrendingResult;
			if (inFlightFetch === controller) repos = result;
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			if (inFlightFetch === controller) {
				repos = FAILED_REPOS;
			}
		} finally {
			if (inFlightFetch === controller) {
				loading = false;
				inFlightFetch = null;
			}
		}
	}

	function pushTrendingUrl() {
		const url = new URL('/explore/trending', window.location.origin);
		if (since !== DEFAULT_TRENDING_WINDOW) url.searchParams.set('since', since);
		if (language) url.searchParams.set('language', language);
		pushState(url, {});
	}

	async function switchWindow(next: TrendingWindow) {
		if (next === since) return;
		since = next;
		pushTrendingUrl();
		await fetchData();
	}

	async function changeLanguage(next: string) {
		if (next === language) return;
		language = next;
		pushTrendingUrl();
		await fetchData();
	}

	const langPrefix = $derived(language ? `${language} ` : '');
	const titleBase = $derived(`🔥 Trending ${langPrefix}Repos ${WINDOW_LABEL[since]} – CheckMyGit`);
	const description = $derived(
		`The 25 fastest-growing ${langPrefix}repositories on GitHub ${WINDOW_PERIOD_TEXT[since]}. Updated regularly.`
	);
	const h1Title = $derived(`Trending ${langPrefix}Repos ${WINDOW_LABEL[since]}`);

	const canonicalUrl = $derived.by(() => {
		const u = new URL(`${SITE_URL}/explore/trending`);
		if (since !== DEFAULT_TRENDING_WINDOW) u.searchParams.set('since', since);
		if (language) u.searchParams.set('language', language);
		return u.toString();
	});

	const jsonLdScript = $derived.by(() => {
		if (!repos.success || repos.data.length === 0) return '';
		const json = JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: h1Title,
			description,
			numberOfItems: repos.data.length,
			itemListElement: repos.data.map((r) => ({
				'@type': 'ListItem',
				position: r.rank,
				item: {
					'@type': 'SoftwareSourceCode',
					name: r.nameWithOwner,
					url: r.url,
					codeRepository: r.url,
					programmingLanguage: r.language?.name,
					description: r.description ?? undefined
				}
			}))
		}).replace(/</g, '\\u003c');
		return `<script type="application/ld+json">${json}</` + `script>`;
	});
</script>

<svelte:head>
	<title>{titleBase}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={titleBase} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={titleBase} />
	<meta name="twitter:description" content={description} />
	{#if jsonLdScript}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdScript}
	{/if}
</svelte:head>

<div class="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-6 lg:px-8">
	<!-- Header section -->
	<div class="mb-8 text-center">
		<h1
			class="mb-3 inline-flex items-center justify-center gap-2.5 text-3xl font-bold text-text-primary sm:text-4xl"
		>
			<TrendIcon size={32} class="text-accent" />
			Trending
			{#if language}
				<span class="text-text-secondary">{language}</span>
			{/if}
		</h1>
		<p class="text-lg text-text-secondary">
			The hottest repositories on GitHub right now — updated regularly.
		</p>
	</div>

	<!-- Window tabs -->
	<div class="mb-6 flex justify-center">
		<SegmentedTabs
			items={windowItems}
			value={since}
			onchange={switchWindow}
			ariaLabel="Time window"
		>
			{#snippet icon({ active })}
				{#if active}<TrendIcon size={14} />{/if}
			{/snippet}
		</SegmentedTabs>
	</div>

	<!-- Language filter -->
	<div class="mb-6 flex flex-wrap items-center justify-center gap-4">
		<TrendingFilters {language} onchange={changeLanguage} />
	</div>

	<!-- Content -->
	<Card variant="default" padding="none">
		{#if loading}
			<TrendingTableSkeleton />
		{:else if !repos.success}
			<div class="p-8 text-center">
				<svg
					class="mx-auto mb-4 h-12 w-12 text-accent-red"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<p class="text-text-secondary">
					{repos.error || 'Failed to load trending repositories'}
				</p>
			</div>
		{:else if repos.data.length === 0}
			<div class="p-8 text-center">
				<p class="text-text-secondary">No trending repositories found.</p>
			</div>
		{:else}
			<TrendingTable repos={repos.data} {since} />
		{/if}
	</Card>

	<p class="mt-6 text-center text-sm text-text-tertiary">
		Click any row to view the developer's CheckMyGit portfolio.
	</p>
</div>
