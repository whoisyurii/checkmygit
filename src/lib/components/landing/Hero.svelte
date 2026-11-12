<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import TemplateShowcase from './TemplateShowcase.svelte';
	import { validateGitHubUsername } from '$lib/types/portfolio';
	import { formatNumber } from '$lib/utils/github-transform';
	import { FEATURED_PROFILES } from '$lib/constants';
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

<section class="relative z-10 flex w-full items-center">
	<div class="landing-container flex flex-col items-center gap-10 pt-32 pb-20 md:gap-14 md:pt-40">
		<div class="flex w-full max-w-[800px] flex-col items-center gap-8 pt-4 text-center">
			<div
				class="hero-enter flex flex-col items-center gap-4"
				style="--enter-y: 24px; --enter-blur: 10px; animation-duration: 0.9s"
			>
				<span
					class="inline-flex items-center gap-2 text-[13px] leading-none font-medium text-text-primary/60"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]"
					></span>
					{#if totalPortfolios > 0}
						<span>
							<span class="font-semibold text-text-primary">{formatNumber(totalPortfolios)}</span>
							portfolios generated
						</span>
					{:else}
						Free &amp; open source
					{/if}
				</span>

				<h1 class="landing-hero-title">
					Transform your GitHub
					<br />
					into a portfolio
				</h1>
			</div>

			<p
				class="hero-enter landing-body w-full max-w-[720px]"
				style="--enter-y: 20px; --enter-blur: 8px; animation-delay: 0.15s"
			>
				Generate beautiful, shareable portfolio pages from any GitHub profile. Showcase your
				contributions, projects, and skills in seconds.
			</p>

			<div
				class="hero-enter relative z-20 mt-2 flex w-full flex-col items-center"
				style="--enter-y: 16px; animation-duration: 0.7s; animation-delay: 0.3s"
			>
				<!-- Username field + action share one pill -->
				<div
					class="flex w-full max-w-[460px] items-center gap-1.5 rounded-full border border-text-primary/20 bg-text-primary/8 p-1.5 transition-colors focus-within:border-text-primary/45"
				>
					<div class="flex min-w-0 flex-1 items-center pl-3">
						<svg
							class="h-5 w-5 shrink-0 text-text-primary/50"
							fill="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
							/>
						</svg>
						<input
							id="hero-username"
							type="text"
							placeholder="github-username"
							aria-label="GitHub username"
							bind:value={username}
							onkeydown={handleKeydown}
							class="w-full border-none bg-transparent px-2.5 py-1.5 text-[15px] text-text-primary placeholder-text-primary/40 ring-0! outline-none! focus:border-none! focus:ring-0! focus:outline-none! focus-visible:border-none! focus-visible:ring-0! focus-visible:outline-none!"
							spellcheck="false"
							autocapitalize="off"
							autocomplete="off"
						/>
					</div>
					<Button
						variant="primary"
						onclick={handleSubmit}
						loading={isLoading}
						size="pill"
						class="shrink-0"
					>
						Generate
					</Button>
				</div>

				{#if error}
					<p class="animate-fade-in mt-4 text-sm font-medium text-accent-red">{error}</p>
				{/if}

				<p class="mt-5 text-sm text-text-primary/50">
					Try specific profiles:
					{#each FEATURED_PROFILES as { username: name }, i (name)}{#if i},{/if}
						<button
							type="button"
							onclick={() => setUsername(name)}
							class={[
								'cursor-pointer font-medium text-text-primary/80 transition-colors hover:text-accent',
								i === 0 && 'ml-1'
							]}>{name}</button
						>{/each}
				</p>
			</div>
		</div>

		<!-- Template gallery, the centerpiece under the copy -->
		<div class="hero-enter w-full max-w-[1020px]" style="--enter-y: 20px; animation-delay: 0.4s">
			<TemplateShowcase />
		</div>
	</div>
</section>
