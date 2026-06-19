<script lang="ts">
	import DitherBackground from './DitherBackground.svelte';

	interface Props {
		// Tailwind height utility for the backdrop region; it fades out at the bottom.
		class?: string;
	}

	let { class: className = 'h-[820px]' }: Props = $props();
</script>

<div class="pointer-events-none absolute inset-x-0 top-0 z-0 {className}">
	<div
		class="absolute inset-0"
		style="-webkit-mask-image: linear-gradient(to bottom, black 55%, transparent); mask-image: linear-gradient(to bottom, black 55%, transparent);"
	>
		<DitherBackground />
	</div>
	<div class="hero-scrim absolute inset-0"></div>
</div>
