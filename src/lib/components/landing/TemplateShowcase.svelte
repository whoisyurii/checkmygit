<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import SegmentedTabs from '$lib/components/ui/SegmentedTabs.svelte';
	import { themeState } from '$lib/stores/theme.svelte';
	import { TEMPLATES, type TemplateType } from '$lib/types/portfolio';
	import githubDark from '$lib/assets/templates/github-dark.webp';
	import githubLight from '$lib/assets/templates/github-light.webp';
	import bentoDark from '$lib/assets/templates/bento-dark.webp';
	import bentoLight from '$lib/assets/templates/bento-light.webp';
	import minimalDark from '$lib/assets/templates/minimal-dark.webp';
	import minimalLight from '$lib/assets/templates/minimal-light.webp';

	interface Props {
		// Extra classes for the card, e.g. a breakpoint-gated tilt owned by the parent layout
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	// Captures per template; adding a template without one is a type error here.
	const screenshots: Record<TemplateType, { dark: string; light: string }> = {
		github: { dark: githubDark, light: githubLight },
		bento: { dark: bentoDark, light: bentoLight },
		minimal: { dark: minimalDark, light: minimalLight }
	};

	// How long each template stays on screen before the gallery advances
	const ROTATE_MS = 4000;

	let active = $state<TemplateType>(TEMPLATES[0].id);
	let paused = $state(false);

	const pause = () => (paused = true);
	const resume = () => (paused = false);

	// Auto-advance. Reading `active` here re-runs the effect after every change,
	// so the timer restarts whether the slide advanced on its own or via the tabs.
	$effect(() => {
		if (paused || prefersReducedMotion.current) return;
		const index = TEMPLATES.findIndex((t) => t.id === active);
		const next = TEMPLATES[(index + 1) % TEMPLATES.length].id;
		const id = setTimeout(() => (active = next), ROTATE_MS);
		return () => clearTimeout(id);
	});
</script>

<div
	class="animate-fade-in relative w-full perspective-[1600px]"
	role="group"
	aria-label="Portfolio template previews"
	onmouseenter={pause}
	onmouseleave={resume}
	onfocusin={pause}
	onfocusout={resume}
>
	<div class="relative transition-transform duration-700 ease-out {className}">
		<!-- Teal glow beneath the card -->
		<div
			class="pointer-events-none absolute inset-x-12 -bottom-4 h-16 bg-accent-deep opacity-70 blur-3xl"
		></div>

		<div
			class="relative aspect-16/10 w-full overflow-hidden rounded-2xl border border-border-subtle bg-bg-tertiary shadow-2xl"
		>
			{#each TEMPLATES as template, i (template.id)}
				{@const shot = screenshots[template.id]}
				<img
					src={themeState.isLight ? shot.light : shot.dark}
					alt="{template.label} template preview"
					fetchpriority={i === 0 ? 'high' : 'low'}
					decoding="async"
					aria-hidden={template.id !== active}
					class={[
						'absolute inset-0 h-full w-full object-cover object-top transition-[opacity,scale] duration-700 ease-out',
						template.id !== active && 'scale-[1.03] opacity-0'
					]}
				/>
			{/each}
		</div>
	</div>

	<!-- Jump to a template; otherwise the gallery cycles on its own -->
	<div class="mt-5 flex justify-center">
		<SegmentedTabs
			items={TEMPLATES.map(({ id, label }) => ({ value: id, label }))}
			value={active}
			onchange={(id) => (active = id)}
			ariaLabel="Portfolio template"
		/>
	</div>
</div>
