<script lang="ts">
	import { themeState } from '$lib/stores/theme.svelte';

	// Bayer-dithered flow field in raw WebGL — teal-lit dots melting into cool
	// gray, slow domain-warped fbm flow. No dependencies beyond the theme store.
	let canvas: HTMLCanvasElement | undefined = $state();

	// Shared with the theme effect below so it can repaint on light/dark toggle
	// without tearing down the GL context.
	let gl: WebGLRenderingContext | null = null;
	let uDark: WebGLUniformLocation | null = null;
	let redrawStatic: (() => void) | null = null;

	const VERT = `
attribute vec2 a_pos;
void main() {
	gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

	const FRAG = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform float u_px;
uniform float u_seed;
uniform float u_dark;

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.55;
	mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
	for (int i = 0; i < 3; i++) {
		v += a * noise(p);
		p = r * p * 1.9;
		a *= 0.45;
	}
	return v;
}

float bayer2(vec2 a) {
	a = floor(a);
	return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
	vec2 cell = floor(gl_FragCoord.xy / u_px);
	vec2 cp = (cell + 0.5) * u_px;
	vec2 uv = cp / u_res.y;
	float t = u_time * 0.045;

	// domain-warped fbm — the field flows and re-forms organically
	vec2 p = uv * 0.9 + vec2(u_seed * 17.0, u_seed * 9.0);
	vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t * 0.7));
	vec2 r = vec2(
		fbm(p + 1.6 * q + vec2(1.7, 9.2) + t * 0.4),
		fbm(p + 1.6 * q + vec2(8.3, 2.8) - t * 0.3)
	);
	float v = fbm(p + 1.4 * r) / 0.91; // normalize 3-octave fbm to ~[0,1]
	float field = clamp((v - 0.46) / 0.32, 0.0, 1.0);

	// ordered dither: black voids, dotted mid-range, rare smooth core
	float th = bayer8(cell);
	vec2 f = fract(gl_FragCoord.xy / u_px) - 0.5;
	float dotMask = 1.0 - smoothstep(0.18, 0.42, length(f));
	float lit = step(th, field * 1.25);
	float dots = lit * dotMask * (0.40 + 0.60 * field);
	float core = smoothstep(0.72, 1.0, field);
	float lum = max(dots * 1.0, core * 0.62);

	vec3 col;
	if (u_dark > 0.5) {
		// teal highlights melting into cool gray, on near-black
		vec3 colA = vec3(0.18, 0.21, 0.21);
		vec3 colB = vec3(0.16, 0.78, 0.69);
		col = vec3(0.012, 0.012, 0.015) + mix(colA, colB, lum) * lum * 0.92;
	} else {
		// same field as teal/gray specks darkening the white hero
		vec3 dotCol = mix(vec3(0.70, 0.74, 0.74), vec3(0.05, 0.60, 0.52), lum);
		col = mix(vec3(1.0), dotCol, lum * 0.64);
	}
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
		const uPx = context.getUniformLocation(prog, 'u_px');
		const uSeed = context.getUniformLocation(prog, 'u_seed');
		uDark = context.getUniformLocation(prog, 'u_dark');
		context.uniform1f(uSeed, Math.random());

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const resize = () => {
			const w = Math.round(el.clientWidth * dpr);
			const h = Math.round(el.clientHeight * dpr);
			if (w < 1 || h < 1) return;
			if (el.width !== w || el.height !== h) {
				el.width = w;
				el.height = h;
				context.viewport(0, 0, w, h);
			}
			context.uniform2f(uRes, el.width, el.height);
			context.uniform1f(uPx, Math.max(3, Math.round(5 * dpr)));
		};
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(el);

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const start = performance.now();
		let raf = 0;
		let tabVisible = document.visibilityState === 'visible';
		let onScreen = true;

		const frame = () => {
			context.uniform1f(uTime, (performance.now() - start) / 1000);
			context.drawArrays(context.TRIANGLES, 0, 3);
			raf = requestAnimationFrame(frame);
		};

		// Run the loop only while the hero is both on-screen and in a visible tab.
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

		const io = new IntersectionObserver((entries) => {
			onScreen = entries[0].isIntersecting;
			sync();
		});
		io.observe(el);

		if (reducedMotion) {
			// Hold a single representative frame; the theme effect paints it once
			// u_dark is set, and repaints it on toggle.
			redrawStatic = () => {
				context.uniform1f(uTime, 40);
				context.drawArrays(context.TRIANGLES, 0, 3);
			};
		} else {
			sync();
		}

		return () => {
			if (raf) cancelAnimationFrame(raf);
			ro.disconnect();
			io.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			context.getExtension('WEBGL_lose_context')?.loseContext();
			gl = null;
			uDark = null;
			redrawStatic = null;
		};
	});

	// Drive the light/dark uniform from the shared theme store — one reactive
	// line instead of a parallel DOM observer.
	$effect(() => {
		const dark = themeState.isDark;
		if (gl && uDark) {
			gl.uniform1f(uDark, dark ? 1 : 0);
			redrawStatic?.();
		}
	});
</script>

<canvas bind:this={canvas} class="h-full w-full" aria-hidden="true"></canvas>
