// Portfolio App Types

export type TemplateType = 'github' | 'bento' | 'minimal';

export type ThemeType = 'dark' | 'light';

export interface PortfolioOptions {
	template: TemplateType;
	theme: ThemeType;
	showContributions: boolean;
	showLanguages: boolean;
	showProjects: boolean;
	showStats: boolean;
	accentColor: string;
}

export const DEFAULT_OPTIONS: PortfolioOptions = {
	template: 'github',
	theme: 'dark',
	showContributions: true,
	showLanguages: true,
	showProjects: true,
	showStats: true,
	accentColor: '#58a6ff'
};

// Export formats
export type ExportFormat = 'png' | 'pdf' | 'svg';

// Share options
export interface ShareOptions {
	includeTemplate: boolean;
	includeTheme: boolean;
	shortUrl: boolean;
}

// Toast/notification types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

// Navigation/route types
export interface BreadcrumbItem {
	label: string;
	href?: string;
}

// Form validation
export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

export function validateGitHubUsername(username: string): ValidationResult {
	const errors: string[] = [];

	if (!username) {
		errors.push('Username is required');
	} else {
		if (username.length > 39) {
			errors.push('Username must be 39 characters or less');
		}
		if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) {
			errors.push('Username can only contain alphanumeric characters and hyphens');
		}
		if (username.includes('--')) {
			errors.push('Username cannot contain consecutive hyphens');
		}
	}

	return { valid: errors.length === 0, errors };
}

// Language colors (fallback if not provided by GitHub)
export const LANGUAGE_COLORS: Record<string, string> = {
	TypeScript: '#3178c6',
	JavaScript: '#f1e05a',
	Python: '#3572A5',
	Go: '#00ADD8',
	Rust: '#dea584',
	Java: '#b07219',
	'C++': '#f34b7d',
	C: '#555555',
	'C#': '#178600',
	Ruby: '#701516',
	PHP: '#4F5D95',
	Swift: '#F05138',
	Kotlin: '#A97BFF',
	Dart: '#00B4AB',
	Vue: '#41b883',
	Svelte: '#ff3e00',
	HTML: '#e34c26',
	CSS: '#563d7c',
	SCSS: '#c6538c',
	Shell: '#89e051',
	Dockerfile: '#384d54'
};
