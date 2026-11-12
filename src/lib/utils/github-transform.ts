import type { GitHubProfile, ContributionDay, LanguageStats } from '$lib/types/github';

// Format large numbers (1000 -> 1k, 1000000 -> 1M)
export function formatNumber(num: number): string {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
	}
	return num.toString();
}

// GitHub avatar at a given pixel size, from a login or an existing avatar URL.
// Going straight to avatars.githubusercontent.com skips github.com's redirect.
export function githubAvatar(loginOrUrl: string, size: number): string {
	const url = new URL(
		loginOrUrl.startsWith('https://')
			? loginOrUrl
			: `https://avatars.githubusercontent.com/${loginOrUrl}`
	);
	url.searchParams.set('s', String(size));
	return url.toString();
}

// Format date to readable string
export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

// Format join date (e.g., "Joined March 2020")
export function formatJoinDate(dateString: string): string {
	const date = new Date(dateString);
	return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
}

// Get the most active contribution day
export function getMostActiveDay(profile: GitHubProfile): ContributionDay | null {
	if (!profile.contributions) return null;

	let maxDay: ContributionDay | null = null;
	for (const week of profile.contributions.contributionCalendar.weeks) {
		for (const day of week.contributionDays) {
			if (!maxDay || day.contributionCount > maxDay.contributionCount) {
				maxDay = day;
			}
		}
	}
	return maxDay;
}

// Get contribution streak (current consecutive days)
export function getContributionStreak(profile: GitHubProfile): number {
	if (!profile.contributions) return 0;

	const allDays: ContributionDay[] = [];
	for (const week of profile.contributions.contributionCalendar.weeks) {
		allDays.push(...week.contributionDays);
	}

	// Sort by date descending
	allDays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	let streak = 0;
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	for (const day of allDays) {
		const dayDate = new Date(day.date);
		dayDate.setHours(0, 0, 0, 0);

		// Skip future dates
		if (dayDate > today) continue;

		// Check if this is part of the streak
		const daysDiff = Math.floor((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));

		if (daysDiff === streak && day.contributionCount > 0) {
			streak++;
		} else if (daysDiff > streak) {
			break;
		}
	}

	return streak;
}

// Generate profile tags based on data
export function generateProfileTags(profile: GitHubProfile): string[] {
	const tags: string[] = [];

	// Based on stars
	if (profile.stats.totalStars > 1000) {
		tags.push('Popular Creator');
	} else if (profile.stats.totalStars > 100) {
		tags.push('Rising Star');
	}

	// Based on repos
	if (profile.stats.totalRepos > 50) {
		tags.push('Prolific');
	}

	// Based on followers
	if (profile.stats.followers > 1000) {
		tags.push('Influencer');
	} else if (profile.stats.followers > 100) {
		tags.push('Community Member');
	}

	// Based on languages
	const topLanguage = profile.languages[0];
	if (topLanguage) {
		const langCategory = getLanguageCategory(topLanguage.name);
		if (langCategory) tags.push(langCategory);
	}

	// Based on activity
	if (profile.contributions) {
		const totalContribs = profile.contributions.contributionCalendar.totalContributions;
		if (totalContribs > 1000) {
			tags.push('Highly Active');
		} else if (totalContribs > 365) {
			tags.push('Consistent');
		}
	}

	// Based on years
	if (profile.stats.yearsActive > 5) {
		tags.push('Veteran');
	}

	return tags.slice(0, 4); // Max 4 tags
}

// Get category for programming language
function getLanguageCategory(language: string): string | null {
	const categories: Record<string, string[]> = {
		'Full-Stack': ['TypeScript', 'JavaScript', 'Python', 'Ruby', 'PHP'],
		'Systems': ['Rust', 'Go', 'C', 'C++'],
		'Mobile': ['Swift', 'Kotlin', 'Dart'],
		'Data Science': ['Python', 'R', 'Julia'],
		'DevOps': ['Shell', 'Dockerfile', 'HCL']
	};

	for (const [category, languages] of Object.entries(categories)) {
		if (languages.includes(language)) {
			return category;
		}
	}
	return null;
}

// Get contribution level (0-4) for a count
export function getContributionLevel(count: number): number {
	if (count === 0) return 0;
	if (count <= 3) return 1;
	if (count <= 6) return 2;
	if (count <= 9) return 3;
	return 4;
}

// Get contribution color based on level
export function getContributionColor(level: number): string {
	const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
	return colors[Math.min(level, 4)];
}

// Calculate total contributions from calendar
export function getTotalContributions(profile: GitHubProfile): number {
	if (!profile.contributions) return 0;
	return profile.contributions.contributionCalendar.totalContributions;
}

// Get top languages with proper formatting
export function getTopLanguages(profile: GitHubProfile, limit: number = 5): LanguageStats[] {
	return profile.languages.slice(0, limit);
}

// Generate a bio summary if none exists
export function generateBioSummary(profile: GitHubProfile): string {
	const parts: string[] = [];

	// Add company if exists
	if (profile.user.company) {
		parts.push(`Works at ${profile.user.company.replace('@', '')}`);
	}

	// Add location if exists
	if (profile.user.location) {
		parts.push(`Based in ${profile.user.location}`);
	}

	// Add top language
	if (profile.languages.length > 0) {
		parts.push(`${profile.languages[0].name} enthusiast`);
	}

	// Add activity summary
	const totalContribs = getTotalContributions(profile);
	if (totalContribs > 0) {
		parts.push(`${formatNumber(totalContribs)} contributions this year`);
	}

	return parts.join(' • ') || 'GitHub developer';
}

// Get recent activity summary
export function getActivitySummary(profile: GitHubProfile): string {
	if (!profile.contributions) {
		return `${profile.stats.totalRepos} public repositories`;
	}

	const totalContribs = profile.contributions.contributionCalendar.totalContributions;
	const commits = profile.contributions.totalCommitContributions;
	const prs = profile.contributions.totalPullRequestContributions;

	const parts: string[] = [];
	if (commits > 0) parts.push(`${formatNumber(commits)} commits`);
	if (prs > 0) parts.push(`${formatNumber(prs)} PRs`);

	return `${formatNumber(totalContribs)} contributions (${parts.join(', ')})`;
}

// Check if profile has enough data for full display
export function hasFullProfileData(profile: GitHubProfile): boolean {
	return (
		profile.contributions !== null &&
		profile.pinnedRepositories.length > 0 &&
		profile.languages.length > 0
	);
}

// Generate shareable URL
export function generateShareUrl(
	username: string,
	options?: { template?: string; theme?: string }
): string {
	const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
	const params = new URLSearchParams();

	if (options?.template) params.set('template', options.template);
	if (options?.theme) params.set('theme', options.theme);

	const queryString = params.toString();
	return `${baseUrl}/${username}${queryString ? `?${queryString}` : ''}`;
}
