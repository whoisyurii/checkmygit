<script lang="ts">
	import { SITE_URL } from '$lib/constants';
	import { jsonLd } from '$lib/utils/jsonld';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
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

<Header overlay showSearch={false} />

<main class="relative min-h-screen w-full overflow-hidden">
	<div class="hero-sky pointer-events-none absolute inset-x-0 top-0" aria-hidden="true"></div>

	<Hero totalPortfolios={data.totalPortfolios} />
	<Features />
	<FeaturedProfiles />
	<CallToAction />
</main>

<Footer />

<style>
	.hero-sky {
		height: clamp(36rem, 64vw, 70rem);
		background: url('/hero-midnight.webp') center top / cover no-repeat;
		mask-image: linear-gradient(to bottom, black 65%, transparent);
	}

	:global(html.light) .hero-sky {
		background-image: url('/hero-daylight.webp');
	}

	@media (max-width: 640px) {
		.hero-sky {
			background-position: 26% top;
		}
	}
</style>
