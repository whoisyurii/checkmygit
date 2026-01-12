<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'outline' | 'solid';
		color?: string;
		size?: 'sm' | 'md';
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'default',
		color,
		size = 'md',
		class: className = '',
		children
	}: Props = $props();

	const sizeClasses = {
		sm: 'px-2 py-0.5 text-xs',
		md: 'px-2.5 py-1 text-xs'
	};

	const baseClasses = $derived(`inline-flex items-center rounded-full font-medium whitespace-nowrap ${sizeClasses[size]}`);

	// Generate style if custom color is provided
	const style = $derived(color
		? variant === 'solid'
			? `background-color: ${color}; color: white;`
			: `background-color: ${color}20; color: ${color}; border-color: ${color}40;`
		: '');
</script>

{#if variant === 'default'}
	<span
		class="{baseClasses} bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] {className}"
		{style}
	>
		{@render children()}
	</span>
{:else if variant === 'outline'}
	<span
		class="{baseClasses} border border-[var(--color-border-default)] text-[var(--color-text-secondary)] {className}"
		{style}
	>
		{@render children()}
	</span>
{:else}
	<span
		class="{baseClasses} bg-[var(--color-accent-green)] text-white {className}"
		{style}
	>
		{@render children()}
	</span>
{/if}
