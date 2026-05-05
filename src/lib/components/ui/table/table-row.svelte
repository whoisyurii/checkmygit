<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		href?: string;
		target?: '_blank' | '_self';
		children: Snippet;
	}

	let { class: className = '', href, target = '_self', children }: Props = $props();

	const baseClasses = 'border-b border-[var(--color-border-default)] transition-colors';
	const hoverClasses = $derived(
		href
			? 'hover:bg-[var(--color-bg-tertiary)] cursor-pointer'
			: 'hover:bg-[var(--color-bg-tertiary)]/50'
	);

	function handleClick() {
		if (!href) return;
		if (target === '_blank') {
			window.open(href, '_blank', 'noopener,noreferrer');
		} else {
			window.location.href = href;
		}
	}
</script>

{#if href}
	<tr class="{baseClasses} {hoverClasses} {className}" onclick={handleClick}>
		{@render children()}
	</tr>
{:else}
	<tr class="{baseClasses} {hoverClasses} {className}">
		{@render children()}
	</tr>
{/if}
