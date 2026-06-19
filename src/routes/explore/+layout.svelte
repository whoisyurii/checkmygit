<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ExploreTabs from '$lib/components/explore/ExploreTabs.svelte';

	let { children } = $props();
</script>

<Header />

<main class="relative min-h-screen w-full overflow-x-hidden">
	<div class="saas-glow"></div>
	<div class="grid-bg absolute inset-0 z-0"></div>

	<div class="relative z-10 mx-auto flex max-w-6xl justify-center px-4 pt-12 sm:px-6 lg:px-8">
		<ExploreTabs />
	</div>

	<div class="relative z-10">
		{@render children()}
	</div>
</main>

<Footer />
