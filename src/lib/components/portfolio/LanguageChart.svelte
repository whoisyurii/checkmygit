<script lang="ts">
	import type { LanguageStats } from '$lib/types/github';
	import Card from '$lib/components/ui/Card.svelte';

	interface Props {
		languages: LanguageStats[];
		class?: string;
	}

	let { languages, class: className = '' }: Props = $props();

	// Take top 5 languages for the chart
	const topLanguages = $derived(languages.slice(0, 5));
	const total = $derived(topLanguages.reduce((sum, lang) => sum + lang.size, 0));

	function formatBytes(bytes: number): string {
		if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)}MB`;
		if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)}KB`;
		return `${bytes} bytes`;
	}

	// Calculate cumulative offsets for the donut chart
	function calculateSegments(langs: LanguageStats[]) {
		const segments: Array<{ lang: LanguageStats; offset: number; percentage: number }> = [];
		let cumulativeOffset = 0;

		for (const lang of langs) {
			const percentage = (lang.size / total) * 100;
			segments.push({
				lang,
				offset: cumulativeOffset,
				percentage
			});
			cumulativeOffset += percentage;
		}

		return segments;
	}

	const segments = $derived(calculateSegments(topLanguages));

	// SVG donut chart parameters
	const size = 120;
	const strokeWidth = 20;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
</script>

<Card variant="default" padding="md" class={className}>
	<div class="flex items-center gap-6">
		<!-- Donut Chart -->
		{#if topLanguages.length > 0}
			<div class="relative shrink-0">
				<svg width={size} height={size} class="-rotate-90">
					{#each segments as segment}
						<circle
							cx={size / 2}
							cy={size / 2}
							r={radius}
							fill="none"
							stroke={segment.lang.color}
							stroke-width={strokeWidth}
							stroke-dasharray="{(segment.percentage / 100) * circumference} {circumference}"
							stroke-dashoffset="{-(segment.offset / 100) * circumference}"
							class="transition-all duration-300"
						/>
					{/each}
				</svg>
				<div
					class="absolute inset-0 flex items-center justify-center text-xs text-text-tertiary"
				>
					{topLanguages.length} langs
				</div>
			</div>

			<!-- Legend -->
			<div class="flex-1 space-y-2">
				{#each topLanguages as lang}
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center gap-2">
							<div
								class="h-3 w-3 rounded-full"
								style="background-color: {lang.color}"
							></div>
							<span class="text-text-primary">{lang.name}</span>
						</div>
						<span class="text-text-secondary">{lang.percentage}%</span>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex w-full items-center justify-center py-4 text-sm text-text-tertiary">
				No language data available
			</div>
		{/if}
	</div>

	{#if topLanguages.length > 0}
		<div class="mt-4 text-xs text-text-tertiary">
			Based on {formatBytes(total)} of code
		</div>
	{/if}
</Card>
