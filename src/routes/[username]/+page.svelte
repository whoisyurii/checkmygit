<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import TemplateGitHub from '$lib/components/templates/TemplateGitHub.svelte';
	import TemplateBento from '$lib/components/templates/TemplateBento.svelte';
	import TemplateMinimal from '$lib/components/templates/TemplateMinimal.svelte';
	import ExportContainer from '$lib/components/export/ExportContainer.svelte';
	import { generatorState, toastState } from '$lib/stores/generator.svelte';
	import { navigationState } from '$lib/stores/navigation.svelte';
	import { generateShareUrl } from '$lib/utils/github-transform';
	import type { TemplateType } from '$lib/types/portfolio';

	let { data } = $props();

	// Track if we came from a navigation (for enter animation)
	let showEnterAnimation = $state(navigationState.phase === 'loading' || navigationState.phase === 'exiting');

	// Signal that the profile has loaded - trigger enter animation
	onMount(() => {
		// Small delay to ensure the page has rendered before revealing
		requestAnimationFrame(() => {
			navigationState.profileLoaded();
		});
	});

	// Initialize template from URL params
	$effect(() => {
		const params = $page.url.searchParams;
		generatorState.loadFromParams(params);
	});

	// Handle template change
	function handleTemplateChange(template: TemplateType) {
		generatorState.setTemplate(template);
		// Update URL without navigation
		const params = generatorState.toParams();
		const newUrl = `/${data.username}${params.toString() ? `?${params}` : ''}`;
		goto(newUrl, { replaceState: true, noScroll: true });
	}

	// Handle export
	async function handleExport() {
		generatorState.enterExportMode();

		// Wait for export container to render
		await tick();

		try {
			const { toPng } = await import('html-to-image');
			const element = document.getElementById('export-container');
			if (!element) throw new Error('Export container not found');

			// Wait for fonts to load
			await document.fonts.ready;

			const dataUrl = await toPng(element, {
				pixelRatio: 2,
				cacheBust: true,
				skipFonts: true,
				fontEmbedCSS: '',
				filter: (node) => {
					// Skip script tags and other problematic nodes
					return !(node instanceof HTMLScriptElement);
				}
			});

			// Download
			const link = document.createElement('a');
			link.download = `${data.username}-portfolio.png`;
			link.href = dataUrl;
			link.click();

			toastState.success('Portfolio exported successfully!');
		} catch (err) {
			console.error('Export failed:', err);
			toastState.error('Failed to export portfolio');
		} finally {
			generatorState.exitExportMode();
		}
	}

	// Handle share
	async function handleShare() {
		const url = generateShareUrl(data.username, {
			template: generatorState.template,
			theme: generatorState.theme
		});

		try {
			await navigator.clipboard.writeText(url);
			toastState.success('Link copied to clipboard!');
		} catch {
			// Fallback for browsers without clipboard API
			toastState.info(url);
		}
	}
</script>

<svelte:head>
	<title>{data.profile.user.name || data.username} - CheckMyGit</title>
	<meta name="description" content="GitHub portfolio for {data.profile.user.name || data.username}. {data.profile.user.bio || 'View their projects and contributions.'}" />
	<meta property="og:title" content="{data.profile.user.name || data.username} - CheckMyGit" />
	<meta property="og:description" content="{data.profile.user.bio || `GitHub portfolio for ${data.username}`}" />
	<meta property="og:image" content="{data.profile.user.avatarUrl}" />
	<meta property="og:type" content="profile" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class:page-enter={showEnterAnimation}>
	<Header
	username={data.username}
	template={generatorState.template}
	showControls={true}
	onTemplateChange={handleTemplateChange}
	onExport={handleExport}
	onShare={handleShare}
	/>

	<main id="portfolio-container" class="min-h-screen bg-bg-primary">
		{#if generatorState.template === 'github'}
			<TemplateGitHub profile={data.profile} views={data.views} />
		{:else if generatorState.template === 'bento'}
			<TemplateBento profile={data.profile} views={data.views} />
		{:else if generatorState.template === 'minimal'}
			<TemplateMinimal profile={data.profile} views={data.views} />
		{/if}
	</main>

	<Footer />
</div>

<!-- Export Container (rendered off-screen when exporting) -->
{#if generatorState.isExportMode}
	<div class="fixed -left-[9999px] top-0">
		<ExportContainer>
			{#if generatorState.template === 'github'}
				<TemplateGitHub profile={data.profile} views={data.views} />
			{:else if generatorState.template === 'bento'}
				<TemplateBento profile={data.profile} views={data.views} />
			{:else if generatorState.template === 'minimal'}
				<TemplateMinimal profile={data.profile} views={data.views} />
			{/if}
		</ExportContainer>
	</div>
{/if}
