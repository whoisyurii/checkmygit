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
		onTemplateChange?: (template: TemplateType) => void;
		onExport?: () => void;
		onShare?: () => void;
		onQRCode?: () => void;
	}

	let {
		username = '',
		template = 'github',
		showControls = false,
		onTemplateChange,
		onExport,
		onShare,
		onQRCode
	}: Props = $props();
</script>

<header class="sticky top-0 z-50 w-full border-b border-border-default bg-bg-primary">
	<div class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
		<Logo />

		<!-- Center section with search or controls -->
		<div class="flex flex-1 items-center justify-center gap-4">
			{#if showControls}
				<!-- Template selector hidden on mobile - GitHub style is default -->
				<div class="hidden sm:block">
					<HeaderControls {template} {onTemplateChange} />
				</div>
			{:else}
				<HeaderSearch {username} />
			{/if}
		</div>

		<HeaderActions {showControls} {onExport} {onShare} {onQRCode} />
	</div>
</header>
