<script lang="ts" generics="T extends string">
	import type { Snippet } from 'svelte';

	interface Item {
		value: T;
		label: string;
		// Shorter label for narrow screens
		mobileLabel?: string;
	}

	interface Props {
		items: Item[];
		value: T;
		onchange: (value: T) => void;
		ariaLabel?: string;
		// Compact, fully rounded toggle
		pill?: boolean;
		icon?: Snippet<[{ item: Item; active: boolean }]>;
	}

	let { items, value, onchange, ariaLabel = 'Tabs', pill = false, icon }: Props = $props();

	const STYLES = {
		default: {
			list: 'gap-1 rounded-lg bg-bg-secondary p-1',
			tab: 'rounded-md px-4 py-2 text-sm',
			active: 'bg-bg-primary text-text-primary shadow-sm ring-1 ring-border-default/60',
			idle: 'text-text-secondary hover:bg-bg-tertiary/60 hover:text-text-primary'
		},
		pill: {
			list: 'h-8 items-center rounded-full p-[3px]',
			tab: 'h-full rounded-full px-3 text-xs',
			active: 'bg-text-primary/12 text-text-primary shadow-sm',
			idle: 'text-text-secondary hover:text-text-primary'
		}
	};

	let styles = $derived(pill ? STYLES.pill : STYLES.default);
</script>

<!-- Scrolls sideways when the tabs outgrow their container, rather than wrapping or overflowing -->
<div
	class="inline-flex max-w-full overflow-x-auto border border-border-default {styles.list}"
	role="tablist"
	aria-label={ariaLabel}
>
	{#each items as item (item.value)}
		{@const active = item.value === value}
		<button
			type="button"
			role="tab"
			aria-selected={active}
			onclick={() => onchange(item.value)}
			class="flex shrink-0 cursor-pointer items-center gap-2 font-medium whitespace-nowrap transition-all {styles.tab} {active
				? styles.active
				: styles.idle}"
		>
			{#if icon}{@render icon({ item, active })}{/if}
			{#if item.mobileLabel}
				<span class="sm:hidden">{item.mobileLabel}</span>
				<span class="hidden sm:inline">{item.label}</span>
			{:else}
				{item.label}
			{/if}
		</button>
	{/each}
</div>
