import type { TemplateType, ThemeType, PortfolioOptions, ExportFormat } from '$lib/types/portfolio';
import type { GitHubProfile } from '$lib/types/github';
import { SvelteURLSearchParams } from 'svelte/reactivity';

// Generator state class using Svelte 5 runes
class GeneratorState {
	// Current template
	template = $state<TemplateType>('github');

	// Theme (dark/light)
	theme = $state<ThemeType>('dark');

	// Display options
	showContributions = $state(true);
	showLanguages = $state(true);
	showProjects = $state(true);
	showStats = $state(true);

	// Accent color
	accentColor = $state('#58a6ff');

	// Export state
	isExporting = $state(false);
	isExportMode = $state(false);
	exportFormat = $state<ExportFormat>('png');

	// Share state
	shareUrl = $state('');
	isSharing = $state(false);

	// Derived: full options object
	options = $derived<PortfolioOptions>({
		template: this.template,
		theme: this.theme,
		showContributions: this.showContributions,
		showLanguages: this.showLanguages,
		showProjects: this.showProjects,
		showStats: this.showStats,
		accentColor: this.accentColor
	});

	// Methods
	setTemplate(template: TemplateType) {
		this.template = template;
	}

	setTheme(theme: ThemeType) {
		this.theme = theme;
	}

	toggleContributions() {
		this.showContributions = !this.showContributions;
	}

	toggleLanguages() {
		this.showLanguages = !this.showLanguages;
	}

	toggleProjects() {
		this.showProjects = !this.showProjects;
	}

	toggleStats() {
		this.showStats = !this.showStats;
	}

	setAccentColor(color: string) {
		this.accentColor = color;
	}

	setExportFormat(format: ExportFormat) {
		this.exportFormat = format;
	}

	enterExportMode() {
		this.isExportMode = true;
		this.isExporting = true;
	}

	exitExportMode() {
		this.isExportMode = false;
		this.isExporting = false;
	}

	reset() {
		this.template = 'github';
		this.theme = 'dark';
		this.showContributions = true;
		this.showLanguages = true;
		this.showProjects = true;
		this.showStats = true;
		this.accentColor = '#58a6ff';
	}

	// Load options from URL params
	loadFromParams(params: URLSearchParams) {
		const template = params.get('template');
		const theme = params.get('theme');

		if (template && ['github', 'bento', 'minimal'].includes(template)) {
			this.template = template as TemplateType;
		}
		if (theme && ['dark', 'light'].includes(theme)) {
			this.theme = theme as ThemeType;
		}
	}

	// Generate URL params from current options
	toParams(): URLSearchParams {
		const params = new SvelteURLSearchParams();
		if (this.template !== 'github') params.set('template', this.template);
		if (this.theme !== 'dark') params.set('theme', this.theme);
		return params;
	}
}

// Export a singleton instance
export const generatorState = new GeneratorState();

// Toast notifications state
class ToastState {
	toasts = $state<
		Array<{
			id: string;
			type: 'success' | 'error' | 'info' | 'warning';
			message: string;
		}>
	>([]);

	add(type: 'success' | 'error' | 'info' | 'warning', message: string, duration = 3000) {
		const id = crypto.randomUUID();
		this.toasts = [...this.toasts, { id, type, message }];

		if (duration > 0) {
			setTimeout(() => this.remove(id), duration);
		}

		return id;
	}

	remove(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	success(message: string, duration?: number) {
		return this.add('success', message, duration);
	}

	error(message: string, duration?: number) {
		return this.add('error', message, duration);
	}

	info(message: string, duration?: number) {
		return this.add('info', message, duration);
	}

	warning(message: string, duration?: number) {
		return this.add('warning', message, duration);
	}

	clear() {
		this.toasts = [];
	}
}

export const toastState = new ToastState();

// Profile cache for performance
class ProfileCache {
	private cache = new Map<string, { profile: GitHubProfile; timestamp: number }>();
	private readonly TTL = 5 * 60 * 1000; // 5 minutes

	get(username: string): GitHubProfile | null {
		const entry = this.cache.get(username.toLowerCase());
		if (!entry) return null;

		// Check if expired
		if (Date.now() - entry.timestamp > this.TTL) {
			this.cache.delete(username.toLowerCase());
			return null;
		}

		return entry.profile;
	}

	set(username: string, profile: GitHubProfile) {
		this.cache.set(username.toLowerCase(), {
			profile,
			timestamp: Date.now()
		});
	}

	clear() {
		this.cache.clear();
	}
}

export const profileCache = new ProfileCache();
