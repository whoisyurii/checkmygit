<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		href?: string;
		children: Snippet;
	}

	let { class: className = '', href, children }: Props = $props();

	const baseClasses = 'border-b border-[var(--color-border-default)] transition-colors';
	const hoverClasses = $derived(href ? 'hover:bg-[var(--color-bg-tertiary)] cursor-pointer' : 'hover:bg-[var(--color-bg-tertiary)]/50');
</script>

{#if href}
	<tr class="{baseClasses} {hoverClasses} {className}" onclick={() => window.location.href = href}>
		{@render children()}
	</tr>
{:else}
	<tr class="{baseClasses} {hoverClasses} {className}">
		{@render children()}
	</tr>
{/if}
