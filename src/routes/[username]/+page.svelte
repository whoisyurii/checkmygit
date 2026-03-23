<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, tick } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import TemplateGitHub from '$lib/components/templates/TemplateGitHub.svelte';
	import TemplateBento from '$lib/components/templates/TemplateBento.svelte';
	import TemplateMinimal from '$lib/components/templates/TemplateMinimal.svelte';
	import ProfileSkeletonGitHub from '$lib/components/portfolio/ProfileSkeletonGitHub.svelte';
	import ExportContainer from '$lib/components/export/ExportContainer.svelte';
	import QRModal from '$lib/components/ui/QRModal.svelte';
	import { generatorState, toastState } from '$lib/stores/generator.svelte';
	import { navigationState } from '$lib/stores/navigation.svelte';
	import { themeState } from '$lib/stores/theme.svelte';
	import { generateShareUrl } from '$lib/utils/github-transform';
	import { generateQRCode } from '$lib/utils/qr';
	import type { TemplateType } from '$lib/types/portfolio';
	import type { GitHubProfile } from '$lib/types/github';

	let { data } = $props();

	// Track loading state and resolved data
	let isLoading = $state(true);
	let loadError = $state<Error | null>(null);
	let profile = $state<GitHubProfile | null>(null);
	let views = $state<number>(0);

	// Resolve the streamed promises
	$effect(() => {
		isLoading = true;
		loadError = null;

		Promise.all([data.profile, data.views])
			.then(([resolvedProfile, resolvedViews]) => {
				profile = resolvedProfile;
				views = resolvedViews;
				isLoading = false;
			})
			.catch((err) => {
				loadError = err;
				isLoading = false;
			});
	});

	// Track if we came from a navigation (for enter animation)
	let showEnterAnimation = $derived(navigationState.phase === 'entering');

	// Signal that the profile has loaded - trigger enter animation
	onMount(() => {
		// Small delay to ensure the page has rendered before revealing
		requestAnimationFrame(() => {
			navigationState.profileLoaded();
		});
	});

	// Check if on mobile (matches Tailwind's sm breakpoint: 640px)
	function isMobile(): boolean {
		if (typeof window === 'undefined') return false;
		return window.innerWidth < 640;
	}

	// Initialize template from URL params
	$effect(() => {
		const params = $page.url.searchParams;
		generatorState.loadFromParams(params);

		// Force GitHub template on mobile
		if (isMobile() && generatorState.template !== 'github') {
			generatorState.setTemplate('github');
		}
	});

	// Handle template change (only called on desktop since selector is hidden on mobile)
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
			theme: themeState.current
		});

		try {
			await navigator.clipboard.writeText(url);
			toastState.success('Link copied to clipboard!');
		} catch {
			// Fallback for browsers without clipboard API
			toastState.info(url);
		}
	}

	// Handle QR code generation
	async function handleQRCode() {
		const url = generateShareUrl(data.username, {
			template: generatorState.template,
			theme: themeState.current
		});

		try {
			const qrDataUrl = await generateQRCode(url);
			generatorState.setQRDataUrl(qrDataUrl);
			generatorState.openQRModal();
		} catch (err) {
			console.error('QR generation failed:', err);
			toastState.error('Failed to generate QR code');
		}
	}

	// Get current share URL for modal display
	function getCurrentShareUrl(): string {
		return generateShareUrl(data.username, {
			template: generatorState.template,
			theme: themeState.current
		});
	}

	// Handle QR code download
	function handleQRDownload() {
		const link = document.createElement('a');
		link.download = `${data.username}-qrcode.png`;
		link.href = generatorState.qrDataUrl;
		link.click();
		toastState.success('QR code downloaded!');
	}
</script>

<svelte:head>
	<title>{profile?.user.name || data.username} - CheckMyGit</title>
	<meta name="description" content="GitHub portfolio for {profile?.user.name || data.username}. {profile?.user.bio || 'View their projects and contributions.'}" />
	<meta property="og:title" content="{profile?.user.name || data.username} - CheckMyGit" />
	<meta property="og:description" content="{profile?.user.bio || `GitHub portfolio for ${data.username}`}" />
	{#if profile?.user.avatarUrl}
		<meta property="og:image" content="{profile.user.avatarUrl}" />
	{/if}
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
	onQRCode={handleQRCode}
	/>

	<main id="portfolio-container" class="min-h-screen bg-bg-primary">
		{#if isLoading}
			<!-- Show skeleton while loading -->
			<ProfileSkeletonGitHub />
		{:else if loadError}
			<!-- Error state -->
			<div class="flex min-h-[60vh] items-center justify-center">
				<div class="text-center">
					<div class="mb-4 text-6xl">😕</div>
					<h2 class="mb-2 text-xl font-semibold text-text-primary">Something went wrong</h2>
					<p class="mb-4 text-text-secondary">{loadError.message || 'Failed to load profile'}</p>
					<a href={resolve('/')} class="text-accent-green hover:underline">← Back to home</a>
				</div>
			</div>
		{:else if profile}
			{#if generatorState.template === 'github'}
				<TemplateGitHub {profile} {views} />
			{:else if generatorState.template === 'bento'}
				<TemplateBento {profile} {views} />
			{:else if generatorState.template === 'minimal'}
				<TemplateMinimal {profile} {views} />
			{/if}
		{/if}
	</main>

	<Footer />
</div>

<!-- Export Container (rendered off-screen when exporting) -->
{#if generatorState.isExportMode && profile}
	<div class="fixed -left-[9999px] top-0">
		<ExportContainer>
			{#if generatorState.template === 'github'}
				<TemplateGitHub {profile} {views} />
			{:else if generatorState.template === 'bento'}
				<TemplateBento {profile} {views} />
			{:else if generatorState.template === 'minimal'}
				<TemplateMinimal {profile} {views} />
			{/if}
		</ExportContainer>
	</div>
{/if}

<!-- QR Code Modal -->
{#if generatorState.isQRModalOpen}
	<QRModal
		qrDataUrl={generatorState.qrDataUrl}
		url={getCurrentShareUrl()}
		onClose={() => generatorState.closeQRModal()}
		onDownload={handleQRDownload}
	/>
{/if}
