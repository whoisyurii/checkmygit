// Site
export const SITE_URL = 'https://checkmygit.com';

// SEO
export const META_DESCRIPTION_MAX_LENGTH = 160;

// Repository
export const REPO_URL = 'https://github.com/whoisyurii/checkmygit';
export const GITHUB_API_URL = 'https://api.github.com/repos/whoisyurii/checkmygit';

// Author
export const AUTHOR_GITHUB_URL = 'https://github.com/whoisyurii';
export const AUTHOR_LINKEDIN_URL = 'https://www.linkedin.com/in/yurii-mashchuk/';

// Profiles showcased on the landing page: hero suggestions and featured cards
export const FEATURED_PROFILES = [
	{ username: 'torvalds', name: 'Linus Torvalds', role: 'Creator of Linux & Git' },
	{ username: 'rich-harris', name: 'Rich Harris', role: 'Creator of Svelte' },
	{ username: 'whoisyurii', name: 'Yurii', role: 'Full Stack Developer' }
] as const;
