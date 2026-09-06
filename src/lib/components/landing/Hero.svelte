<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import TemplateShowcase from './TemplateShowcase.svelte';
	import { validateGitHubUsername } from '$lib/types/portfolio';
	import { formatNumber } from '$lib/utils/github-transform';
	import { navigationState } from '$lib/stores/navigation.svelte';

	interface Props {
		totalPortfolios?: number;
	}

	let { totalPortfolios = 0 }: Props = $props();

	let username = $state('');
	let error = $state('');

	// Derive loading from navigation state
	let isLoading = $derived(navigationState.isLoading);

	async function handleSubmit() {
		const trimmed = username.trim();
		const validation = validateGitHubUsername(trimmed);
		if (!validation.valid) {
			error = validation.errors[0];
			return;
		}
		error = '';
		await navigationState.navigateToProfile(trimmed);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSubmit();
		}
	}

	function setUsername(name: string) {
		username = name;
	}
</script>

<section class="relative z-10 px-4 pt-16 pb-20 sm:px-6 md:pt-24 md:pb-24 lg:px-8 lg:pb-28">
	<div class="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
		<!-- Copy + CTA -->
		<!-- @container: type scales with this column's width, not the viewport, so it stays
		     correct whether the column is full-width (stacked) or half-width (side by side) -->
		<div
			class="animate-fade-in @container flex flex-col items-center text-center lg:items-start lg:text-left"
		>
			<!-- Badge -->
			{#if totalPortfolios > 0}
				<div
					class="animate-fade-in-delay-1 mb-8 inline-flex items-center rounded-full border border-border-subtle bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary shadow-sm backdrop-blur-sm"
				>
					<span class="mr-2 h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]"
					></span>
					<span class="mr-1 font-semibold text-text-primary">{formatNumber(totalPortfolios)}</span>
					portfolios generated
				</div>
			{/if}

			<h1 class="mb-6 text-4xl font-bold tracking-tight @lg:text-5xl @2xl:text-6xl">
				Transform your GitHub
				<br />
				<span class="text-gradient">into a portfolio</span>
			</h1>

			<p class="mb-10 w-full max-w-136 text-base text-text-secondary @lg:text-lg">
				Generate beautiful, shareable portfolio pages from any GitHub profile. Showcase your
				contributions, projects, and skills in seconds.
			</p>

			<!-- Input Container -->
			<div
				class="glass-panel flex w-full max-w-130 items-center gap-1.5 rounded-2xl p-2 transition-all focus-within:ring-2 focus-within:ring-accent-deep sm:gap-2"
			>
				<div class="relative flex min-w-0 flex-1 items-center px-2 sm:px-3">
					<svg class="h-5 w-5 text-text-tertiary" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
						/>
					</svg>
					<input
						type="text"
						placeholder="github-username"
						bind:value={username}
						onkeydown={handleKeydown}
						class="w-full border-none bg-transparent p-2 text-base text-text-primary placeholder-text-placeholder ring-0! outline-none! focus:border-none! focus:ring-0! focus:outline-none! focus-visible:border-none! focus-visible:ring-0! focus-visible:outline-none!"
						spellcheck="false"
					/>
				</div>
				<Button
					variant="primary"
					size="md"
					onclick={handleSubmit}
					loading={isLoading}
					class="h-10 shrink-0 rounded-xl px-4 font-semibold shadow-lg shadow-accent/20 sm:px-6"
				>
					Generate
				</Button>
			</div>

			{#if error}
				<p class="animate-fade-in mt-4 text-sm font-medium text-accent-red">{error}</p>
			{/if}

			<p class="animate-fade-in-delay-1 mt-6 text-sm text-text-tertiary">
				Try specific profiles:
				<button
					type="button"
					onclick={() => setUsername('torvalds')}
					class="ml-1 cursor-pointer font-medium text-text-secondary transition-colors hover:text-accent"
					>torvalds</button
				>,
				<button
					type="button"
					onclick={() => setUsername('rich-harris')}
					class="cursor-pointer font-medium text-text-secondary transition-colors hover:text-accent"
					>rich-harris</button
				>,
				<button
					type="button"
					onclick={() => setUsername('whoisyurii')}
					class="cursor-pointer font-medium text-text-secondary transition-colors hover:text-accent"
					>whoisyurii</button
				>
			</p>
		</div>

		<!-- Template gallery; tilted toward the copy only when the columns sit side by side -->
		<TemplateShowcase class="lg:-rotate-y-7 lg:hover:rotate-y-0" />
	</div>
</section>
