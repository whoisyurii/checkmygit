// Rankings page types

export interface RankedRepository {
	rank: number;
	nameWithOwner: string;
	description: string | null;
	url: string;
	stargazerCount: number;
	forkCount: number;
	primaryLanguage: { name: string; color: string } | null;
	owner: { login: string; avatarUrl: string };
}

export interface RankedUser {
	rank: number;
	login: string;
	name: string | null;
	avatarUrl: string;
	bio: string | null;
	followers: number;
	totalRepos: number;
	totalStars: number;
}

// GraphQL response types for search queries
export interface GraphQLSearchRepoNode {
	nameWithOwner: string;
	description: string | null;
	url: string;
	stargazerCount: number;
	forkCount: number;
	primaryLanguage: { name: string; color: string } | null;
	owner: { login: string; avatarUrl: string };
}

export interface GraphQLSearchUserNode {
	login: string;
	name: string | null;
	avatarUrl: string;
	bio: string | null;
	followers: { totalCount: number };
	repositories: {
		totalCount: number;
		nodes: Array<{ stargazerCount: number }>;
	};
}

export interface GraphQLSearchResponse<T> {
	search: {
		repositoryCount?: number;
		userCount?: number;
		nodes: T[];
	};
}

// Supported languages for filtering
export const RANKING_LANGUAGES = [
	'TypeScript',
	'JavaScript',
	'Python',
	'Go',
	'Rust',
	'Java',
	'C++',
	'C',
	'Ruby',
	'PHP',
	'Swift',
	'Kotlin'
] as const;

export type RankingLanguage = (typeof RANKING_LANGUAGES)[number];

// User sort options
export const USER_SORT_OPTIONS = ['followers', 'stars'] as const;
export type UserSortOption = (typeof USER_SORT_OPTIONS)[number];
