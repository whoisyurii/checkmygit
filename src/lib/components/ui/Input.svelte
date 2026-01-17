<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: 'text' | 'email' | 'password' | 'search' | 'url';
		placeholder?: string;
		value?: string;
		disabled?: boolean;
		error?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		id?: string;
		name?: string;
		required?: boolean;
		autofocus?: boolean;
		icon?: Snippet;
		onchange?: (e: Event) => void;
		oninput?: (e: Event) => void;
		onkeydown?: (e: KeyboardEvent) => void;
	}

	let {
		type = 'text',
		placeholder = '',
		value = $bindable(''),
		disabled = false,
		error,
		size = 'md',
		class: className = '',
		id,
		name,
		required = false,
		autofocus = false,
		icon,
		onchange,
		oninput,
		onkeydown
	}: Props = $props();

	const sizeClasses = {
		sm: 'h-8 text-sm px-3',
		md: 'h-10 text-sm px-4',
		lg: 'h-12 text-base px-4'
	};
</script>

<div class="relative {className}">
	{#if icon}
		<div
			class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-tertiary"
		>
			{@render icon()}
		</div>
	{/if}
	<input
		{type}
		{id}
		{name}
		{required}
		{disabled}
		{placeholder}
		bind:value
		{onchange}
		{oninput}
		{onkeydown}
		autofocus={autofocus}
		class="
			w-full rounded-md border bg-bg-secondary
			text-text-primary placeholder-text-placeholder
			transition-colors
			focus:border-accent-green focus:outline-none focus:ring-1 focus:ring-accent-green
			disabled:cursor-not-allowed disabled:opacity-50
			{sizeClasses[size]}
			{icon ? 'pl-10' : ''}
			{error ? 'border-accent-red' : 'border-border-default'}
		"
	/>
	{#if error}
		<p class="mt-1 text-xs text-accent-red">{error}</p>
	{/if}
</div>
