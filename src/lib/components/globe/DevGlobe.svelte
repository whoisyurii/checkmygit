<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { themeState } from '$lib/stores/theme.svelte';
	import type { GlobePoint } from '$lib/types/globe';
	// Type-only import is erased at build time -> SSR-safe, keeps cobe out of SSR.
	import type { COBEOptions, Marker, Globe as CobeGlobe } from 'cobe';

	let { points }: { points: GlobePoint[] } = $props();

	// Top devs (by followers) become avatar "stickers" anchored to the globe via
	// cobe's CSS anchor positioning; everyone else is a plain glowing dot.
	const STICKER_COUNT = 8;
	const STICKER_MIN_DEG = 30; // min angular gap so sticker cards never overlap
	const sorted = $derived([...points].sort((a, b) => b.followers - a.followers));

	// Great-circle distance (deg) between two points — used to space stickers.
	function angularDistanceDeg(a: GlobePoint, b: GlobePoint): number {
		const rad = (d: number) => (d * Math.PI) / 180;
		const dLat = rad(b.lat - a.lat);
		const dLng = rad(b.lng - a.lng);
		const h =
			Math.sin(dLat / 2) ** 2 +
			Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
		return (2 * Math.asin(Math.min(1, Math.sqrt(h))) * 180) / Math.PI;
	}

	// Greedily pick the most-followed devs that are spatially separated, so the
	// avatar cards stay legible instead of stacking over US/EU clusters.
	const stickers = $derived.by(() => {
		const chosen: GlobePoint[] = [];
		for (const p of sorted) {
			if (chosen.length >= STICKER_COUNT) break;
			if (chosen.every((c) => angularDistanceDeg(c, p) >= STICKER_MIN_DEG)) chosen.push(p);
		}
		return chosen;
	});
	const stickerLogins = $derived(new Set(stickers.map((s) => s.login)));

	let canvas = $state<HTMLCanvasElement>();
	let globe: CobeGlobe | null = null;
	// Auto-rotation toggle (button-controlled; defaults to paused for
	// reduced-motion users, who can still press play).
	let paused = $state(false);
	// True while a dev sticker/dot is hovered -> the globe eases to a slow crawl
	// so the marker doesn't rotate away while you read or click it.
	let hovering = $state(false);

	function formatCount(n: number): string {
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
		return String(n);
	}

	// cobe colours are linear [r,g,b] in 0..1. Two palettes keyed to the theme;
	// re-applied live via globe.update() on toggle (no re-create, no flicker).
	function palette(dark: boolean): Partial<COBEOptions> {
		return dark
			? {
					dark: 1,
					diffuse: 1.2,
					mapBrightness: 11,
					baseColor: [0.82, 0.86, 0.95],
					markerColor: [0.6, 0.66, 0.74],
					glowColor: [0.16, 0.23, 0.38]
				}
			: {
					dark: 0,
					diffuse: 1.4,
					mapBrightness: 7,
					baseColor: [0.62, 0.65, 0.72],
					markerColor: [0.32, 0.36, 0.45],
					glowColor: [0.9, 0.92, 1]
				};
	}

	// Every marker gets an `id` (m{sortedIndex}) so cobe emits the `--cobe-{id}`
	// anchor + `--cobe-visible-{id}` vars: top devs bind avatar stickers, the
	// rest bind invisible hover/click hotspots. Stickers are larger + accent.
	function buildMarkers(dark: boolean): Marker[] {
		const dot: [number, number, number] = dark ? [0.55, 0.6, 0.68] : [0.34, 0.38, 0.46];
		const accent: [number, number, number] = dark ? [0.2, 0.57, 1] : [0.16, 0.43, 0.92];
		return sorted.map((p, i) =>
			stickerLogins.has(p.login)
				? { location: [p.lat, p.lng], size: 0.06, color: accent, id: `m${i}` }
				: { location: [p.lat, p.lng], size: 0.04, color: dot, id: `m${i}` }
		);
	}

	onMount(() => {
		if (!browser || !canvas) return;
		const el = canvas;
		let disposed = false;
		let cleanup: (() => void) | null = null;

		(async () => {
			const createGlobe = (await import('cobe')).default;
			if (disposed) return;

			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			let size = el.offsetWidth || 600;
			const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

			// rotation state
			let phi = 0;
			const theta = 0.22; // gentle tilt
			let dragOffset = 0; // eased drag delta added to phi
			let dragTarget = 0;
			let pointerStart: number | null = null; // clientX baseline while dragging
			let pointerMovement = 0;
			const FULL_SPEED = 0.0035;
			const SLOW_SPEED = 0.0005; // crawl while hovering a dev
			// Reduced-motion users start paused (the play button still works).
			if (reduce) paused = true;

			// NOTE: cobe multiplies width/height by `devicePixelRatio` internally,
			// so pass CSS pixels here (passing size*dpr double-applies dpr and
			// degenerates the dot map).
			const g = createGlobe(el, {
				devicePixelRatio: dpr,
				width: size,
				height: size,
				phi: 0,
				theta,
				mapSamples: 16000,
				...palette(themeState.current === 'dark'),
				markers: buildMarkers(themeState.current === 'dark')
			} as COBEOptions);
			globe = g;

			// cobe v2 has no internal animation loop / onRender hook -- we drive
			// the frames (rotation + drag easing) ourselves via globe.update().
			let raf = 0;
			let spinSpeed = FULL_SPEED;
			const frame = () => {
				// Ease toward a slow crawl while a dev is hovered, full speed otherwise.
				spinSpeed += ((hovering ? SLOW_SPEED : FULL_SPEED) - spinSpeed) * 0.08;
				if (!paused && pointerStart === null) phi += spinSpeed;
				dragOffset += (dragTarget - dragOffset) * 0.08;
				g.update({ phi: phi + dragOffset, theta, width: size, height: size });
				raf = requestAnimationFrame(frame);
			};
			raf = requestAnimationFrame(frame);

			// --- drag-to-spin -----------------------------------------------------
			const onDown = (e: PointerEvent) => {
				pointerStart = e.clientX - pointerMovement;
				el.style.cursor = 'grabbing';
				el.setPointerCapture?.(e.pointerId);
			};
			const onMove = (e: PointerEvent) => {
				if (pointerStart === null) return;
				const delta = e.clientX - pointerStart;
				pointerMovement = delta;
				dragTarget = delta / 200;
			};
			const onUp = () => {
				pointerStart = null;
				el.style.cursor = 'grab';
			};
			el.addEventListener('pointerdown', onDown);
			el.addEventListener('pointermove', onMove);
			window.addEventListener('pointerup', onUp);

			// --- responsive sizing ------------------------------------------------
			const ro = new ResizeObserver(() => {
				size = el.offsetWidth || size;
			});
			ro.observe(el);

			cleanup = () => {
				cancelAnimationFrame(raf);
				el.removeEventListener('pointerdown', onDown);
				el.removeEventListener('pointermove', onMove);
				window.removeEventListener('pointerup', onUp);
				ro.disconnect();
			};
		})();

		return () => {
			disposed = true;
			cleanup?.();
			globe?.destroy();
			globe = null;
		};
	});

	// Re-skin live on theme toggle (markers carry theme-dependent colours too).
	$effect(() => {
		const dark = themeState.current === 'dark';
		const g = globe;
		if (!g) return;
		g.update({ ...palette(dark), markers: buildMarkers(dark) });
	});
</script>

<div class="globe-wrap mx-auto aspect-square w-full max-w-[640px]">
	<!-- Decorative WebGL visual; the labelled developer list below is the
	     accessible equivalent, so the canvas is hidden from assistive tech. -->
	<canvas bind:this={canvas} class="globe-canvas" aria-hidden="true"></canvas>

	<!-- Per-dev overlays anchored to their marker via cobe's CSS anchor
	     positioning. Top devs get an avatar sticker; everyone else gets an
	     invisible hotspot that reveals the dev's name on hover. Both link to
	     the profile and scale to 0 on the back face (so you can't click through
	     the globe). Hidden entirely where anchor positioning is unsupported ->
	     the list below remains the way to reach every dev. -->
	{#each sorted as p, i (p.login)}
		{#if stickerLogins.has(p.login)}
			<a
				href={`/${p.login}`}
				class="sticker"
				style="position-anchor: --cobe-m{i}; opacity: var(--cobe-visible-m{i}, 0); scale: var(--cobe-visible-m{i}, 0); filter: blur(calc((1 - var(--cobe-visible-m{i}, 0)) * 4px));"
				title={`${p.name ?? p.login} · ${formatCount(p.followers)} followers · ${p.location}`}
				onpointerenter={() => (hovering = true)}
				onpointerleave={() => (hovering = false)}
			>
				<img src={p.avatarUrl} alt="" width="28" height="28" loading="lazy" />
				<span class="sticker-meta">
					<span class="sticker-name">{p.name ?? p.login}</span>
					<span class="sticker-sub">{formatCount(p.followers)}</span>
				</span>
			</a>
		{:else}
			<a
				href={`/${p.login}`}
				class="dot-hotspot"
				style="position-anchor: --cobe-m{i}; opacity: var(--cobe-visible-m{i}, 0); scale: var(--cobe-visible-m{i}, 0);"
				title={`${p.name ?? p.login} · ${formatCount(p.followers)} followers`}
				onpointerenter={() => (hovering = true)}
				onpointerleave={() => (hovering = false)}
			>
				<span class="dot-tip">
					<img src={p.avatarUrl} alt="" width="16" height="16" loading="lazy" />
					{p.name ?? p.login}
				</span>
			</a>
		{/if}
	{/each}

	<!-- Auto-rotation control -->
	<button
		type="button"
		class="globe-ctrl"
		aria-pressed={!paused}
		aria-label={paused ? 'Start auto-rotation' : 'Pause auto-rotation'}
		title={paused ? 'Play' : 'Pause'}
		onclick={() => (paused = !paused)}
	>
		{#if paused}
			<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
				><path d="M8 5v14l11-7z" /></svg
			>
		{:else}
			<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
				><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></svg
			>
		{/if}
	</button>
</div>

<!-- Accessible / no-WebGL fallback: every plotted dev as a real link. -->
<section class="mx-auto mt-8 max-w-3xl" aria-label="Plotted developers">
	<h2 class="mb-3 text-center text-xs font-medium tracking-wide text-text-tertiary uppercase">
		{points.length} developers plotted
	</h2>
	<ul class="flex flex-wrap justify-center gap-2">
		{#each sorted as p (p.login)}
			<li>
				<a
					href={`/${p.login}`}
					class="flex items-center gap-1.5 rounded-full border border-border-default bg-bg-secondary py-1 pr-3 pl-1 text-xs text-text-secondary transition-colors hover:border-border-highlight hover:text-text-primary"
				>
					<img src={p.avatarUrl} alt="" class="h-5 w-5 rounded-full" loading="lazy" />
					{p.login}
				</a>
			</li>
		{/each}
	</ul>
</section>

<style>
	.globe-wrap {
		position: relative;
	}

	.globe-canvas {
		width: 100%;
		height: 100%;
		cursor: grab;
		contain: layout paint size;
		touch-action: pan-y;
	}

	/* Rotation control button (independent of anchor-positioning support). */
	.globe-ctrl {
		position: absolute;
		right: 0.5rem;
		bottom: 0.5rem;
		z-index: 7;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 9999px;
		border: 1px solid var(--color-border-default);
		background: var(--color-bg-tertiary);
		color: var(--color-text-secondary);
		box-shadow: var(--shadow-md);
		cursor: pointer;
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.globe-ctrl:hover {
		color: var(--color-text-primary);
		border-color: var(--color-border-highlight);
	}

	.globe-ctrl svg {
		width: 1rem;
		height: 1rem;
	}

	/* Overlays use CSS anchor positioning; hidden by default so on unsupported
	   browsers they don't pile up mis-placed (cobe's dots + the list remain). */
	.sticker,
	.dot-hotspot {
		display: none;
	}

	@supports (anchor-name: --x) {
		.sticker {
			display: flex;
			position: absolute;
			bottom: anchor(top);
			left: anchor(center);
			translate: -50% -10px;
			align-items: center;
			gap: 0.5rem;
			padding: 0.25rem 0.625rem 0.25rem 0.25rem;
			border-radius: 9999px;
			border: 1px solid var(--color-border-default);
			background: var(--color-bg-tertiary);
			box-shadow: var(--shadow-md);
			white-space: nowrap;
			pointer-events: auto;
			transition:
				opacity 0.35s ease,
				scale 0.35s ease,
				filter 0.35s ease;
			z-index: 2;
		}

		.sticker:hover {
			border-color: var(--color-accent-blue);
		}

		.sticker img {
			width: 1.75rem;
			height: 1.75rem;
			border-radius: 9999px;
			flex-shrink: 0;
		}

		.sticker-meta {
			display: flex;
			flex-direction: column;
			line-height: 1.1;
		}

		.sticker-name {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--color-text-primary);
		}

		.sticker-sub {
			font-size: 0.625rem;
			color: var(--color-text-tertiary);
		}

		/* Invisible hover/click target centred on each non-sticker dot. Scales to
		   0 on the back face (via the cobe visibility var) so back dots can't be
		   clicked through the globe. */
		.dot-hotspot {
			display: block;
			position: absolute;
			top: anchor(center);
			left: anchor(center);
			translate: -50% -50%;
			width: 20px;
			height: 20px;
			border-radius: 9999px;
			cursor: pointer;
			pointer-events: auto;
			transition:
				opacity 0.3s ease,
				scale 0.3s ease;
			z-index: 1;
		}

		/* Subtle always-on halo so it's clear at a glance which grey dots are
		   clickable profiles (color-mix adapts to dark/light automatically). */
		.dot-hotspot::after {
			content: '';
			position: absolute;
			inset: 3px;
			border-radius: 9999px;
			background: color-mix(in srgb, var(--color-text-primary) 9%, transparent);
			border: 1px solid color-mix(in srgb, var(--color-text-primary) 22%, transparent);
			transition:
				background 0.15s ease,
				border-color 0.15s ease;
		}

		.dot-hotspot:hover {
			z-index: 6;
		}

		.dot-hotspot:hover::after {
			background: color-mix(in srgb, var(--color-accent-blue) 22%, transparent);
			border-color: var(--color-accent-blue);
		}

		.dot-tip {
			position: absolute;
			bottom: 135%;
			left: 50%;
			translate: -50% 0;
			display: flex;
			align-items: center;
			gap: 0.375rem;
			padding: 0.2rem 0.5rem 0.2rem 0.2rem;
			border-radius: 9999px;
			border: 1px solid var(--color-border-default);
			background: var(--color-bg-tertiary);
			box-shadow: var(--shadow-md);
			font-size: 0.6875rem;
			font-weight: 600;
			color: var(--color-text-primary);
			white-space: nowrap;
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.15s ease;
		}

		.dot-tip img {
			width: 1rem;
			height: 1rem;
			border-radius: 9999px;
		}

		.dot-hotspot:hover .dot-tip {
			opacity: 1;
		}
	}
</style>
