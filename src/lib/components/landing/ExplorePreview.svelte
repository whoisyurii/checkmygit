<script lang="ts">
	import { fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import TrendIcon from '$lib/components/ui/TrendIcon.svelte';
	import { navigationState } from '$lib/stores/navigation.svelte';
	import { formatNumber, githubAvatar } from '$lib/utils/github-transform';
	import { inView } from '$lib/utils/in-view';
	import { DEFAULT_TRENDING_WINDOW, type TrendingRepository } from '$lib/types/trending';
	import type { RankedUser } from '$lib/types/rankings';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	// Rows shown per tab; also the skeleton count, so the card never changes height
	const ROWS = 4;

	type Tab = 'trending' | 'rankings';
	interface Feed<T> {
		status: 'idle' | 'loading' | 'ready' | 'error';
		items: T[];
	}

	const TABS: { id: Tab; label: string; href: string }[] = [
		{ id: 'trending', label: 'Trending', href: resolve('/explore/trending') },
		{ id: 'rankings', label: 'Rankings', href: resolve('/explore/rankings') + '?tab=users' }
	];

	let tab = $state<Tab>('trending');
	let trending = $state<Feed<TrendingRepository>>({ status: 'idle', items: [] });
	let rankings = $state<Feed<RankedUser>>({ status: 'idle', items: [] });

	let feed = $derived(tab === 'trending' ? trending : rankings);
	let activeTab = $derived(TABS.find((t) => t.id === tab)!);

	// Each feed is fetched once, the first time it is needed
	async function load<T>(target: Feed<T>, url: string) {
		if (target.status !== 'idle') return;
		target.status = 'loading';
		try {
			const res = await fetch(url);
			const body = (await res.json()) as { success: boolean; data: T[] };
			if (!res.ok || !body.success || body.data.length === 0) throw new Error('no data');
			target.items = body.data.slice(0, ROWS);
			target.status = 'ready';
		} catch {
			target.status = 'error';
		}
	}

	const loadTrending = () => load(trending, `/api/trending?since=${DEFAULT_TRENDING_WINDOW}`);
	const loadRankings = () => load(rankings, `/api/rankings?type=users&limit=${ROWS}`);

	function select(next: Tab) {
		tab = next;
		if (next === 'rankings') loadRankings();
	}

	const row =
		'flex h-[52px] w-full items-center gap-3 border-t border-border-muted px-1 text-left transition-colors hover:bg-text-primary/4';
</script>

<!-- Trending loads as the card approaches the viewport, not on page load -->
<div use:inView={{ once: true, rootMargin: '300px', onchange: loadTrending }} class={className}>
	<div class="flex items-center gap-1.5">
		<div class="flex gap-1.5" role="tablist" aria-label="Explore preview">
			{#each TABS as t (t.id)}
				<button
					type="button"
					role="tab"
					aria-selected={t.id === tab}
					onclick={() => select(t.id)}
					onpointerenter={t.id === 'rankings' ? loadRankings : undefined}
					class={[
						'cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors',
						t.id === tab
							? 'bg-text-primary/12 text-text-primary'
							: 'text-text-tertiary hover:text-text-primary'
					]}
				>
					{t.label}
				</button>
			{/each}
		</div>
		<a
			href={resolve('/explore/globe')}
			class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-text-tertiary transition-colors hover:text-text-primary"
		>
			Globe
			<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 17L17 7M9 7h8v8"
				/>
			</svg>
		</a>
		<!-- eslint-disable svelte/no-navigation-without-resolve -- resolved in TABS -->
		<a
			href={activeTab.href}
			class="ml-auto hidden text-xs text-text-tertiary transition-colors hover:text-text-primary sm:block"
		>
			View all
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</div>

	<div class="mt-4" role="tabpanel" aria-label={activeTab.label}>
		{#key `${tab}:${feed.status}`}
			<div class="flex flex-col" in:fade={{ duration: 220 }}>
				{#if feed.status === 'error'}
					<div
						class="flex flex-col items-center justify-center gap-2 border-t border-border-muted text-center"
						style="height: {ROWS * 52}px"
					>
						<p class="text-sm text-text-secondary">Couldn't load this right now.</p>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved in TABS -->
						<a href={activeTab.href} class="text-sm font-medium text-accent hover:underline">
							Open {activeTab.label}
						</a>
					</div>
				{:else if feed.status !== 'ready'}
					{#each { length: ROWS }, i (i)}
						<div class="{row} animate-pulse" aria-hidden="true">
							<span class="h-5 w-5 shrink-0 rounded-md bg-text-primary/10"></span>
							<span
								class="h-2.5 rounded-full bg-text-primary/15"
								style="width: {[9, 7, 10, 8][i]}rem"
							></span>
							<span class="ml-auto h-2 w-12 rounded-full bg-text-primary/8"></span>
						</div>
					{/each}
				{:else if tab === 'trending'}
					{#each trending.items as repo (repo.nameWithOwner)}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external GitHub URL -->
						<a href={repo.url} target="_blank" rel="noopener noreferrer" class={row}>
							<img
								src={repo.avatarUrl}
								alt=""
								width="20"
								height="20"
								loading="lazy"
								decoding="async"
								class="h-5 w-5 shrink-0 rounded-md bg-bg-tertiary"
							/>
							<span class="min-w-0 truncate text-sm">
								<span class="text-text-tertiary">{repo.owner}/</span><span
									class="font-medium text-text-primary">{repo.name}</span
								>
							</span>
							{#if repo.language}
								<span
									class="ml-auto hidden shrink-0 items-center gap-1.5 text-xs text-text-tertiary sm:flex"
								>
									<span class="h-2 w-2 rounded-full" style="background-color: {repo.language.color}"
									></span>
									{repo.language.name}
								</span>
							{/if}
							<span
								class={[
									'flex w-16 shrink-0 items-center justify-end gap-1 text-xs font-medium text-accent tabular-nums',
									repo.language ? 'max-sm:ml-auto' : 'ml-auto'
								]}
							>
								{#if repo.periodStars > 0}
									<TrendIcon size={14} />
									+{formatNumber(repo.periodStars)}
								{:else}
									★ {formatNumber(repo.stargazerCount)}
								{/if}
							</span>
						</a>
					{/each}
				{:else}
					{#each rankings.items as user (user.login)}
						<button
							type="button"
							onclick={() => navigationState.navigateToProfile(user.login)}
							class="{row} cursor-pointer"
						>
							<span class="w-3 shrink-0 text-xs text-text-tertiary tabular-nums">{user.rank}</span>
							<img
								src={githubAvatar(user.avatarUrl, 40)}
								alt=""
								width="20"
								height="20"
								loading="lazy"
								decoding="async"
								class="h-5 w-5 shrink-0 rounded-full bg-bg-tertiary"
							/>
							<span class="min-w-0 truncate text-sm">
								<span class="font-medium text-text-primary">{user.name ?? user.login}</span>
								<span class="text-text-tertiary max-sm:hidden">@{user.login}</span>
							</span>
							<span class="ml-auto shrink-0 text-xs text-text-tertiary tabular-nums">
								<span class="font-medium text-text-primary">{formatNumber(user.followers)}</span>
								<span class="max-sm:hidden">followers</span>
							</span>
						</button>
					{/each}
				{/if}
			</div>
		{/key}
	</div>
</div>
