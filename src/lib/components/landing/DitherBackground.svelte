<script lang="ts">
	// Fullscreen Bayer-dithered flow field in raw WebGL — no dependencies.
	// Teal-lit dots fade to cool gray over the void; slow domain-warped fbm flow.
	let canvas: HTMLCanvasElement | undefined = $state();

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
	float lum = max(dots * 0.85, core * 0.5);

	vec3 col;
	if (u_dark > 0.5) {
		// teal highlights melting into cool gray, on near-black — kept subtle
		vec3 colA = vec3(0.16, 0.19, 0.19);
		vec3 colB = vec3(0.15, 0.66, 0.58);
		col = vec3(0.012, 0.012, 0.015) + mix(colA, colB, lum) * lum * 0.58;
	} else {
		// same field as subtle teal/gray specks darkening the white hero
		vec3 dotCol = mix(vec3(0.80, 0.82, 0.82), vec3(0.06, 0.62, 0.54), lum);
		col = mix(vec3(1.0), dotCol, lum * 0.45);
	}
	gl_FragColor = vec4(col, 1.0);
}`;

	$effect(() => {
		if (!canvas) return;
		const gl = canvas.getContext('webgl', {
			antialias: false,
			depth: false,
			stencil: false,
			alpha: false,
			powerPreference: 'low-power'
		});
		if (!gl) return;

		const compile = (type: number, src: string) => {
			const s = gl.createShader(type)!;
			gl.shaderSource(s, src);
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
				console.error('shader compile failed:', gl.getShaderInfoLog(s));
			}
			return s;
		};

		const prog = gl.createProgram()!;
		gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
		gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
		gl.linkProgram(prog);
		gl.useProgram(prog);

		// fullscreen triangle
		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		const aPos = gl.getAttribLocation(prog, 'a_pos');
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

		const uRes = gl.getUniformLocation(prog, 'u_res');
		const uTime = gl.getUniformLocation(prog, 'u_time');
		const uPx = gl.getUniformLocation(prog, 'u_px');
		const uSeed = gl.getUniformLocation(prog, 'u_seed');
		const uDark = gl.getUniformLocation(prog, 'u_dark');
		gl.uniform1f(uSeed, Math.random());

		// Follow the app's light/dark class so the field matches the page background
		const readDark = () => !document.documentElement.classList.contains('light');
		gl.uniform1f(uDark, readDark() ? 1 : 0);

		const el = canvas;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);

		const resize = () => {
			const w = Math.round(el.clientWidth * dpr);
			const h = Math.round(el.clientHeight * dpr);
			if (w < 1 || h < 1) return;
			if (el.width !== w || el.height !== h) {
				el.width = w;
				el.height = h;
				gl.viewport(0, 0, w, h);
			}
			gl.uniform2f(uRes, el.width, el.height);
			gl.uniform1f(uPx, Math.max(3, Math.round(5 * dpr)));
		};
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(el);

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const start = performance.now();
		let raf = 0;
		let running = true;

		const frame = () => {
			gl.uniform1f(uTime, (performance.now() - start) / 1000);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			if (running && !reducedMotion) raf = requestAnimationFrame(frame);
		};

		const onVisibility = () => {
			running = document.visibilityState === 'visible';
			if (running && !reducedMotion) {
				cancelAnimationFrame(raf);
				raf = requestAnimationFrame(frame);
			}
		};
		document.addEventListener('visibilitychange', onVisibility);

		if (reducedMotion) {
			// static frame, but at an interesting point in the flow
			gl.uniform1f(uTime, 40);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		} else {
			raf = requestAnimationFrame(frame);
		}

		// Repaint the field when the theme toggles (live, no re-init)
		const themeObs = new MutationObserver(() => {
			gl.uniform1f(uDark, readDark() ? 1 : 0);
			if (reducedMotion) gl.drawArrays(gl.TRIANGLES, 0, 3);
		});
		themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		return () => {
			running = false;
			cancelAnimationFrame(raf);
			ro.disconnect();
			themeObs.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			gl.getExtension('WEBGL_lose_context')?.loseContext();
		};
	});
</script>

<canvas bind:this={canvas} class="h-full w-full" aria-hidden="true"></canvas>
