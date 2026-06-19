<script lang="ts">
	import { goto, pushState } from '$app/navigation';
	import { page } from '$app/stores';
	import { SITE_URL } from '$lib/constants';
	import { jsonLd } from '$lib/utils/jsonld';
	import ReposTable from '$lib/components/rankings/ReposTable.svelte';
	import UsersTable from '$lib/components/rankings/UsersTable.svelte';
	import ReposTableSkeleton from '$lib/components/rankings/ReposTableSkeleton.svelte';
	import UsersTableSkeleton from '$lib/components/rankings/UsersTableSkeleton.svelte';
	import LanguageFilter from '$lib/components/rankings/LanguageFilter.svelte';
	import UserSortFilter from '$lib/components/rankings/UserSortFilter.svelte';
	import RepoTypeFilter from '$lib/components/ui/RepoTypeFilter.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SegmentedTabs from '$lib/components/ui/SegmentedTabs.svelte';
	import type { RankedUser, RankedRepository } from '$lib/types/rankings';

	type RankingsTab = 'repos' | 'users';

	let { data } = $props();

	// activeTab is local state (not derived from $page.url) because we use SvelteKit's
	// shallow `pushState` for instant tab switching; pushState updates the browser URL
	// without updating $page.url, so we can't rely on derivation for reactivity.
	let activeTab = $state<RankingsTab>(
		($page.url.searchParams.get('tab') as RankingsTab) || 'repos'
	);

	// Sync activeTab from URL on browser back/forward (popstate)
	$effect(() => {
		const handler = () => {
			const next =
				(new URL(window.location.href).searchParams.get('tab') as RankingsTab) || 'repos';
			if (next !== activeTab) activeTab = next;
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	});

	let repoType = $derived(
		($page.url.searchParams.get('repoType') as 'all' | 'original') || 'original'
	);

	// Client-side user sort state
	let userSortBy = $state<'followers' | 'stars'>('followers');

	// Store resolved data for display
	let resolvedUsers = $state<RankedUser[]>([]);
	let resolvedRepos = $state<RankedRepository[]>([]);

	type ReposResult = { success: boolean; data: RankedRepository[]; error?: string };
	type UsersResult = { success: boolean; data: RankedUser[]; error?: string };

	// Track loading states
	let usersResult = $state<UsersResult | null>(null);
	let reposResult = $state<ReposResult | null>(null);

	// Load More state
	let loadingMore = $state(false);
	let hasMoreRepos = $derived(resolvedRepos.length > 0 && resolvedRepos.length < 25);
	let hasMoreUsers = $derived(resolvedUsers.length > 0 && resolvedUsers.length < 25);

	// Streamed effects only run for the active tab; the inactive tab is server-stubbed
	// to Promise.resolve({success:true, data:[]}) and tab-switch refetches via /api/rankings.
	$effect(() => {
		if (activeTab !== 'repos') return;
		reposResult = null;
		data.streamed.repos.then((result) => {
			reposResult = result;
			if (result.success) resolvedRepos = result.data;
		});
	});

	$effect(() => {
		if (activeTab !== 'users') return;
		usersResult = null;
		data.streamed.users.then((result) => {
			usersResult = result;
			if (result.success) resolvedUsers = result.data;
		});
	});

	// Sort users client-side based on selection
	const sortedUsers = $derived.by(() => {
		const users = [...resolvedUsers];
		if (userSortBy === 'stars') {
			users.sort((a, b) => b.totalStars - a.totalStars);
		} else {
			users.sort((a, b) => b.followers - a.followers);
		}
		// Re-assign ranks
		return users.map((user, index) => ({
			...user,
			rank: index + 1
		}));
	});

	const tabs: { value: RankingsTab; label: string }[] = [
		{ value: 'repos', label: 'Top Repositories' },
		{ value: 'users', label: 'Top Users' }
	];

	const rankingsSchema = $derived.by(() => {
		const items =
			activeTab === 'users'
				? sortedUsers.map((user) => ({
						'@type': 'ListItem',
						position: user.rank,
						url: `${SITE_URL}/${user.login}`,
						name: user.name || user.login
					}))
				: resolvedRepos.map((repo, i) => ({
						'@type': 'ListItem',
						position: i + 1,
						url: repo.url,
						name: repo.nameWithOwner
					}));

		if (items.length === 0) return null;

		return {
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: activeTab === 'users' ? 'Top GitHub Developers' : 'Top GitHub Repositories',
			url: `${SITE_URL}/explore/rankings?tab=${activeTab}`,
			numberOfItems: items.length,
			itemListElement: items
		};
	});

	function applyTabResult(tabId: RankingsTab, result: ReposResult | UsersResult | null) {
		if (tabId === 'repos') {
			reposResult = result as ReposResult | null;
			if (result?.success) resolvedRepos = result.data as RankedRepository[];
		} else {
			usersResult = result as UsersResult | null;
			if (result?.success) resolvedUsers = result.data as RankedUser[];
		}
	}

	let inFlightFetch: AbortController | null = null;

	async function switchTab(tabId: RankingsTab) {
		if (tabId === activeTab) return;

		// Optimistic UI: flip local state instantly so the active pill moves now
		activeTab = tabId;

		// Update browser URL (no server load round-trip)
		const url = new URL($page.url);
		url.searchParams.set('tab', tabId);
		pushState(url, {});

		// Cancel any in-flight tab fetch so a slow earlier response can't clobber newer state
		inFlightFetch?.abort();
		const controller = new AbortController();
		inFlightFetch = controller;

		applyTabResult(tabId, null);

		const apiUrl = new URL('/api/rankings', window.location.origin);
		apiUrl.searchParams.set('type', tabId);
		apiUrl.searchParams.set('limit', '10');
		apiUrl.searchParams.set('repoType', repoType);
		if (tabId === 'repos' && data.language) {
			apiUrl.searchParams.set('language', data.language);
		}

		try {
			const res = await fetch(apiUrl.toString(), { signal: controller.signal });
			const result = await res.json();
			applyTabResult(tabId, result);
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			applyTabResult(tabId, { success: false, data: [], error: 'Failed to load' });
		}
	}

	function changeRepoType(value: 'all' | 'original') {
		const url = new URL($page.url);
		url.searchParams.set('repoType', value);
		goto(url.toString(), { replaceState: true });
	}

	async function loadMore() {
		loadingMore = true;
		try {
			const url = new URL('/api/rankings', window.location.origin);
			url.searchParams.set('type', activeTab);
			url.searchParams.set('limit', '25');
			url.searchParams.set('repoType', repoType);
			if (activeTab === 'repos' && data.language) {
				url.searchParams.set('language', data.language);
			}

			const response = await fetch(url.toString());
			const result = await response.json();

			if (result.success) {
				if (activeTab === 'repos') {
					resolvedRepos = result.data;
					reposResult = result;
				} else {
					resolvedUsers = result.data;
					usersResult = result;
				}
			}
		} catch (error) {
			console.error('Failed to load more:', error);
		} finally {
			loadingMore = false;
		}
	}
</script>

<svelte:head>
	<title>GitHub Rankings - CheckMyGit</title>
	<meta
		name="description"
		content="Discover the most starred repositories and most followed developers on GitHub."
	/>
	{#if rankingsSchema}
		{@html jsonLd(rankingsSchema)}
	{/if}
</svelte:head>

<div class="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-6 lg:px-8">
	<!-- Header Section -->
	<div class="mb-8 text-center">
		<h1 class="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">GitHub Rankings</h1>
		<p class="text-lg text-text-secondary">
			Discover the most starred repositories and influential developers
		</p>
	</div>

	<!-- Tabs -->
	<div class="mb-6 flex justify-center">
		<SegmentedTabs items={tabs} value={activeTab} onchange={switchTab} ariaLabel="Rankings type">
			{#snippet icon({ item })}
				{#if item.value === 'repos'}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
						/>
					</svg>
				{:else}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				{/if}
			{/snippet}
		</SegmentedTabs>
	</div>

	<!-- Filters -->
	{#if activeTab === 'repos'}
		<div class="mb-6 flex flex-wrap items-center justify-center gap-4">
			<LanguageFilter language={data.language} />
			<RepoTypeFilter value={repoType} onchange={changeRepoType} />
		</div>
	{:else}
		<div class="mb-6 flex flex-wrap items-center justify-center gap-4">
			<UserSortFilter sortBy={userSortBy} onchange={(v) => (userSortBy = v)} />
			<RepoTypeFilter value={repoType} onchange={changeRepoType} />
		</div>
	{/if}

	<!-- Content -->
	<Card variant="default" padding="none">
		{#if activeTab === 'repos'}
			{#if reposResult === null}
				<ReposTableSkeleton />
			{:else if !reposResult.success}
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
						{reposResult.error || 'Failed to load repositories'}
					</p>
				</div>
			{:else if resolvedRepos.length === 0}
				<div class="p-8 text-center">
					<p class="text-text-secondary">No repositories found.</p>
				</div>
			{:else}
				<ReposTable repos={resolvedRepos} />
			{/if}
		{:else if usersResult === null}
			<UsersTableSkeleton />
		{:else if !usersResult.success}
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
					{usersResult.error || 'Failed to load users'}
				</p>
			</div>
		{:else if sortedUsers.length === 0}
			<div class="p-8 text-center">
				<p class="text-text-secondary">No users found.</p>
			</div>
		{:else}
			<UsersTable users={sortedUsers} {userSortBy} />
		{/if}
	</Card>

	<!-- Load More Button -->
	{#if (activeTab === 'repos' && hasMoreRepos) || (activeTab === 'users' && hasMoreUsers)}
		<div class="mt-6 flex justify-center">
			<Button variant="secondary" onclick={loadMore} loading={loadingMore}>Load More</Button>
		</div>
	{/if}

	<!-- Info -->
	<p class="mt-6 text-center text-sm text-text-tertiary">
		Click on any row to view the developer's portfolio
	</p>
</div>
