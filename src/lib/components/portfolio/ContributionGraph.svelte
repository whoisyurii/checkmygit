<script lang="ts">
	import type { GitHubProfile, ContributionWeek } from '$lib/types/github';
	import { formatNumber } from '$lib/utils/github-transform';
	import Card from '$lib/components/ui/Card.svelte';

	interface Props {
		profile: GitHubProfile;
		class?: string;
	}

	let { profile, class: className = '' }: Props = $props();

	const calendar = $derived(profile.contributions?.contributionCalendar);
	const totalContributions = $derived(calendar?.totalContributions ?? 0);

	// Get the last 52 weeks of contributions
	const weeks = $derived(calendar?.weeks.slice(-52) ?? []);

	// Days of week labels
	const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

	// Month labels based on weeks
	function getMonthLabels(weeks: ContributionWeek[]): { label: string; col: number }[] {
		const months: { label: string; col: number }[] = [];
		let lastMonth = -1;

		weeks.forEach((week, index) => {
			if (week.contributionDays.length > 0) {
				const date = new Date(week.contributionDays[0].date);
				const month = date.getMonth();
				if (month !== lastMonth) {
					months.push({
						label: date.toLocaleDateString('en-US', { month: 'short' }),
						col: index
					});
					lastMonth = month;
				}
			}
		});

		return months;
	}

	// Map light mode colors to dark mode
	function getDarkColor(color: string, count: number): string {
		if (count === 0) return '#161b22';

		// Map known light mode colors to dark mode equivalents
		const colorMap: Record<string, string> = {
			'#9be9a8': '#0e4429', // Level 1
			'#40c463': '#006d32', // Level 2
			'#30a14e': '#26a641', // Level 3
			'#216e39': '#39d353'  // Level 4
		};

		return colorMap[color.toLowerCase()] || color;
	}

	const monthLabels = $derived(getMonthLabels(weeks));
</script>

<div class={className}>
	<!-- Header (outside card, like Notable Projects) -->
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<svg class="h-5 w-5 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
			</svg>
			<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Contributions</h3>
		</div>
		<div class="text-sm text-[var(--color-text-secondary)]">
			<span class="font-semibold text-[var(--color-text-primary)]">
				{formatNumber(totalContributions)}
			</span>
			<span class="ml-1">in the last year</span>
		</div>
	</div>

	<!-- Heatmap Card -->
	<Card variant="default" padding="md">
		{#if calendar}
			<div class="w-full">
				<!-- Month labels -->
				<div class="mb-2 flex text-xs text-text-tertiary">
					<!-- Spacer for Day Labels -->
					<div class="w-8 shrink-0"></div>

					<!-- Months Grid -->
					<div class="flex flex-1 justify-between gap-0.5">
						{#each weeks as week, i}
							<div class="relative flex-1 min-w-0">
								{#each monthLabels as month}
									{#if month.col === i}
										<span class="absolute bottom-0 left-0 truncate text-[10px]">
											{month.label}
										</span>
									{/if}
								{/each}
							</div>
						{/each}
					</div>
				</div>

				<!-- Graph grid -->
				<div class="flex w-full gap-2">
					<!-- Day labels -->
					<div class="flex w-8 shrink-0 flex-col gap-0.5">
						{#each dayLabels as label}
							<div class="flex flex-1 items-center justify-end text-[10px] leading-none text-text-tertiary">
								<span class="mr-1">{label}</span>
							</div>
						{/each}
					</div>

					<!-- Contribution squares -->
					<div class="flex flex-1 justify-between gap-0.5">
						{#each weeks as week}
							<div class="flex flex-1 min-w-0 flex-col gap-0.5">
								{#each week.contributionDays as day}
									<div
										class="aspect-square w-full rounded-sm transition-opacity hover:opacity-80"
										style="background-color: {getDarkColor(day.color, day.contributionCount)}"
										title="{day.contributionCount} contributions on {new Date(day.date).toLocaleDateString()}"
									></div>
								{/each}
							</div>
						{/each}
					</div>
				</div>

				<div class="mt-4 text-xs text-text-tertiary">
					Last 52 weeks of activity
				</div>
			</div>
		{:else}
			<div class="flex h-32 items-center justify-center text-sm text-text-tertiary">
				<div class="text-center">
					<svg
						class="mx-auto mb-2 h-8 w-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
					<p>Contribution data not available</p>
					<p class="mt-1 text-[10px]">Sign in with GitHub for full data</p>
				</div>
			</div>
		{/if}
	</Card>
</div>
