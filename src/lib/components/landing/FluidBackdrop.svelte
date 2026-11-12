<script lang="ts">
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { themeState } from '$lib/stores/theme.svelte';

	interface Props {
		// Tailwind height utility for the backdrop region; it fades out toward the bottom.
		class?: string;
	}

	let { class: className = 'h-[1100px]' }: Props = $props();

	// Slow fluid colour field in raw WebGL: domain-warped gradient noise mapped
	// through a three-stop ramp (page background, deep teal, cool mist) with a soft
	// light on the right. Rendered into a small buffer and stretched by CSS; the
	// field is smooth enough that this needs no blur filter, and the fade into the
	// page is done in the shader, so the canvas is a plain opaque layer.
	let canvas: HTMLCanvasElement | undefined = $state();
	let ready = $state(false);

	// Shared with the theme effect below so it can repaint on light/dark toggle
	// without tearing down the GL context.
	let gl: WebGLRenderingContext | null = null;
	let uDark: WebGLUniformLocation | null = null;
	let uBg: WebGLUniformLocation | null = null;
	let redraw: (() => void) | null = null;

	// The field has no fine detail, so a small buffer is enough
	const MAX_PIXELS = 100_000;
	const FRAME_MS = 1000 / 30;
	// Fixed starting composition; a random one can open on a flat or empty frame
	const SEED = 0.2;

	// The page background as 0..1 RGB, read from the theme token so the bottom
	// fade always lands exactly on the page colour
	function pageBackground(): [number, number, number] {
		const hex = getComputedStyle(document.documentElement)
			.getPropertyValue('--color-bg-primary')
			.trim()
			.slice(1);
		const n = parseInt(hex.length === 3 ? hex.replace(/./g, '$&$&') : hex, 16);
		return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
	}

	function applyTheme(dark: boolean) {
		if (!gl || !uDark || !uBg) return;
		gl.uniform1f(uDark, dark ? 1 : 0);
		gl.uniform3fv(uBg, pageBackground());
		redraw?.();
	}

	const VERT = `
attribute vec2 a_pos;
void main() {
	gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

	const FRAG = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform float u_seed;
uniform float u_dark;
uniform vec3 u_bg;

vec3 grad(vec3 p) {
	p = vec3(
		dot(p, vec3(127.1, 311.7, 74.7)),
		dot(p, vec3(269.5, 183.3, 246.1)),
		dot(p, vec3(113.5, 271.9, 124.6))
	);
	return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// 3D gradient noise, roughly [-1, 1]; z is time so the field morphs in place
float noise(vec3 p) {
	vec3 i = floor(p);
	vec3 f = fract(p);
	vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
	float n = mix(
		mix(
			mix(dot(grad(i), f), dot(grad(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
			mix(
				dot(grad(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
				dot(grad(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)),
				u.x
			),
			u.y
		),
		mix(
			mix(
				dot(grad(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
				dot(grad(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)),
				u.x
			),
			mix(
				dot(grad(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
				dot(grad(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)),
				u.x
			),
			u.y
		),
		u.z
	);
	return n * 1.5;
}

// Two rounds of warping before sampling: the shapes fold into each other like ink
float fluid(vec2 p, float t) {
	vec2 w1 = vec2(noise(vec3(p * 0.6, t)), noise(vec3(p * 0.6 + 5.2, t + 1.3))) * 0.6;
	vec2 q = p + w1;
	vec2 w2 =
		vec2(noise(vec3(q * 0.7 + 1.7, t * 0.8 + 3.1)), noise(vec3(q * 0.7 + 9.2, t * 0.8 + 5.7))) *
		0.5;
	return noise(vec3((q + w2) * 0.5, t * 0.6));
}

void main() {
	vec2 uv = gl_FragCoord.xy / u_res;
	float aspect = u_res.x / u_res.y;
	// anchored to the right edge, so narrow screens keep the lit side of the field
	vec2 p = vec2((uv.x - 1.0) * aspect + 1.28, uv.y) * 1.9 + vec2(u_seed * 31.0, u_seed * 17.0);
	float t = u_time * 0.045;

	float f = fluid(p, t);
	float swirl = noise(vec3(p * 0.8 + f * 1.5, t * 1.2 + 7.0)) * 0.5 + 0.5;
	float n = f * 0.7 + 0.5;

	// distance to the light, sitting off to the right at mid height
	float ld = length((uv - vec2(0.89, 0.5)) * vec2(aspect, 1.0));
	float core = exp(-ld * ld * 4.5);
	float halo = exp(-ld * 1.8);
	float vig = 1.0 - smoothstep(0.35, 0.75, length(uv - 0.5));

	vec3 col;
	if (u_dark > 0.5) {
		vec3 base = u_bg;
		vec3 deep = vec3(0.04, 0.27, 0.24);
		vec3 mist = vec3(0.70, 0.78, 0.76);
		col = mix(base, deep, smoothstep(0.45, 0.8, n + swirl * 0.25));
		col = mix(col, mist, smoothstep(0.6, 0.85, swirl) * 0.26);
		col = mix(col, base, smoothstep(0.5, 0.8, n * swirl) * 0.35);
		col += vec3(0.92, 1.0, 0.97) * core * 0.07 + vec3(0.55, 0.9, 0.84) * halo * 0.1;
		col = mix(col * 0.62, col, vig);
	} else {
		vec3 base = u_bg;
		vec3 wash = vec3(0.68, 0.92, 0.87);
		vec3 tint = vec3(0.56, 0.72, 0.70);
		col = mix(base, wash, smoothstep(0.45, 0.8, n + swirl * 0.25));
		col = mix(col, tint, smoothstep(0.6, 0.85, swirl) * 0.45);
		col = mix(col, base, smoothstep(0.5, 0.8, n * swirl) * 0.35);
		col = mix(col, wash, halo * 0.3);
		col = mix(mix(col, base, 0.3), col, vig);
	}
	// fade into the page background toward the bottom edge
	float d = 1.0 - uv.y;
	float a = d < 0.09 ? mix(0.99, 0.91, d / 0.09) : 0.91 * (1.0 - (d - 0.09) / 0.91);
	// a hair of noise keeps the stretched gradients from banding
	float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
	col += grain * (1.5 / 255.0);
	col = mix(u_bg, col, a);
	gl_FragColor = vec4(col, 1.0);
}`;

	$effect(() => {
		const el = canvas;
		if (!el) return;
		const context = el.getContext('webgl', {
			antialias: false,
			depth: false,
			stencil: false,
			alpha: false,
			powerPreference: 'low-power'
		});
		if (!context) return;
		gl = context;

		const compile = (type: number, src: string) => {
			const s = context.createShader(type)!;
			context.shaderSource(s, src);
			context.compileShader(s);
			if (!context.getShaderParameter(s, context.COMPILE_STATUS)) {
				console.error('shader compile failed:', context.getShaderInfoLog(s));
			}
			return s;
		};

		const prog = context.createProgram()!;
		context.attachShader(prog, compile(context.VERTEX_SHADER, VERT));
		context.attachShader(prog, compile(context.FRAGMENT_SHADER, FRAG));
		context.linkProgram(prog);
		context.useProgram(prog);

		// fullscreen triangle
		const buf = context.createBuffer();
		context.bindBuffer(context.ARRAY_BUFFER, buf);
		context.bufferData(
			context.ARRAY_BUFFER,
			new Float32Array([-1, -1, 3, -1, -1, 3]),
			context.STATIC_DRAW
		);
		const aPos = context.getAttribLocation(prog, 'a_pos');
		context.enableVertexAttribArray(aPos);
		context.vertexAttribPointer(aPos, 2, context.FLOAT, false, 0, 0);

		const uRes = context.getUniformLocation(prog, 'u_res');
		const uTime = context.getUniformLocation(prog, 'u_time');
		uDark = context.getUniformLocation(prog, 'u_dark');
		uBg = context.getUniformLocation(prog, 'u_bg');
		context.uniform1f(context.getUniformLocation(prog, 'u_seed'), SEED);
		// gl is not reactive, so the theme effect below can't see it arrive: set the
		// starting theme here, untracked so a toggle doesn't rebuild the context
		applyTheme(untrack(() => themeState.isDark));

		const reducedMotion = prefersReducedMotion.current;
		const start = performance.now();
		// Reduced motion holds one representative frame instead of animating
		const now = () => (reducedMotion ? 40 : (performance.now() - start) / 1000);

		// Nothing is drawn until the first resize has sized the buffer
		let sized = false;
		const draw = () => {
			if (!sized || context.isContextLost()) return;
			context.uniform1f(uTime, now());
			context.drawArrays(context.TRIANGLES, 0, 3);
			ready = true;
		};
		redraw = draw;

		const resize = () => {
			const cw = el.clientWidth;
			const ch = el.clientHeight;
			if (cw < 1 || ch < 1) return;
			const scale = Math.min(1, Math.sqrt(MAX_PIXELS / (cw * ch)));
			const w = Math.max(1, Math.round(cw * scale));
			const h = Math.max(1, Math.round(ch * scale));
			if (el.width !== w || el.height !== h) {
				el.width = w;
				el.height = h;
				context.viewport(0, 0, w, h);
			}
			context.uniform2f(uRes, w, h);
			sized = true;
			draw();
		};
		// The observer's first callback does the initial size and draw
		const ro = new ResizeObserver(resize);
		ro.observe(el);

		let raf = 0;
		let last = 0;
		let tabVisible = document.visibilityState === 'visible';
		let onScreen = true;

		const frame = (time: number) => {
			raf = requestAnimationFrame(frame);
			if (time - last < FRAME_MS) return;
			last = time;
			draw();
		};

		// Run the loop only while the backdrop is both on-screen and in a visible tab.
		const sync = () => {
			const run = tabVisible && onScreen && !reducedMotion;
			if (run && !raf) raf = requestAnimationFrame(frame);
			else if (!run && raf) {
				cancelAnimationFrame(raf);
				raf = 0;
			}
		};

		const onVisibility = () => {
			tabVisible = document.visibilityState === 'visible';
			sync();
		};
		document.addEventListener('visibilitychange', onVisibility);

		// If the GPU drops the context, fade the canvas out so the still gradient shows
		const onLost = () => (ready = false);
		el.addEventListener('webglcontextlost', onLost);

		const io = new IntersectionObserver((entries) => {
			onScreen = entries[0].isIntersecting;
			sync();
		});
		io.observe(el);

		sync();

		return () => {
			if (raf) cancelAnimationFrame(raf);
			ro.disconnect();
			io.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			el.removeEventListener('webglcontextlost', onLost);
			context.getExtension('WEBGL_lose_context')?.loseContext();
			gl = null;
			uDark = null;
			uBg = null;
			redraw = null;
		};
	});

	// Follow theme toggles; repaint by hand in case the loop is paused
	$effect(() => applyTheme(themeState.isDark));
</script>

<!-- The gradient is what shows until the canvas paints, or if WebGL is unavailable -->
<div
	class="fluid-fallback pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden {className}"
>
	<canvas
		bind:this={canvas}
		class={[
			'h-full w-full transition-opacity duration-1000 ease-out',
			ready ? 'opacity-100' : 'opacity-0'
		]}
		aria-hidden="true"
	></canvas>
</div>
