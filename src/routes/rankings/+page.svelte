<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/stores';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ReposTable from '$lib/components/rankings/ReposTable.svelte';
	import UsersTable from '$lib/components/rankings/UsersTable.svelte';
	import ReposTableSkeleton from '$lib/components/rankings/ReposTableSkeleton.svelte';
	import UsersTableSkeleton from '$lib/components/rankings/UsersTableSkeleton.svelte';
	import LanguageFilter from '$lib/components/rankings/LanguageFilter.svelte';
	import UserSortFilter from '$lib/components/rankings/UserSortFilter.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import type { RankedUser } from '$lib/types/rankings';

	let { data } = $props();

	// Client-side tab state for instant switching
	let activeTab = $state(data.tab);

	// Client-side user sort state
	let userSortBy = $state<'followers' | 'stars'>('followers');

	// Store resolved users for client-side sorting
	let resolvedUsers = $state<RankedUser[]>([]);

	// Track users loading state
	let usersResult = $state<{ success: boolean; data: RankedUser[]; error?: string } | null>(null);

	// Load users data via effect
	$effect(() => {
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
		// Re-assign ranks and limit to 25
		return users.slice(0, 25).map((user, index) => ({
			...user,
			rank: index + 1
		}));
	});

	const tabs = [
		{ id: 'repos', label: 'Top Repositories', icon: 'repo' },
		{ id: 'users', label: 'Top Users', icon: 'user' }
	];

	function switchTab(tabId: string) {
		activeTab = tabId;
		// Update URL without navigation for bookmarkability
		const url = new URL($page.url);
		url.searchParams.set('tab', tabId);
		replaceState(url, {});
	}
</script>

<svelte:head>
	<title>GitHub Rankings - CheckMyGit</title>
	<meta name="description" content="Discover the most starred repositories and most followed developers on GitHub." />
</svelte:head>

<Header />

<main class="relative min-h-screen w-full">
	<!-- Background effects -->
	<div class="saas-glow"></div>
	<div class="absolute inset-0 z-0 grid-bg"></div>

	<div class="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Header Section -->
		<div class="mb-8 text-center">
			<h1 class="mb-3 text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
				GitHub Rankings
			</h1>
			<p class="text-lg text-[var(--color-text-secondary)]">
				Discover the most starred repositories and influential developers
			</p>
		</div>

		<!-- Tabs -->
		<div class="mb-6 flex justify-center">
			<div class="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-1">
				{#each tabs as tab (tab.id)}
					<button
						type="button"
						onclick={() => switchTab(tab.id)}
						class="flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors cursor-pointer
							{activeTab === tab.id
								? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
								: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
					>
						{#if tab.icon === 'repo'}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
							</svg>
						{:else}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
							</svg>
						{/if}
						{tab.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Filters -->
		{#if activeTab === 'repos'}
			<div class="mb-6 flex justify-center">
				<LanguageFilter language={data.language} />
			</div>
		{:else}
			<div class="mb-6 flex justify-center">
				<UserSortFilter sortBy={userSortBy} onchange={(v) => userSortBy = v} />
			</div>
		{/if}

		<!-- Content -->
		<Card variant="default" padding="none">
			{#if activeTab === 'repos'}
				{#await data.streamed.repos}
					<ReposTableSkeleton />
				{:then result}
					{#if !result.success}
						<div class="p-8 text-center">
							<svg class="mx-auto mb-4 h-12 w-12 text-[var(--color-accent-red)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
							</svg>
							<p class="text-[var(--color-text-secondary)]">{result.error || 'Failed to load repositories'}</p>
						</div>
					{:else if result.data.length === 0}
						<div class="p-8 text-center">
							<p class="text-[var(--color-text-secondary)]">No repositories found.</p>
						</div>
					{:else}
						<ReposTable repos={result.data} />
					{/if}
				{:catch}
					<div class="p-8 text-center">
						<p class="text-[var(--color-text-secondary)]">Failed to load repositories.</p>
					</div>
				{/await}
			{:else}
				{#if usersResult === null}
					<UsersTableSkeleton />
				{:else if !usersResult.success}
					<div class="p-8 text-center">
						<svg class="mx-auto mb-4 h-12 w-12 text-[var(--color-accent-red)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
						</svg>
						<p class="text-[var(--color-text-secondary)]">{usersResult.error || 'Failed to load users'}</p>
					</div>
				{:else if sortedUsers.length === 0}
					<div class="p-8 text-center">
						<p class="text-[var(--color-text-secondary)]">No users found.</p>
					</div>
				{:else}
					<UsersTable users={sortedUsers} {userSortBy} />
				{/if}
			{/if}
		</Card>

		<!-- Info -->
		<p class="mt-6 text-center text-sm text-[var(--color-text-tertiary)]">
			Click on any row to view the developer's portfolio
		</p>
	</div>
</main>

<Footer />
