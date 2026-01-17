<script lang="ts">
	import type { GitHubProfile } from '$lib/types/github';
	import Sidebar from '$lib/components/portfolio/Sidebar.svelte';
	import StatsGrid from '$lib/components/portfolio/StatsGrid.svelte';
	import ContributionGraph from '$lib/components/portfolio/ContributionGraph.svelte';
	import ExternalContributions from '$lib/components/portfolio/ExternalContributions.svelte';
	import LanguageChart from '$lib/components/portfolio/LanguageChart.svelte';
	import ProjectCard from '$lib/components/portfolio/ProjectCard.svelte';
	import TechStack from '$lib/components/portfolio/TechStack.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Dropdown from '$lib/components/ui/Dropdown.svelte';

	interface Props {
		profile: GitHubProfile;
		class?: string;
		views?: number;
	}

	let { profile, class: className = '', views = 0 }: Props = $props();

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
	<div class="flex flex-col gap-8 lg:flex-row">
		<!-- Sidebar -->
		<div class="w-full lg:w-[296px] lg:flex-shrink-0">
			<Sidebar {profile} {views} />
		</div>

		<!-- Main Content -->
		<div class="flex-1 space-y-6">
			<!-- Welcome Banner -->
			<Card variant="default" padding="lg">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-semibold text-text-primary">
							Welcome to {profile.user.name || profile.user.login}'s Hub
						</h2>
						<p class="mt-1 text-sm text-text-secondary">
							Explore their open source contributions and projects
						</p>
					</div>
					<div class="text-right text-xs text-text-tertiary">
						Powered by <span class="font-semibold text-accent-green">CheckMyGit</span>
					</div>
				</div>
			</Card>

			<!-- Stats Grid -->
			<StatsGrid {profile} />

			<!-- Contributions -->
			{#if profile.contributions}
				<ContributionGraph {profile} />
			{/if}

			<!-- Tech Stack & Languages -->
			<div>
				<div class="mb-4 flex items-center gap-2">
					<svg class="h-5 w-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
					</svg>
					<h3 class="text-lg font-semibold text-text-primary">Tech Stack & Languages</h3>
				</div>
				<div class="grid gap-4 md:grid-cols-2">
					<TechStack languages={profile.languages} bio={profile.user.bio} />
					<LanguageChart languages={profile.languages} />
				</div>
			</div>

			<!-- External Open Source Contributions -->
			{#if profile.contributions?.externalContributions && profile.contributions.externalContributions.length > 0}
				<ExternalContributions
					contributions={profile.contributions.externalContributions}
					totalPRs={profile.contributions.externalPRCount ?? 0}
					totalCommits={profile.contributions.externalCommitCount ?? 0}
				/>
			{/if}

			<!-- Notable Projects -->
			{#if profile.pinnedRepositories.length > 0}
				<div>
					<div class="mb-4 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<svg class="h-5 w-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
							</svg>
							<h3 class="text-lg font-semibold text-text-primary">Notable Projects</h3>
						</div>
						<Dropdown options={sortOptions} bind:value={sortBy} />
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						{#each sortedRepos as repo (repo.name)}
							<ProjectCard {repo} />
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
