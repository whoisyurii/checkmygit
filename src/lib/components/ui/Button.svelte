<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		// `pill`: fully rounded, with a ripple on hover instead of a background swap
		size?: 'sm' | 'md' | 'lg' | 'pill';
		disabled?: boolean;
		loading?: boolean;
		href?: string;
		target?: string;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		href,
		target,
		type = 'button',
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

	const variantClasses = {
		primary:
			'bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover focus-visible:ring-accent',
		secondary:
			'bg-btn-secondary-bg text-btn-secondary-text border border-border-default hover:bg-btn-secondary-hover hover:border-border-muted focus-visible:ring-accent',
		ghost: 'text-text-primary hover:text-text-primary hover:bg-bg-tertiary focus-visible:ring-accent',
		danger: 'bg-accent-red text-white hover:bg-red-600 focus-visible:ring-accent-red'
	};

	// Pill colours; the hover feedback comes from the ripple (`.pill-ripple`), tinted by --ripple
	const pillVariantClasses: Partial<Record<NonNullable<Props['variant']>, string>> = {
		primary:
			'bg-btn-primary-bg text-btn-primary-text border-transparent [--ripple:color-mix(in_srgb,var(--color-btn-primary-text)_20%,transparent)] focus-visible:ring-accent',
		secondary:
			'bg-text-primary/6 text-text-primary border-text-primary/15 duration-350 hover:border-text-primary/60 [--ripple:color-mix(in_srgb,var(--color-text-primary)_14%,transparent)] focus-visible:ring-accent'
	};

	// A container can round every button inside it by setting --btn-radius
	const sizeClasses = {
		sm: 'h-8 px-3 text-sm rounded-[var(--btn-radius,var(--radius-md))] gap-1.5',
		md: 'h-10 px-4 text-sm rounded-[var(--btn-radius,var(--radius-md))] gap-2',
		lg: 'h-12 px-5 text-base rounded-[var(--btn-radius,var(--radius-lg))] gap-2',
		pill: 'pill-ripple rounded-full border px-[18px] py-[11px] text-[15px] leading-[1.2] gap-1.5'
	};

	const classes = $derived(
		`${baseClasses} ${(size === 'pill' && pillVariantClasses[variant]) || variantClasses[variant]} ${sizeClasses[size]} ${className}`
	);
</script>

{#if href}
	<a {href} {target} class={classes} class:opacity-50={disabled} rel={target === '_blank' ? 'noopener noreferrer' : undefined}>
		{#if loading}
			<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		{/if}
		{@render children()}
	</a>
{:else}
	<button {type} class={classes} disabled={disabled || loading} {onclick}>
		{#if loading}
			<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		{/if}
		{@render children()}
	</button>
{/if}
