<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ReposTable from '$lib/components/rankings/ReposTable.svelte';
	import UsersTable from '$lib/components/rankings/UsersTable.svelte';
	import ReposTableSkeleton from '$lib/components/rankings/ReposTableSkeleton.svelte';
	import UsersTableSkeleton from '$lib/components/rankings/UsersTableSkeleton.svelte';
	import LanguageFilter from '$lib/components/rankings/LanguageFilter.svelte';
	import UserSortFilter from '$lib/components/rankings/UserSortFilter.svelte';
	import RepoTypeFilter from '$lib/components/ui/RepoTypeFilter.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { RankedUser, RankedRepository } from '$lib/types/rankings';

	let { data } = $props();

	// Derive active tab and repoType from URL for reactivity
	let activeTab = $derived($page.url.searchParams.get('tab') || 'repos');
	let repoType = $derived(($page.url.searchParams.get('repoType') as 'all' | 'original') || 'original');

	// Client-side user sort state
	let userSortBy = $state<'followers' | 'stars'>('followers');

	// Store resolved data for display
	let resolvedUsers = $state<RankedUser[]>([]);
	let resolvedRepos = $state<RankedRepository[]>([]);

	// Track loading states
	let usersResult = $state<{ success: boolean; data: RankedUser[]; error?: string } | null>(null);
	let reposResult = $state<{ success: boolean; data: RankedRepository[]; error?: string } | null>(null);

	// Load More state
	let loadingMore = $state(false);
	let hasMoreRepos = $derived(resolvedRepos.length > 0 && resolvedRepos.length < 25);
	let hasMoreUsers = $derived(resolvedUsers.length > 0 && resolvedUsers.length < 25);

	// Load repos data via effect
	$effect(() => {
		reposResult = null;
		data.streamed.repos.then((result) => {
			reposResult = result;
			if (result.success) {
				resolvedRepos = result.data;
			}
		});
	});

	// Load users data via effect
	$effect(() => {
		usersResult = null;
		data.streamed.users.then((result) => {
			usersResult = result;
			if (result.success) {
				resolvedUsers = result.data;
			}
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

	const tabs = [
		{ id: 'repos', label: 'Top Repositories', icon: 'repo' },
		{ id: 'users', label: 'Top Users', icon: 'user' }
	];

	function switchTab(tabId: string) {
		// Use goto to trigger server data reload for the new tab
		const url = new URL($page.url);
		url.searchParams.set('tab', tabId);
		goto(url.toString(), { replaceState: true });
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
</svelte:head>

<Header />

<main class="relative min-h-screen w-full overflow-x-hidden">
	<!-- Background effects -->
	<div class="saas-glow"></div>
	<div class="grid-bg absolute inset-0 z-0"></div>

	<div class="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Header Section -->
		<div class="mb-8 text-center">
			<h1 class="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">
				GitHub Rankings
			</h1>
			<p class="text-lg text-text-secondary">
				Discover the most starred repositories and influential developers
			</p>
		</div>

		<!-- Tabs -->
		<div class="mb-6 flex justify-center">
			<div
				class="inline-flex rounded-radius-md border border-border-default bg-bg-secondary p-1"
			>
				{#each tabs as tab (tab.id)}
					<button
						type="button"
						onclick={() => switchTab(tab.id)}
						class="flex cursor-pointer items-center gap-2 rounded-radius-sm px-4 py-2 text-sm font-medium transition-colors
							{activeTab === tab.id
							? 'bg-bg-tertiary text-text-primary'
							: 'text-text-secondary hover:text-text-primary'}"
					>
						{#if tab.icon === 'repo'}
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
						{tab.label}
					</button>
				{/each}
			</div>
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
				<Button variant="secondary" onclick={loadMore} loading={loadingMore}>
					Load More
				</Button>
			</div>
		{/if}

		<!-- Info -->
		<p class="mt-6 text-center text-sm text-text-tertiary">
			Click on any row to view the developer's portfolio
		</p>
	</div>
</main>

<Footer />
