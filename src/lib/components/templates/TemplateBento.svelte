<script lang="ts">
	import type { GitHubProfile } from '$lib/types/github';
	import { formatNumber, getTotalContributions, getMostActiveDay, getContributionStreak } from '$lib/utils/github-transform';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import ContributionGraph from '$lib/components/portfolio/ContributionGraph.svelte';
	import ProjectCard from '$lib/components/portfolio/ProjectCard.svelte';
	import Dropdown from '$lib/components/ui/Dropdown.svelte';

	interface Props {
		profile: GitHubProfile;
		class?: string;
		views?: number;
	}

	let { profile, class: className = '', views = 0 }: Props = $props();

	const totalContributions = $derived(getTotalContributions(profile));
	const streak = $derived(getContributionStreak(profile));
	const activeDay = $derived(getMostActiveDay(profile));

	// Top 3 languages for the chart
	const topLanguages = $derived(profile.languages.slice(0, 3));
	const langTotal = $derived(topLanguages.reduce((sum, l) => sum + l.size, 0));

	let sortBy = $state('stars');
	const sortOptions = [
		{ value: 'stars', label: 'Most Stars' },
		{ value: 'pinned', label: 'Pinned Order' }
	];

	const sortedRepos = $derived(
		sortBy === 'stars'
			? [...profile.pinnedRepositories].sort((a, b) => b.stargazerCount - a.stargazerCount)
			: profile.pinnedRepositories
	);
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 {className}">
	<!-- Bento Grid -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<!-- Profile Card (2x2) -->
		<Card variant="elevated" padding="lg" class="md:col-span-2 md:row-span-2">
			<div class="flex h-full flex-col">
				<div class="flex items-start gap-4">
					<img
						src={profile.user.avatarUrl}
						alt={profile.user.login}
						class="h-20 w-20 rounded-full border-2 border-[var(--color-border-default)]"
					/>
					<div class="flex-1">
						<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">
							{profile.user.name || profile.user.login}
						</h1>
						<p class="text-[var(--color-text-secondary)]">@{profile.user.login}</p>
					</div>
				</div>

				{#if profile.user.bio}
					<p class="mt-4 flex-1 text-[var(--color-text-secondary)]">
						{profile.user.bio}
					</p>
				{/if}

				<div class="mt-4 flex flex-wrap gap-2">
					{#each profile.languages.slice(0, 5) as lang}
						<Badge variant="outline" color={lang.color}>
							{lang.name}
						</Badge>
					{/each}
				</div>

				<div class="mt-4 flex items-center gap-4 text-sm text-[var(--color-text-tertiary)]">
					{#if profile.user.location}
						<span class="flex items-center gap-1">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							</svg>
							{profile.user.location}
						</span>
					{/if}
					{#if profile.user.company}
						<span>{profile.user.company.replace('@', '')}</span>
					{/if}
					<div class="flex items-center gap-1 text-[var(--color-text-secondary)]">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
						</svg>
						<span class="font-semibold text-[var(--color-text-primary)]">{views.toLocaleString()}</span>
					</div>
				</div>
			</div>
		</Card>

		<!-- Total Repos -->
		<Card variant="elevated" padding="lg">
			<div class="flex h-full flex-col items-center justify-center text-center">
				<div class="text-4xl font-bold text-[var(--color-text-primary)]">
					{profile.stats.totalRepos}
				</div>
				<div class="mt-1 text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
					Repositories
				</div>
			</div>
		</Card>

		<!-- Total Stars -->
		<Card variant="elevated" padding="lg">
			<div class="flex h-full flex-col items-center justify-center text-center">
				<div class="text-4xl font-bold text-[var(--color-accent-yellow)]">
					{formatNumber(profile.stats.totalStars)}
				</div>
				<div class="mt-1 text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
					Stars Earned
				</div>
			</div>
		</Card>

		<!-- Followers -->
		<Card variant="elevated" padding="lg">
			<div class="flex h-full flex-col items-center justify-center text-center">
				<div class="text-4xl font-bold text-[var(--color-accent-green)]">
					{formatNumber(profile.stats.followers)}
				</div>
				<div class="mt-1 text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
					Followers
				</div>
			</div>
		</Card>

		<!-- Years Active -->
		<Card variant="elevated" padding="lg">
			<div class="flex h-full flex-col items-center justify-center text-center">
				<div class="text-4xl font-bold text-[var(--color-accent-purple)]">
					{profile.stats.yearsActive}
				</div>
				<div class="mt-1 text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
					Years Active
				</div>
			</div>
		</Card>

		<!-- Language Chart (2 cols) -->
		<Card variant="elevated" padding="lg" class="md:col-span-2">
			<h3 class="mb-4 text-sm font-semibold text-[var(--color-text-secondary)]">Top Languages</h3>
			<div class="flex items-center gap-6">
				<!-- Mini donut -->
				<svg width="80" height="80" class="-rotate-90 flex-shrink-0">
					{#each topLanguages as lang, i}
						{@const prevOffset = topLanguages.slice(0, i).reduce((sum, l) => sum + (l.size / langTotal) * 100, 0)}
						<circle
							cx="40"
							cy="40"
							r="30"
							fill="none"
							stroke={lang.color}
							stroke-width="12"
							stroke-dasharray="{(lang.size / langTotal) * 188.5} 188.5"
							stroke-dashoffset="{-prevOffset * 1.885}"
						/>
					{/each}
				</svg>
				<div class="flex-1 space-y-2">
					{#each topLanguages as lang}
						<div class="flex items-center justify-between text-sm">
							<div class="flex items-center gap-2">
								<div class="h-3 w-3 rounded-full" style="background-color: {lang.color}"></div>
								<span class="text-[var(--color-text-primary)]">{lang.name}</span>
							</div>
							<span class="text-[var(--color-text-secondary)]">{lang.percentage}%</span>
						</div>
					{/each}
				</div>
			</div>
		</Card>

		<!-- Productivity Insights (2 cols) -->
		<Card variant="elevated" padding="lg" class="md:col-span-2">
			<h3 class="mb-4 text-sm font-semibold text-[var(--color-text-secondary)]">Productivity Insights</h3>
			<div class="grid grid-cols-2 gap-4">
				<!-- Streak -->
				<div class="flex flex-col gap-1 rounded-xl bg-[var(--color-bg-primary)] p-4">
					<div class="flex items-center gap-2 text-[var(--color-accent-orange)]">
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
						</svg>
						<span class="text-xs font-semibold uppercase tracking-wider">Current Streak</span>
					</div>
					<div class="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
						{streak} <span class="text-sm font-normal text-[var(--color-text-secondary)]">days</span>
					</div>
				</div>

				<!-- Most Active -->
				<div class="flex flex-col gap-1 rounded-xl bg-[var(--color-bg-primary)] p-4">
					<div class="flex items-center gap-2 text-[var(--color-accent-green)]">
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						<span class="text-xs font-semibold uppercase tracking-wider">Top Day</span>
					</div>
					{#if activeDay}
						<div class="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
							{new Date(activeDay.date).toLocaleDateString('en-US', { weekday: 'short' })}
							<span class="text-sm font-normal text-[var(--color-text-secondary)]">
								({activeDay.contributionCount})
							</span>
						</div>
					{:else}
						<div class="mt-2 text-sm text-[var(--color-text-secondary)]">No data</div>
					{/if}
				</div>
			</div>
		</Card>

		<!-- Contributions (full width) -->
		{#if profile.contributions}
			<div class="md:col-span-2 lg:col-span-4">
				<ContributionGraph {profile} />
			</div>
		{/if}

		<!-- Projects (full width) -->
		{#if profile.pinnedRepositories.length > 0}
			<div class="md:col-span-2 lg:col-span-4">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
						</svg>
						Pinned Projects
					</h3>
					<Dropdown options={sortOptions} bind:value={sortBy} />
				</div>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each sortedRepos.slice(0, 6) as repo}
						<ProjectCard {repo} />
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
