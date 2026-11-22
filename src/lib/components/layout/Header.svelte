<script lang="ts">
	import Logo from './header/Logo.svelte';
	import HeaderSearch from './header/HeaderSearch.svelte';
	import HeaderControls from './header/HeaderControls.svelte';
	import HeaderActions from './header/HeaderActions.svelte';
	import type { TemplateType } from '$lib/types/portfolio';

	interface Props {
		username?: string;
		template?: TemplateType;
		showControls?: boolean;
		// The landing page has its own username field in the hero
		showSearch?: boolean;
		// Pages with a backdrop let it run under the bar; the rest get a spacer instead
		overlay?: boolean;
		onTemplateChange?: (template: TemplateType) => void;
		onExport?: () => void;
		onShare?: () => void;
		onQRCode?: () => void;
	}

	let {
		username = '',
		template = 'github',
		showControls = false,
		showSearch = true,
		overlay = false,
		onTemplateChange,
		onExport,
		onShare,
		onQRCode
	}: Props = $props();

	// Floats over the page, transparent until it scrolls, then becomes a pill
	let scrolled = $state(false);
	// Only writes state when the threshold is crossed, not on every scroll event
	function update() {
		scrolled = window.scrollY > 8;
	}

	$effect(update);
</script>

<svelte:window onscroll={update} />

<header class="landing-container fixed inset-x-0 top-0 z-50 pt-2">
	<div
		class={[
			'flex items-center justify-between gap-4 rounded-full border py-1 transition-[padding,background-color,border-color] duration-400 ease-in-out [--btn-radius:9999px]',
			scrolled ? 'border-border-default bg-bg-tertiary/92 pr-2 pl-4' : 'border-transparent px-0'
		]}
	>
		<Logo />

		{#if showControls}
			<!-- Template selector hidden on mobile - GitHub style is default -->
			<div class="hidden flex-1 justify-center sm:flex">
				<HeaderControls {template} {onTemplateChange} />
			</div>
		{:else if showSearch}
			<!-- Search is desktop-only; mobile users use the on-page search/generate field -->
			<div class="hidden flex-1 justify-center sm:flex">
				<HeaderSearch {username} />
			</div>
		{/if}

		<HeaderActions {showControls} {onExport} {onShare} {onQRCode} />
	</div>
</header>

{#if !overlay}
	<div class="h-16" aria-hidden="true"></div>
{/if}
