<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { REPO_URL } from '$lib/constants';
	import { reveal } from '$lib/utils/reveal';

	// Back to the hero field: scroll first, then focus without a second jump
	function focusHeroInput() {
		const input = document.getElementById('hero-username');
		if (!input) return;
		input.scrollIntoView({ block: 'center' });
		input.focus({ preventScroll: true });
	}
</script>

<div class="relative z-10 overflow-hidden">
	<!-- Dashed grid, faded on every edge, under three teal glows. Built only from a
	     tiled image and plain two-stop gradients: masks, conic gradients and blur
	     filters here each cost a visible GPU stall the first time they are drawn. -->
	<div class="pointer-events-none absolute top-20 left-0 z-0 h-[500px] w-full" aria-hidden="true">
		<div class="landing-grid absolute inset-0 hidden md:block"></div>
		<div class="landing-glows absolute inset-x-0 -bottom-80 h-[900px]"></div>
	</div>

	<section
		use:reveal={{ y: 18 }}
		class="landing-container relative z-10 flex flex-col items-center pt-24 pb-32 text-center md:pt-40 md:pb-60"
		style="min-height: min(60vh, 720px)"
	>
		<h2 class="landing-heading">Ready to stand out?</h2>
		<p class="landing-body mt-6 max-w-[652px]">
			Join thousands of developers using CheckMyGit to showcase their work. Open source,
			privacy-focused, and free forever.
		</p>

		<div
			class="mt-8 flex w-full flex-wrap items-center justify-center gap-4 sm:w-auto max-sm:[&>*]:w-full"
		>
			<Button variant="primary" size="pill" onclick={focusHeroInput}>Get Started</Button>
			<Button variant="secondary" href={REPO_URL} target="_blank" size="pill">
				<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
					/>
				</svg>
				Star on GitHub
			</Button>
		</div>

		<p class="mt-8 text-sm text-text-secondary">
			Made with <span class="text-red-500">&#10084;</span> by
			<a
				href="https://github.com/whoisyurii"
				target="_blank"
				rel="noopener noreferrer"
				class="hover:text-text-primary hover:underline">@whoisyurii</a
			>
		</p>
	</section>
</div>
