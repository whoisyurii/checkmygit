<script lang="ts">
	import Logo from './header/Logo.svelte';
	import HeaderActions from './header/HeaderActions.svelte';

	// Floats over the hero, transparent until the page scrolls, then becomes a pill
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
		<HeaderActions />
	</div>
</header>
