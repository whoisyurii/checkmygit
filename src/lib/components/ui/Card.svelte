<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'elevated' | 'outline' | 'ghost';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		hover?: boolean;
		class?: string;
		children: Snippet;
		onclick?: (e: MouseEvent) => void;
	}

	let {
		variant = 'default',
		padding = 'md',
		hover = false,
		class: className = '',
		children,
		onclick
	}: Props = $props();

	const baseClasses = 'rounded-md transition-all';

	const variantClasses = {
		default: 'bg-bg-secondary border border-border-default',
		elevated: 'bg-bg-secondary border border-border-default shadow-md',
		outline: 'bg-transparent border border-border-default',
		ghost: 'bg-transparent'
	};

	const paddingClasses = {
		none: '',
		sm: 'p-3',
		md: 'p-4',
		lg: 'p-6'
	};

	const hoverClasses = $derived(
		hover ? 'cursor-pointer hover:border-border-subtle hover:bg-bg-tertiary' : ''
	);

	const classes = $derived(`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`);
</script>

{#if onclick}
	<button type="button" class="{classes} w-full text-left" {onclick}>
		{@render children()}
	</button>
{:else}
	<div class={classes}>
		{@render children()}
	</div>
{/if}
