<script lang="ts">
	import type { GitHubProfile } from '$lib/types/github';
	import { formatNumber, getTotalContributions } from '$lib/utils/github-transform';
	import Card from '$lib/components/ui/Card.svelte';

	interface Props {
		profile: GitHubProfile;
		class?: string;
		showStarsFilter?: boolean;
	}

	let { profile, class: className = '', showStarsFilter = true }: Props = $props();

	// Client-side filter for stars display
	let repoType = $state<'all' | 'original'>('all');

	const totalContributions = $derived(getTotalContributions(profile));

	// Show different stars based on filter
	const displayStars = $derived(
		repoType === 'original' ? profile.stats.originalStars : profile.stats.totalStars
	);

	const starsLabel = $derived(repoType === 'original' ? 'Own Stars' : 'All Stars');

	const staticStats = $derived([
		{
			label: 'Total Repos',
			value: profile.stats.totalRepos,
			icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>`
		},
		{
			label: 'Followers',
			value: profile.stats.followers,
			icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`
		},
		{
			label: 'Years Active',
			value: profile.stats.yearsActive,
			icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
		}
	]);

	function toggleStarsType() {
		repoType = repoType === 'original' ? 'all' : 'original';
	}
</script>

<div class={className}>
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		<!-- Total Repos -->
		<Card variant="default" padding="md">
			<div class="flex flex-col items-center text-center">
				<div class="mb-2 text-text-tertiary">
					{@html staticStats[0].icon}
				</div>
				<div class="text-3xl font-bold text-text-primary">
					{formatNumber(staticStats[0].value)}
				</div>
				<div class="text-xs uppercase tracking-wider text-text-secondary">
					{staticStats[0].label}
				</div>
			</div>
		</Card>

		<!-- Stars Card with integrated toggle -->
		<Card variant="default" padding="md">
			<div class="flex flex-col items-center text-center">
				<div class="mb-2 text-text-tertiary">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
				</div>
				<div class="text-3xl font-bold text-text-primary">
					{formatNumber(displayStars)}
				</div>
				{#if showStarsFilter}
					<button
						onclick={toggleStarsType}
						class="group flex items-center gap-1 text-xs uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary"
						title="Click to toggle between own and all stars"
					>
						{starsLabel}
						<svg class="h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
						</svg>
					</button>
				{:else}
					<div class="text-xs uppercase tracking-wider text-text-secondary">
						Total Stars
					</div>
				{/if}
			</div>
		</Card>

		<!-- Followers -->
		<Card variant="default" padding="md">
			<div class="flex flex-col items-center text-center">
				<div class="mb-2 text-text-tertiary">
					{@html staticStats[1].icon}
				</div>
				<div class="text-3xl font-bold text-text-primary">
					{formatNumber(staticStats[1].value)}
				</div>
				<div class="text-xs uppercase tracking-wider text-text-secondary">
					{staticStats[1].label}
				</div>
			</div>
		</Card>

		<!-- Years Active -->
		<Card variant="default" padding="md">
			<div class="flex flex-col items-center text-center">
				<div class="mb-2 text-text-tertiary">
					{@html staticStats[2].icon}
				</div>
				<div class="text-3xl font-bold text-text-primary">
					{formatNumber(staticStats[2].value)}
				</div>
				<div class="text-xs uppercase tracking-wider text-text-secondary">
					{staticStats[2].label}
				</div>
			</div>
		</Card>
	</div>
</div>

<!-- {#if totalContributions > 0}
	<div class="mt-4 text-center text-sm text-text-secondary">
		<span class="font-semibold text-accent-green">
			{formatNumber(totalContributions)}
		</span>
		contributions in the last year
	</div>
{/if} -->
