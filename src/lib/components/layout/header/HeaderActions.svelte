<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import { page } from '$app/stores';
	import { REPO_URL } from '$lib/constants';
	import { githubStarsState } from '$lib/stores/githubStars.svelte';
	import { formatNumber } from '$lib/utils/github-transform';

	interface Props {
		showControls?: boolean;
		onExport?: () => void;
		onShare?: () => void;
		onQRCode?: () => void;
	}

	let { showControls = false, onExport, onShare, onQRCode }: Props = $props();

	let isExplore = $derived($page.url.pathname.startsWith('/explore'));

	$effect(() => {
		githubStarsState.init();
	});
</script>

<div class="flex shrink-0 items-center gap-2">
	<!-- Hidden in profile preview on mobile to avoid header overflow -->
	<Button
		variant="ghost"
		size="sm"
		href="/explore/trending"
		class="{showControls ? 'hidden! sm:inline-flex!' : ''} {isExplore ? 'text-accent!' : ''}"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
			<circle cx="12" cy="12" r="9" stroke-width="2" />
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M14.9 9.1l-1.7 4.1-4.1 1.7 1.7-4.1 4.1-1.7z"
			/>
		</svg>
		<span class="hidden sm:inline">Explore</span>
	</Button>

	{#if showControls}
		<Button variant="ghost" size="sm" onclick={onExport} class="hidden! sm:inline-flex!">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
				/>
			</svg>
			<span class="hidden sm:inline">Export</span>
		</Button>
		<Button variant="ghost" size="sm" onclick={onShare}>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
				/>
			</svg>
			<span class="hidden sm:inline">Share</span>
		</Button>
		<Button variant="ghost" size="sm" onclick={onQRCode}>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
				/>
			</svg>
			<span class="hidden sm:inline">QR</span>
		</Button>
	{/if}

	<ThemeToggle />

	<Button variant="secondary" size="sm" href={REPO_URL} target="_blank">
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
			<path
				d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"
			/>
		</svg>
		<span class="inline-flex items-center gap-1">
			{#if githubStarsState.count !== null}
				<span class="tabular-nums">{formatNumber(githubStarsState.count)}</span>
			{:else}
				<span
					aria-hidden="true"
					class="inline-block h-3 w-7 animate-pulse rounded bg-text-tertiary/30"
				></span>
			{/if}
			<span class="hidden sm:inline">Github</span>
		</span>
	</Button>
</div>
