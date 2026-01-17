<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import { REPO_URL, GITHUB_API_URL } from '$lib/constants';

	interface Props {
		showControls?: boolean;
		onExport?: () => void;
		onShare?: () => void;
		onQRCode?: () => void;
	}

	let { showControls = false, onExport, onShare, onQRCode }: Props = $props();

	let starCount = $state<number | null>(null);

	$effect(() => {
		fetch(GITHUB_API_URL)
			.then((res) => res.json())
			.then((data) => {
				if (typeof data.stargazers_count === 'number') {
					starCount = data.stargazers_count;
				}
			})
			.catch(() => {
				// Silently fail - button will still work without count
			});
	});

	function formatStarCount(count: number): string {
		if (count >= 1000) {
			return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
		}
		return count.toString();
	}
</script>

<div class="flex shrink-0 items-center gap-2">
	<!-- Rankings Link -->
	<Button variant="ghost" size="sm" href="/rankings">
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
		</svg>
		<span class="hidden sm:inline">Rankings</span>
	</Button>

	{#if showControls}
		<Button variant="ghost" size="sm" onclick={onExport} class="hidden! sm:inline-flex!">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
			</svg>
			<span class="hidden sm:inline">Export</span>
		</Button>
		<Button variant="ghost" size="sm" onclick={onShare}>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
			</svg>
			<span class="hidden sm:inline">Share</span>
		</Button>
		<Button variant="ghost" size="sm" onclick={onQRCode}>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
			</svg>
			<span class="hidden sm:inline">QR</span>
		</Button>
	{/if}

	<ThemeToggle />

	<Button variant="secondary" size="sm" href={REPO_URL} target="_blank">
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
		</svg>
		{#if starCount !== null}
			<span>{formatStarCount(starCount)} <span class="hidden sm:inline">Github</span></span>
		{:else}
			<span class="hidden sm:inline"> Github</span>
		{/if}
	</Button>
</div>
