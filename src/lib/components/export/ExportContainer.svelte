<script lang="ts">
	import type { Snippet } from 'svelte';
	import ExportWatermark from './ExportWatermark.svelte';

	interface Props {
		children: Snippet;
		showWatermark?: boolean;
	}

	let { children, showWatermark = true }: Props = $props();
</script>

<div
	id="export-container"
	class="relative"
	style="background-color: #030303; width: 1320px;"
>
	<!-- Background gradients as inline SVG for html-to-image compatibility -->
	<svg
		class="pointer-events-none absolute inset-0 h-full w-full"
		preserveAspectRatio="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<defs>
			<!-- Radial gradient: subtle light from top center -->
			<radialGradient id="export-radial" cx="50%" cy="0%" r="60%" fx="50%" fy="0%">
				<stop offset="0%" stop-color="rgb(120, 120, 120)" stop-opacity="0.08" />
				<stop offset="50%" stop-color="rgb(120, 120, 120)" stop-opacity="0" />
			</radialGradient>
			<!-- Linear gradient: fade to darker at bottom -->
			<linearGradient id="export-linear" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" stop-color="rgba(0,0,0,0)" />
				<stop offset="100%" stop-color="rgba(0,0,0,0.6)" />
			</linearGradient>
		</defs>
		<rect width="100%" height="100%" fill="url(#export-radial)" />
		<rect width="100%" height="100%" fill="url(#export-linear)" />
	</svg>

	<!-- Content: renders existing template -->
	<div class="relative z-10">
		{@render children()}
	</div>

	<!-- Watermark -->
	{#if showWatermark}
		<ExportWatermark class="z-20" />
	{/if}
</div>
