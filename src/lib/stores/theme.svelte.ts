// Theme state management using Svelte 5 runes
// Initial theme is resolved by the inline pre-hydration script in app.html
// (sets `.light` class on <html>, `data-theme` attr, and window.__INITIAL_THEME__).
// This store reads that pre-resolved value to stay in sync, and handles
// toggle/system-change updates after hydration.

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
const META_DARK = '#030303';
const META_LIGHT = '#FFFFFF';

declare global {
	interface Window {
		__INITIAL_THEME__?: Theme;
	}
}

class ThemeState {
	current = $state<Theme>('dark');
	#initialized = false;

	init() {
		if (this.#initialized || typeof window === 'undefined') return;
		this.#initialized = true;

		// Trust the pre-hydration script's resolved value if present
		const preResolved = window.__INITIAL_THEME__;
		if (preResolved === 'dark' || preResolved === 'light') {
			this.current = preResolved;
		} else {
			const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
			if (stored === 'dark' || stored === 'light') {
				this.current = stored;
			} else {
				this.current = window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light';
			}
			this.#applyTheme();
		}

		// Live-follow system pref only when user has not manually chosen
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			if (!localStorage.getItem(STORAGE_KEY)) {
				this.current = e.matches ? 'dark' : 'light';
				this.#applyTheme();
			}
		});
	}

	toggle() {
		this.current = this.current === 'dark' ? 'light' : 'dark';
		localStorage.setItem(STORAGE_KEY, this.current);
		this.#applyTheme();
	}

	setTheme(theme: Theme) {
		this.current = theme;
		localStorage.setItem(STORAGE_KEY, theme);
		this.#applyTheme();
	}

	#applyTheme() {
		if (typeof document === 'undefined') return;

		const root = document.documentElement;
		if (this.current === 'light') {
			root.classList.add('light');
		} else {
			root.classList.remove('light');
		}
		root.setAttribute('data-theme', this.current);

		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute('content', this.current === 'dark' ? META_DARK : META_LIGHT);
	}

	get isDark() {
		return this.current === 'dark';
	}

	get isLight() {
		return this.current === 'light';
	}
}

export const themeState = new ThemeState();
