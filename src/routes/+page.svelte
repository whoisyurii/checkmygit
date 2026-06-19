<script lang="ts">
	import { SITE_URL } from '$lib/constants';
	import { jsonLd } from '$lib/utils/jsonld';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import DitherBackground from '$lib/components/landing/DitherBackground.svelte';
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
	<!-- Floating dithered field behind the hero, with a scrim that keeps the copy
	     readable; the whole backdrop region fades out before the showcase. -->
	<div class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[820px]">
		<div
			class="absolute inset-0"
			style="-webkit-mask-image: linear-gradient(to bottom, black 55%, transparent); mask-image: linear-gradient(to bottom, black 55%, transparent);"
		>
			<DitherBackground />
		</div>
		<div class="hero-scrim absolute inset-0"></div>
	</div>

	<Hero totalPortfolios={data.totalPortfolios} />
	<ScreenshotShowcase />
	<Features />
	<FeaturedProfiles />
	<CallToAction />
</main>

<Footer />
