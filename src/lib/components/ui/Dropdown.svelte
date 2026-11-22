<script lang="ts">
	import { tick, type Snippet } from 'svelte';

	interface Option {
		value: string;
		label: string;
		mobileLabel?: string;
		icon?: Snippet;
	}

	interface Props {
		options: Option[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		onchange?: (value: string) => void;
		trigger?: Snippet;
	}

	let {
		options,
		value = $bindable(''),
		placeholder = 'Select...',
		disabled = false,
		class: className = '',
		onchange,
		trigger
	}: Props = $props();

	let isOpen = $state(false);
	let root: HTMLDivElement | undefined = $state();
	let menu: HTMLDivElement | undefined = $state();

	const selectedOption = $derived(options.find((o) => o.value === value));

	function items() {
		return [...(menu?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
	}

	async function toggle() {
		if (isOpen) return close();
		isOpen = true;
		await tick();
		// Start on the current option so the arrow keys move from it
		const all = items();
		(all.find((el) => el.ariaSelected === 'true') ?? all[0])?.focus();
	}

	function close() {
		if (!isOpen) return;
		// Hand focus back to the trigger when it was inside the menu
		const hadFocus = menu?.contains(document.activeElement);
		isOpen = false;
		if (hadFocus) root?.querySelector('button')?.focus();
	}

	function selectOption(option: Option) {
		value = option.value;
		close();
		onchange?.(option.value);
	}

	function handleMenuKeydown(e: KeyboardEvent) {
		const all = items();
		const current = all.indexOf(document.activeElement as HTMLElement);
		const next = {
			ArrowDown: Math.min(current + 1, all.length - 1),
			ArrowUp: Math.max(current - 1, 0),
			Home: 0,
			End: all.length - 1
		}[e.key];

		if (next !== undefined) {
			e.preventDefault();
			all[next]?.focus();
		} else if (e.key === 'Escape' || e.key === 'Tab') {
			e.preventDefault();
			close();
		}
	}
</script>

<svelte:window onpointerdown={(e) => !root?.contains(e.target as Node) && close()} />

<div class="relative {className}" bind:this={root}>
	{#if trigger}
		<button
			type="button"
			class="w-full"
			aria-haspopup="listbox"
			aria-expanded={isOpen}
			onclick={toggle}
			{disabled}
		>
			{@render trigger()}
		</button>
	{:else}
		<button
			type="button"
			class={[
				'flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-full border bg-bg-secondary pr-3 pl-3.5 text-sm text-text-primary transition-colors hover:border-border-subtle hover:bg-bg-tertiary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
				isOpen ? 'border-border-subtle bg-bg-tertiary' : 'border-border-default'
			]}
			aria-haspopup="listbox"
			aria-expanded={isOpen}
			onclick={toggle}
			{disabled}
		>
			<span class={['truncate', !selectedOption && 'text-text-placeholder']}>
				{#if selectedOption}
					<span class="sm:hidden">{selectedOption.mobileLabel || selectedOption.label}</span>
					<span class="hidden sm:inline">{selectedOption.label}</span>
				{:else}
					{placeholder}
				{/if}
			</span>
			<svg
				class={[
					'h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-200',
					isOpen && 'rotate-180'
				]}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	{/if}

	{#if isOpen}
		<div
			bind:this={menu}
			role="listbox"
			tabindex="-1"
			class="menu absolute right-0 z-50 mt-2 max-h-72 w-max min-w-full overflow-y-auto rounded-xl border border-border-default bg-bg-tertiary p-1 shadow-lg"
			onkeydown={handleMenuKeydown}
		>
			{#each options as option (option.value)}
				{@const selected = option.value === value}
				<!-- Hover moves focus, so the pointer and the arrow keys share one highlight -->
				<button
					type="button"
					role="option"
					aria-selected={selected}
					class={[
						'flex w-full cursor-pointer items-center gap-2 rounded-lg py-1.5 pr-2 pl-2.5 text-left text-sm outline-none! focus:bg-text-primary/8 focus:text-text-primary',
						selected ? 'font-medium text-text-primary' : 'text-text-secondary'
					]}
					onclick={() => selectOption(option)}
					onpointermove={(e) => e.currentTarget.focus({ preventScroll: true })}
				>
					{#if option.icon}
						{@render option.icon()}
					{/if}
					{option.label}
					<svg
						class={['ml-auto h-4 w-4 shrink-0 text-accent', !selected && 'invisible']}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.menu {
		transform-origin: top;
		animation: menu-in 0.14s ease-out;
	}

	@keyframes menu-in {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.menu {
			animation: none;
		}
	}
</style>
