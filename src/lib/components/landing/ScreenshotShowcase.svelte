<script lang="ts">
	import { themeState } from '$lib/stores/theme.svelte';
	import screenshotDark from '$lib/assets/readme_img.png';
	import screenshotLight from '$lib/assets/white_showcase.png';

	let scrollY = $state(0);
	let sectionEl = $state<HTMLElement | null>(null);

	const screenshotImg = $derived(themeState.isLight ? screenshotLight : screenshotDark);

	// Calculate rotation based on scroll position relative to section
	let rotateX = $derived.by(() => {
		// Reference scrollY to ensure this re-runs on scroll
		const _ = scrollY;

		if (!sectionEl || typeof window === 'undefined') return 20;

		const rect = sectionEl.getBoundingClientRect();
		const viewportHeight = window.innerHeight;

		// Start animation when section top enters bottom of viewport
		// End animation when section is roughly centered
		const startPoint = viewportHeight; // When top of section hits bottom of viewport
		const endPoint = viewportHeight * 0.3; // When top of section is 30% from top

		const progress = Math.min(Math.max((startPoint - rect.top) / (startPoint - endPoint), 0), 1);

		return 20 * (1 - progress); // 20deg → 0deg
	});
</script>

<svelte:window bind:scrollY />

<section
	bind:this={sectionEl}
	class="relative z-10 px-4 pb-20 pt-4 sm:px-6 md:pb-32"
>
	<div class="mx-auto max-w-6xl" style="perspective: 1200px;">
		<div
			class="relative"
			style="transform: rotateX({rotateX}deg); transform-origin: center bottom; will-change: transform;"
		>
			<!-- Subtle green glow at bottom -->
			<div class="absolute -bottom-6 inset-x-16 h-20 bg-saas-green blur-3xl opacity-70"></div>

			<div
				class="screenshot-card relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-tertiary shadow-2xl md:rounded-3xl"
			>
				<!-- Screenshot image -->
				<img
					src={screenshotImg}
					alt="CheckMyGit portfolio preview showing GitHub stats, contributions, and projects"
					class="block w-full h-auto"
					fetchpriority="high"
					decoding="async"
				/>

				<!-- Subtle overlay gradient at bottom -->
				<div class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg-primary/50 to-transparent"></div>
			</div>
		</div>
	</div>
</section>
