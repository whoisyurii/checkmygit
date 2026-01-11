import { env } from '$env/dynamic/private';
import type {
	RankedRepository,
	RankedUser,
	GraphQLSearchRepoNode,
	GraphQLSearchUserNode,
	GraphQLSearchResponse
} from '$lib/types/rankings';

const GITHUB_TOKEN = env.GITHUB_TOKEN;
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

// GraphQL query for top repositories
const TOP_REPOS_QUERY = `
query TopRepositories($query: String!, $first: Int!) {
  search(query: $query, type: REPOSITORY, first: $first) {
    repositoryCount
    nodes {
      ... on Repository {
        nameWithOwner
        description
        url
        stargazerCount
        forkCount
        primaryLanguage { name color }
        owner { login avatarUrl }
      }
    }
  }
}
`;

// GraphQL query for top users (includes star count from top 10 repos for performance)
const TOP_USERS_QUERY = `
query TopUsers($query: String!, $first: Int!) {
  search(query: $query, type: USER, first: $first) {
    userCount
    nodes {
      ... on User {
        login
        name
        avatarUrl
        bio
        followers { totalCount }
        repositories(privacy: PUBLIC, first: 10, orderBy: {field: STARGAZERS, direction: DESC}) {
          totalCount
          nodes { stargazerCount }
        }
      }
    }
  }
}
`;

interface RankingsResult<T> {
	success: boolean;
	data: T[];
	error?: string;
}

// Fetch top repositories from GitHub
export async function fetchTopRepositories(
	language?: string,
	limit: number = 25
): Promise<RankingsResult<RankedRepository>> {
	if (!GITHUB_TOKEN) {
		return {
			success: false,
			data: [],
			error: 'GitHub token not configured'
		};
	}

	try {
		// Build search query
		let searchQuery = 'stars:>1000 sort:stars';
		if (language) {
			searchQuery = `stars:>1000 language:${language} sort:stars`;
		}

		const response = await fetch(GITHUB_GRAPHQL_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${GITHUB_TOKEN}`,
				'Content-Type': 'application/json',
				'User-Agent': 'CheckMyGit'
			},
			body: JSON.stringify({
				query: TOP_REPOS_QUERY,
				variables: { query: searchQuery, first: limit }
			})
		});

		if (!response.ok) {
			if (response.status === 403) {
				return { success: false, data: [], error: 'GitHub API rate limit exceeded' };
			}
			return { success: false, data: [], error: `GitHub API error: ${response.statusText}` };
		}

		const json = (await response.json()) as {
			data?: GraphQLSearchResponse<GraphQLSearchRepoNode>;
			errors?: Array<{ message: string }>;
		};

		if (json.errors) {
			return { success: false, data: [], error: json.errors[0].message };
		}

		if (!json.data?.search?.nodes) {
			return { success: false, data: [], error: 'No data returned from GitHub' };
		}

		// Transform and add rank
		const repos: RankedRepository[] = json.data.search.nodes
			.filter((node): node is GraphQLSearchRepoNode => node !== null && 'nameWithOwner' in node)
			.map((node, index) => ({
				rank: index + 1,
				nameWithOwner: node.nameWithOwner,
				description: node.description,
				url: node.url,
				stargazerCount: node.stargazerCount,
				forkCount: node.forkCount,
				primaryLanguage: node.primaryLanguage,
				owner: node.owner
			}));

		return { success: true, data: repos };
	} catch (error) {
		return {
			success: false,
			data: [],
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

// Fetch top users from GitHub
export async function fetchTopUsers(
	sortBy: 'followers' | 'stars' = 'followers',
	limit: number = 25
): Promise<RankingsResult<RankedUser>> {
	if (!GITHUB_TOKEN) {
		return {
			success: false,
			data: [],
			error: 'GitHub token not configured'
		};
	}

	try {
		const searchQuery = 'followers:>1000 sort:followers type:user';

		const response = await fetch(GITHUB_GRAPHQL_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${GITHUB_TOKEN}`,
				'Content-Type': 'application/json',
				'User-Agent': 'CheckMyGit'
			},
			body: JSON.stringify({
				query: TOP_USERS_QUERY,
				variables: { query: searchQuery, first: limit }
			})
		});

		if (!response.ok) {
			if (response.status === 403) {
				return { success: false, data: [], error: 'GitHub API rate limit exceeded' };
			}
			return { success: false, data: [], error: `GitHub API error: ${response.statusText}` };
		}

		const json = (await response.json()) as {
			data?: GraphQLSearchResponse<GraphQLSearchUserNode>;
			errors?: Array<{ message: string }>;
		};

		if (json.errors) {
			return { success: false, data: [], error: json.errors[0].message };
		}

		if (!json.data?.search?.nodes) {
			return { success: false, data: [], error: 'No data returned from GitHub' };
		}

		// Transform and calculate total stars
		let users: RankedUser[] = json.data.search.nodes
			.filter((node): node is GraphQLSearchUserNode => node !== null && 'login' in node)
			.map((node) => {
				const totalStars = node.repositories.nodes.reduce(
					(sum, repo) => sum + repo.stargazerCount,
					0
				);
				return {
					rank: 0, // Will be set after sorting
					login: node.login,
					name: node.name,
					avatarUrl: node.avatarUrl,
					bio: node.bio,
					followers: node.followers.totalCount,
					totalRepos: node.repositories.totalCount,
					totalStars
				};
			});

		// Sort by the requested field
		if (sortBy === 'stars') {
			users.sort((a, b) => b.totalStars - a.totalStars);
		}
		// For followers, already sorted by GitHub

		// Limit and assign ranks
		users = users.slice(0, limit).map((user, index) => ({
			...user,
			rank: index + 1
		}));

		return { success: true, data: users };
	} catch (error) {
		return {
			success: false,
			data: [],
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

// Format large numbers (1000 -> 1k, 1000000 -> 1M)
export function formatCount(count: number): string {
	if (count >= 1000000) {
		return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
	}
	if (count >= 1000) {
		return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
	}
	return count.toString();
}
