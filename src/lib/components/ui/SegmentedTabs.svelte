<script lang="ts" generics="T extends string">
	import type { Snippet } from 'svelte';

	interface Item {
		value: T;
		label: string;
	}

	interface Props {
		items: Item[];
		value: T;
		onchange: (value: T) => void;
		ariaLabel?: string;
		icon?: Snippet<[{ item: Item; active: boolean }]>;
	}

	let { items, value, onchange, ariaLabel = 'Tabs', icon }: Props = $props();
</script>

<div
	class="inline-flex gap-1 rounded-lg border border-border-default bg-bg-secondary p-1"
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
			class="flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all
				{active
				? 'bg-bg-primary text-text-primary shadow-sm ring-1 ring-border-default/60'
				: 'text-text-secondary hover:bg-bg-tertiary/60 hover:text-text-primary'}"
		>
			{#if icon}{@render icon({ item, active })}{/if}
			{item.label}
		</button>
	{/each}
</div>
