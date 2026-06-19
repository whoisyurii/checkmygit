<script lang="ts">
	import DevGlobe from '$lib/components/globe/DevGlobe.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Top GitHub Developers Globe - CheckMyGit</title>
	<meta
		name="description"
		content="Explore the world's most-followed GitHub developers on an interactive 3D globe. Drag to spin, click a developer to open their portfolio."
	/>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 pt-6 pb-12 sm:px-6 lg:px-8">
	<header class="mb-8 text-center">
		<h1 class="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
			Developers Around the Globe
		</h1>
		<p class="mx-auto mt-3 max-w-[42rem] text-text-secondary">
			The world's most-followed developers on GitHub, plotted by location. Drag to spin — click
			anyone to open their portfolio.
		</p>
	</header>

	{#await data.points}
		<!-- Loading shimmer: a pulsing globe silhouette while data streams in. -->
		<div class="mx-auto aspect-square w-full max-w-[640px]">
			<div class="globe-skeleton h-full w-full"></div>
		</div>
	{:then points}
		<DevGlobe {points} />
	{:catch}
		<p class="py-20 text-center text-text-secondary">Couldn't load the globe right now.</p>
	{/await}
</div>

<style>
	.globe-skeleton {
		border-radius: 9999px;
		background:
			radial-gradient(circle at 38% 32%, rgba(255, 255, 255, 0.06), transparent 45%),
			radial-gradient(circle at 50% 50%, var(--color-bg-tertiary), var(--color-bg-secondary) 70%);
		box-shadow: 0 0 80px -20px var(--color-accent-blue);
		animation: globe-pulse 1.6s ease-in-out infinite;
	}

	@keyframes globe-pulse {
		0%,
		100% {
			opacity: 0.55;
		}
		50% {
			opacity: 0.9;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.globe-skeleton {
			animation: none;
		}
	}
</style>
