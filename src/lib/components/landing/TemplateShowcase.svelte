<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import { SvelteSet } from 'svelte/reactivity';
	import SegmentedTabs from '$lib/components/ui/SegmentedTabs.svelte';
	import { themeState } from '$lib/stores/theme.svelte';
	import { inView } from '$lib/utils/in-view';
	import { TEMPLATES, type TemplateType } from '$lib/types/portfolio';
	import { TEMPLATE_SCREENSHOTS } from './template-screenshots';

	// How long each template stays on screen before the gallery advances
	const ROTATE_MS = 4000;

	const following = (id: TemplateType) =>
		TEMPLATES[(TEMPLATES.findIndex((t) => t.id === id) + 1) % TEMPLATES.length].id;

	let active = $state<TemplateType>(TEMPLATES[0].id);
	// A capture is fetched once its slide is current or next in line, so a first
	// visit downloads two of them rather than all
	const loaded = new SvelteSet<TemplateType>([TEMPLATES[0].id, following(TEMPLATES[0].id)]);
	let paused = $state(false);
	// No point cross-fading large images while the gallery is scrolled away
	let onScreen = $state(true);

	function show(id: TemplateType) {
		active = id;
		loaded.add(id).add(following(id));
	}

	const pause = () => (paused = true);
	const resume = () => (paused = false);

	// Auto-advance. Reading `active` here re-runs the effect after every change,
	// so the timer restarts whether the slide advanced on its own or via the tabs.
	$effect(() => {
		if (paused || !onScreen || prefersReducedMotion.current) return;
		const next = following(active);
		const id = setTimeout(() => show(next), ROTATE_MS);
		return () => clearTimeout(id);
	});
</script>

<div
	class="relative w-full"
	role="group"
	aria-label="Portfolio template previews"
	onmouseenter={pause}
	onmouseleave={resume}
	onfocusin={pause}
	onfocusout={resume}
	use:inView={{ onchange: (visible) => (onScreen = visible) }}
>
	<!-- Teal glow beneath the window: a plain gradient, no blur filter to composite -->
	<div
		class="pointer-events-none absolute inset-x-0 -bottom-4 h-56 opacity-60"
		style="background: radial-gradient(50% 50% at 50% 50%, var(--color-accent-deep) 0%, color-mix(in srgb, var(--color-accent-deep) 35%, transparent) 45%, transparent 100%)"
	></div>

	<div
		class="relative aspect-16/10 w-full overflow-hidden rounded-xl bg-bg-tertiary shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-text-primary)_12%,transparent),0_24px_72px_rgba(0,0,0,0.2)]"
	>
		{#each TEMPLATES as template, i (template.id)}
			<img
				src={loaded.has(template.id)
					? TEMPLATE_SCREENSHOTS[template.id][themeState.current]
					: undefined}
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

	<!-- Jump to a template; otherwise the gallery cycles on its own -->
	<div class="relative mt-6 flex justify-center">
		<SegmentedTabs
			pill
			items={TEMPLATES.map(({ id, ...rest }) => ({ value: id, ...rest }))}
			value={active}
			onchange={show}
			ariaLabel="Portfolio template"
		/>
	</div>
</div>
