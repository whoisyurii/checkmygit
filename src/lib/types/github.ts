// GitHub API Response Types

export interface GitHubUser {
	login: string;
	name: string | null;
	bio: string | null;
	avatarUrl: string;
	location: string | null;
	company: string | null;
	websiteUrl: string | null;
	twitterUsername: string | null;
	email: string | null;
	followers: number;
	following: number;
	createdAt: string;
	updatedAt: string;
}

export interface GitHubRepository {
	name: string;
	description: string | null;
	url: string;
	homepageUrl: string | null;
	stargazerCount: number;
	forkCount: number;
	primaryLanguage: {
		name: string;
		color: string;
	} | null;
	isPrivate: boolean;
	isFork: boolean;
	isArchived: boolean;
	topics: string[];
	pushedAt: string | null;
	createdAt: string;
	languages?: RepositoryLanguages;
}

export interface RepositoryLanguageEdge {
	size: number;
	node: {
		name: string;
		color: string;
	};
}

export interface RepositoryLanguages {
	edges: RepositoryLanguageEdge[];
}

export interface ContributionDay {
	date: string;
	contributionCount: number;
	color: string;
}

export interface ContributionWeek {
	contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
	totalContributions: number;
	weeks: ContributionWeek[];
}

export interface RepositoryContribution {
	repository: {
		nameWithOwner: string;
		owner: { login: string };
		primaryLanguage: { name: string; color: string } | null;
		stargazerCount?: number;
	};
	contributions: {
		totalCount: number;
	};
}

export interface ExternalContribution {
	repoName: string;
	owner: string;
	prCount: number;
	commitCount: number;
	language: { name: string; color: string } | null;
	stargazerCount: number;
}

export interface ContributionsCollection {
	totalCommitContributions: number;
	totalIssueContributions: number;
	totalPullRequestContributions: number;
	totalPullRequestReviewContributions: number;
	contributionCalendar: ContributionCalendar;
	externalContributions?: ExternalContribution[];
	externalPRCount?: number;
	externalCommitCount?: number;
}

export interface LanguageStats {
	name: string;
	color: string;
	percentage: number;
	size: number;
}

// Normalized GitHub Profile (used by app)
export interface GitHubProfile {
	user: GitHubUser;
	repositories: GitHubRepository[];
	pinnedRepositories: GitHubRepository[];
	contributions: ContributionsCollection | null;
	languages: LanguageStats[];
	stats: {
		totalRepos: number;
		totalStars: number;
		originalStars: number; // Stars from non-fork repos only
		totalForks: number;
		followers: number;
		following: number;
		yearsActive: number;
	};
}

// GraphQL API Response Types
export interface GraphQLUserResponse {
	user: {
		login: string;
		name: string | null;
		bio: string | null;
		avatarUrl: string;
		location: string | null;
		company: string | null;
		websiteUrl: string | null;
		twitterUsername: string | null;
		email: string | null;
		followers: { totalCount: number };
		following: { totalCount: number };
		createdAt: string;
		updatedAt: string;
		repositories: {
			totalCount: number;
			nodes: Array<{
				name: string;
				description: string | null;
				url: string;
				homepageUrl: string | null;
				stargazerCount: number;
				forkCount: number;
				primaryLanguage: { name: string; color: string } | null;
				languages: {
					edges: Array<{
						size: number;
						node: { name: string; color: string };
					}>;
				};
				isPrivate: boolean;
				isFork: boolean;
				isArchived: boolean;
				repositoryTopics: {
					nodes: Array<{ topic: { name: string } }>;
				};
				pushedAt: string | null;
				createdAt: string;
			}>;
		};
		pinnedItems: {
			nodes: Array<{
				name: string;
				description: string | null;
				url: string;
				homepageUrl: string | null;
				stargazerCount: number;
				forkCount: number;
				primaryLanguage: { name: string; color: string } | null;
				languages: {
					edges: Array<{
						size: number;
						node: { name: string; color: string };
					}>;
				};
				isPrivate: boolean;
				isFork: boolean;
				isArchived: boolean;
				repositoryTopics: {
					nodes: Array<{ topic: { name: string } }>;
				};
				pushedAt: string | null;
				createdAt: string;
			}>;
		};
		contributionsCollection: {
			totalCommitContributions: number;
			totalIssueContributions: number;
			totalPullRequestContributions: number;
			totalPullRequestReviewContributions: number;
			contributionCalendar: {
				totalContributions: number;
				weeks: Array<{
					contributionDays: Array<{
						date: string;
						contributionCount: number;
						color: string;
					}>;
				}>;
			};
			pullRequestContributionsByRepository: Array<{
				repository: {
					nameWithOwner: string;
					owner: { login: string };
					primaryLanguage: { name: string; color: string } | null;
					stargazerCount: number;
				};
				contributions: {
					totalCount: number;
				};
			}>;
			commitContributionsByRepository: Array<{
				repository: {
					nameWithOwner: string;
					owner: { login: string };
					primaryLanguage: { name: string; color: string } | null;
				};
				contributions: {
					totalCount: number;
				};
			}>;
		};
	} | null;
}

// REST API Response Types
export interface RESTUserResponse {
	login: string;
	name: string | null;
	bio: string | null;
	avatar_url: string;
	location: string | null;
	company: string | null;
	blog: string | null;
	twitter_username: string | null;
	email: string | null;
	followers: number;
	following: number;
	created_at: string;
	updated_at: string;
	public_repos: number;
}

export interface RESTRepoResponse {
	name: string;
	description: string | null;
	html_url: string;
	homepage: string | null;
	stargazers_count: number;
	forks_count: number;
	language: string | null;
	private: boolean;
	fork: boolean;
	archived: boolean;
	topics: string[];
	pushed_at: string | null;
	created_at: string;
}

// API Error Types
export interface GitHubError {
	type: 'NOT_FOUND' | 'RATE_LIMIT' | 'UNAUTHORIZED' | 'UNKNOWN';
	message: string;
	status?: number;
}

export type GitHubResult<T> = { success: true; data: T } | { success: false; error: GitHubError };
