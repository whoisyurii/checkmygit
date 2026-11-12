<script lang="ts">
	import { themeState } from '$lib/stores/theme.svelte';
	import { reveal } from '$lib/utils/reveal';
	import { githubAvatar } from '$lib/utils/github-transform';
	import ExplorePreview from './ExplorePreview.svelte';
	import { TEMPLATE_SCREENSHOTS } from './template-screenshots';

	// Decorative contribution heatmap: fixed pseudo-random levels so SSR and client agree
	const HEAT_COLUMNS = 26;
	const heat = Array.from({ length: HEAT_COLUMNS * 7 }, (_, i) => {
		const n = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
		return n < 0.3 ? 0 : n < 0.55 ? 1 : n < 0.75 ? 2 : n < 0.9 ? 3 : 4;
	});
	const heatClass = ['bg-bg-tertiary', 'bg-accent/20', 'bg-accent/40', 'bg-accent/70', 'bg-accent'];

	// Three template captures fanned out, the GitHub one on top
	const fan = [
		{ id: 'minimal', class: 'top-8 left-0 w-[62%] -rotate-3 border-border-default' },
		{ id: 'bento', class: 'top-8 right-0 w-[62%] rotate-3 border-border-default' },
		{ id: 'github', class: 'top-0 left-1/2 w-[72%] -translate-x-1/2 border-border-subtle' }
	] as const;

	// Mock export results; icon paths are 24x24 outline glyphs
	const exportRows = [
		{
			title: 'torvalds-portfolio.png',
			subtitle: 'High-res PNG',
			offset: 'sm:mr-16',
			highlight: true,
			icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
			trailing: 'download'
		},
		{
			title: 'checkmygit.com/torvalds',
			subtitle: 'Shareable link',
			offset: 'sm:ml-16',
			mono: true,
			icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
			trailing: 'copy'
		},
		{
			title: 'QR code',
			subtitle: 'Scan to open the portfolio',
			offset: 'sm:mr-16',
			icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'
		}
	] as const;
	const DOWNLOAD_ICON = 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4';

	const card =
		'flex min-w-0 flex-col overflow-hidden rounded-xl border border-border-muted bg-bg-secondary px-6 pt-6 md:px-10 md:pt-10';
	const copy = 'flex flex-col items-start gap-2 pb-8 text-left md:pb-10';
	// Inner surface for the mock UI that sits on the card's bottom edge
	const panel = 'rounded-t-lg border border-b-0 border-border-default bg-bg-primary';
</script>

<section class="landing-container relative z-10 py-24 md:py-40">
	<div use:reveal class="mx-auto flex max-w-[820px] flex-col items-center text-center">
		<h2 class="landing-heading">
			From username to portfolio.
			<br class="hidden md:block" />
			Nothing to set up.
		</h2>
	</div>

	<div class="mt-12 grid grid-cols-1 gap-8 md:mt-20 lg:grid-cols-2">
		<!-- Instant generation -->
		<article use:reveal={{ y: 18 }} class={card}>
			<div class={copy}>
				<h3 class="landing-subtitle">Instant generation</h3>
				<p class="landing-body">
					No signup required. Just enter your username and watch the magic happen.
				</p>
			</div>
			<div class="{panel} mt-auto p-5" aria-hidden="true">
				<div
					class="flex items-center rounded-full border border-border-default bg-bg-secondary px-4 py-2.5 font-mono text-[13px]"
				>
					<span class="text-text-tertiary">checkmygit.com/</span>
					<span class="text-text-primary">torvalds</span>
					<span class="ml-0.5 h-4 w-px animate-pulse bg-accent"></span>
				</div>
				<div class="mt-5 flex items-center gap-3">
					<img
						src={githubAvatar('torvalds', 96)}
						alt=""
						width="36"
						height="36"
						loading="lazy"
						decoding="async"
						class="h-9 w-9 rounded-full border border-border-subtle bg-bg-secondary"
					/>
					<div class="min-w-0">
						<p class="text-sm font-medium text-text-primary">Linus Torvalds</p>
						<p class="text-xs text-text-tertiary">@torvalds</p>
					</div>
				</div>
				<div
					class="mt-4 grid grid-flow-col grid-rows-7 gap-[3px]"
					style="grid-auto-columns: minmax(0, 1fr)"
				>
					{#each heat as level, i (i)}
						<span class="aspect-square rounded-[2px] {heatClass[level]}"></span>
					{/each}
				</div>
			</div>
		</article>

		<!-- Templates -->
		<article use:reveal={{ y: 18, delay: 60 }} class={card}>
			<div class={copy}>
				<h3 class="landing-subtitle">Modern themes</h3>
				<p class="landing-body">
					Choose from Bento grid, Minimal, or GitHub-native inspired layouts.
				</p>
			</div>
			<div class="relative mt-auto h-56 sm:h-64" aria-hidden="true">
				{#each fan as item (item.id)}
					<img
						src={TEMPLATE_SCREENSHOTS[item.id][themeState.current]}
						alt=""
						loading="lazy"
						decoding="async"
						class="absolute aspect-16/10 rounded-lg border bg-bg-tertiary object-cover object-top {item.class}"
					/>
				{/each}
			</div>
		</article>

		<!-- Export & share -->
		<article use:reveal={{ y: 18 }} class={card}>
			<div class={copy}>
				<h3 class="landing-subtitle">Export &amp; share</h3>
				<p class="landing-body">
					Download as a high-res PNG or share your unique link with recruiters.
				</p>
			</div>
			<div class="mt-auto flex flex-col gap-3 pb-8 md:pb-10" aria-hidden="true">
				{#each exportRows as row (row.title)}
					<div
						class="flex items-center gap-3 rounded-lg border border-border-default bg-bg-primary p-3 {row.offset}"
					>
						<span
							class={[
								'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
								'highlight' in row
									? 'bg-accent-deep text-accent'
									: 'bg-bg-tertiary text-text-secondary'
							]}
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={row.icon}
								/>
							</svg>
						</span>
						<div class="min-w-0 flex-1">
							<p
								class={[
									'truncate text-text-primary',
									'mono' in row ? 'font-mono text-[13px]' : 'text-sm'
								]}
							>
								{row.title}
							</p>
							<p class="text-xs text-text-tertiary">{row.subtitle}</p>
						</div>
						{#if 'trailing' in row && row.trailing === 'download'}
							<svg
								class="h-4 w-4 shrink-0 text-text-tertiary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={DOWNLOAD_ICON}
								/>
							</svg>
						{:else if 'trailing' in row && row.trailing === 'copy'}
							<span class="shrink-0 text-xs text-text-tertiary">Copy</span>
						{/if}
					</div>
				{/each}
			</div>
		</article>

		<!-- Explore -->
		<article use:reveal={{ y: 18, delay: 60 }} class={card}>
			<div class={copy}>
				<h3 class="landing-subtitle">Explore developers</h3>
				<p class="landing-body">
					Browse trending repositories, GitHub rankings, and top developers on an interactive globe.
				</p>
			</div>
			<ExplorePreview class="{panel} mt-auto flex-1 p-5 pb-2" />
		</article>
	</div>
</section>
