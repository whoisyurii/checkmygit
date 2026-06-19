<script lang="ts">
	import { SITE_URL } from '$lib/constants';
	import { jsonLd } from '$lib/utils/jsonld';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import DitherBackdrop from '$lib/components/landing/DitherBackdrop.svelte';
	import ScreenshotShowcase from '$lib/components/landing/ScreenshotShowcase.svelte';
	import Features from '$lib/components/landing/Features.svelte';
	import FeaturedProfiles from '$lib/components/landing/FeaturedProfiles.svelte';
	import CallToAction from '$lib/components/landing/CallToAction.svelte';

	let { data } = $props();

	const websiteSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'CheckMyGit',
		alternateName: 'CheckMyGit — GitHub Portfolio Generator',
		url: SITE_URL,
		description:
			'Turn any GitHub profile into a shareable portfolio — contributions, languages, pinned projects, and more.',
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${SITE_URL}/{search_term_string}`
			},
			'query-input': 'required name=search_term_string'
		}
	};
</script>

<svelte:head>
	<title>CheckMyGit - Your GitHub story, beautifully told</title>
	<meta
		name="description"
		content="Turn any GitHub profile into a shareable portfolio. Three templates, contribution graph, language stats, one-click PNG export. Free and open source."
	/>
	{@html jsonLd(websiteSchema)}
</svelte:head>

<Header />

<main class="relative min-h-screen w-full overflow-hidden">
	<!-- Floating dithered field behind the hero, fading out before the showcase -->
	<DitherBackdrop />

	<Hero totalPortfolios={data.totalPortfolios} />
	<ScreenshotShowcase />
	<Features />
	<FeaturedProfiles />
	<CallToAction />
</main>

<Footer />
