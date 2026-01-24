import { env } from '$env/dynamic/private';
const GITHUB_TOKEN = env.GITHUB_TOKEN;
import type {
	GitHubProfile,
	GitHubUser,
	GitHubRepository,
	LanguageStats,
	ContributionsCollection,
	ExternalContribution,
	GraphQLUserResponse,
	RESTUserResponse,
	RESTRepoResponse,
	GitHubResult,
	GitHubError
} from '$lib/types/github';
import { LANGUAGE_COLORS } from '$lib/types/portfolio';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const GITHUB_REST_URL = 'https://api.github.com';

// GraphQL query for full profile data
const USER_QUERY = `
query GetUserProfile($username: String!) {
  user(login: $username) {
    login
    name
    bio
    avatarUrl
    location
    company
    websiteUrl
    twitterUsername
    email
    followers { totalCount }
    following { totalCount }
    createdAt
    updatedAt
    repositories(first: 100, orderBy: {field: STARGAZERS, direction: DESC}, privacy: PUBLIC) {
      totalCount
      nodes {
        name
        description
        url
        homepageUrl
        stargazerCount
        forkCount
        primaryLanguage { name color }
        languages(first: 10) {
          edges {
            size
            node {
              name
              color
            }
          }
        }
        isPrivate
        isFork
        isArchived
        repositoryTopics(first: 10) {
          nodes { topic { name } }
        }
        pushedAt
        createdAt
      }
    }
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          description
          url
          homepageUrl
          stargazerCount
          forkCount
          primaryLanguage { name color }
          languages(first: 10) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
          isPrivate
          isFork
          isArchived
          repositoryTopics(first: 10) {
            nodes { topic { name } }
          }
          pushedAt
          createdAt
        }
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
      pullRequestContributionsByRepository(maxRepositories: 100) {
        repository {
          nameWithOwner
          owner { login }
          primaryLanguage { name color }
          stargazerCount
        }
        contributions {
          totalCount
        }
      }
      commitContributionsByRepository(maxRepositories: 100) {
        repository {
          nameWithOwner
          owner { login }
          primaryLanguage { name color }
        }
        contributions {
          totalCount
        }
      }
    }
  }
}
`;

// Fetch user via GraphQL API (requires token)
async function fetchUserGraphQL(username: string): Promise<GitHubResult<GitHubProfile>> {
	if (!GITHUB_TOKEN) {
		return {
			success: false,
			error: {
				type: 'UNAUTHORIZED',
				message: 'GitHub token not configured. Using REST API fallback.'
			}
		};
	}

	try {
		const response = await fetch(GITHUB_GRAPHQL_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${GITHUB_TOKEN}`,
				'Content-Type': 'application/json',
				'User-Agent': 'CheckMyGit'
			},
			body: JSON.stringify({
				query: USER_QUERY,
				variables: { username }
			})
		});

		if (!response.ok) {
			if (response.status === 401) {
				return {
					success: false,
					error: { type: 'UNAUTHORIZED', message: 'Invalid GitHub token', status: 401 }
				};
			}
			if (response.status === 403) {
				return {
					success: false,
					error: { type: 'RATE_LIMIT', message: 'GitHub API rate limit exceeded', status: 403 }
				};
			}
			return {
				success: false,
				error: { type: 'UNKNOWN', message: `GitHub API error: ${response.statusText}`, status: response.status }
			};
		}

		const json = (await response.json()) as { data?: GraphQLUserResponse; errors?: Array<{ message: string }> };

		if (json.errors) {
			const notFound = json.errors.some((e) => e.message.includes('Could not resolve'));
			if (notFound) {
				return {
					success: false,
					error: { type: 'NOT_FOUND', message: `User "${username}" not found` }
				};
			}
			return {
				success: false,
				error: { type: 'UNKNOWN', message: json.errors[0].message }
			};
		}

		if (!json.data?.user) {
			return {
				success: false,
				error: { type: 'NOT_FOUND', message: `User "${username}" not found` }
			};
		}

		const profile = transformGraphQLResponse(json.data);
		return { success: true, data: profile };
	} catch (error) {
		return {
			success: false,
			error: {
				type: 'UNKNOWN',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			}
		};
	}
}

// Fetch user via REST API (fallback, no token needed)
async function fetchUserREST(username: string): Promise<GitHubResult<GitHubProfile>> {
	try {
		const headers: HeadersInit = {
			'User-Agent': 'CheckMyGit',
			Accept: 'application/vnd.github.v3+json'
		};

		// Add token if available for higher rate limits
		if (GITHUB_TOKEN) {
			headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
		}

		// Fetch user data
		const userResponse = await fetch(`${GITHUB_REST_URL}/users/${username}`, { headers });

		if (!userResponse.ok) {
			if (userResponse.status === 404) {
				return {
					success: false,
					error: { type: 'NOT_FOUND', message: `User "${username}" not found`, status: 404 }
				};
			}
			if (userResponse.status === 403) {
				return {
					success: false,
					error: { type: 'RATE_LIMIT', message: 'GitHub API rate limit exceeded', status: 403 }
				};
			}
			return {
				success: false,
				error: { type: 'UNKNOWN', message: `GitHub API error: ${userResponse.statusText}`, status: userResponse.status }
			};
		}

		const userData = (await userResponse.json()) as RESTUserResponse;

		// Fetch repositories
		const reposResponse = await fetch(
			`${GITHUB_REST_URL}/users/${username}/repos?sort=stars&direction=desc&per_page=100`,
			{ headers }
		);
		const reposData = reposResponse.ok ? ((await reposResponse.json()) as RESTRepoResponse[]) : [];

		const profile = transformRESTResponse(userData, reposData);
		return { success: true, data: profile };
	} catch (error) {
		return {
			success: false,
			error: {
				type: 'UNKNOWN',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			}
		};
	}
}

// Main fetch function - tries GraphQL first, falls back to REST
export async function fetchGitHubProfile(username: string): Promise<GitHubResult<GitHubProfile>> {
	// Clean the username
	const cleanUsername = username.trim().replace(/^@/, '');

	// Try GraphQL first if token is available
	if (GITHUB_TOKEN) {
		const graphqlResult = await fetchUserGraphQL(cleanUsername);
		if (graphqlResult.success) {
			return graphqlResult;
		}
		// If GraphQL fails for reasons other than missing token, fall back to REST
		if (graphqlResult.error.type !== 'UNAUTHORIZED') {
			return graphqlResult;
		}
	}

	// Fall back to REST API
	return fetchUserREST(cleanUsername);
}

// Transform GraphQL response to normalized profile
function transformGraphQLResponse(data: GraphQLUserResponse): GitHubProfile {
	const user = data.user!;

	const repositories: GitHubRepository[] = user.repositories.nodes.map((repo) => ({
		name: repo.name,
		description: repo.description,
		url: repo.url,
		homepageUrl: repo.homepageUrl,
		stargazerCount: repo.stargazerCount,
		forkCount: repo.forkCount,
		primaryLanguage: repo.primaryLanguage,
		languages: repo.languages,
		isPrivate: repo.isPrivate,
		isFork: repo.isFork,
		isArchived: repo.isArchived,
		topics: repo.repositoryTopics.nodes.map((t) => t.topic.name),
		pushedAt: repo.pushedAt,
		createdAt: repo.createdAt
	}));

	const pinnedRepositories: GitHubRepository[] = user.pinnedItems.nodes.map((repo) => ({
		name: repo.name,
		description: repo.description,
		url: repo.url,
		homepageUrl: repo.homepageUrl,
		stargazerCount: repo.stargazerCount,
		forkCount: repo.forkCount,
		primaryLanguage: repo.primaryLanguage,
		languages: repo.languages,
		isPrivate: repo.isPrivate,
		isFork: repo.isFork,
		isArchived: repo.isArchived,
		topics: repo.repositoryTopics.nodes.map((t) => t.topic.name),
		pushedAt: repo.pushedAt,
		createdAt: repo.createdAt
	}));

	// Process external contributions (repos not owned by the user)
	const userLogin = user.login.toLowerCase();
	const externalContributionsMap = new Map<string, ExternalContribution>();

	// Process PR contributions to external repos
	for (const prContrib of user.contributionsCollection.pullRequestContributionsByRepository) {
		const ownerLogin = prContrib.repository.owner.login.toLowerCase();
		if (ownerLogin !== userLogin) {
			const repoKey = prContrib.repository.nameWithOwner;
			const existing = externalContributionsMap.get(repoKey);
			if (existing) {
				existing.prCount += prContrib.contributions.totalCount;
			} else {
				externalContributionsMap.set(repoKey, {
					repoName: prContrib.repository.nameWithOwner,
					owner: prContrib.repository.owner.login,
					prCount: prContrib.contributions.totalCount,
					commitCount: 0,
					language: prContrib.repository.primaryLanguage,
					stargazerCount: prContrib.repository.stargazerCount
				});
			}
		}
	}

	// Process commit contributions to external repos
	for (const commitContrib of user.contributionsCollection.commitContributionsByRepository) {
		const ownerLogin = commitContrib.repository.owner.login.toLowerCase();
		if (ownerLogin !== userLogin) {
			const repoKey = commitContrib.repository.nameWithOwner;
			const existing = externalContributionsMap.get(repoKey);
			if (existing) {
				existing.commitCount += commitContrib.contributions.totalCount;
			} else {
				externalContributionsMap.set(repoKey, {
					repoName: commitContrib.repository.nameWithOwner,
					owner: commitContrib.repository.owner.login,
					prCount: 0,
					commitCount: commitContrib.contributions.totalCount,
					language: commitContrib.repository.primaryLanguage,
					stargazerCount: 0
				});
			}
		}
	}

	const externalContributions = Array.from(externalContributionsMap.values())
		.sort((a, b) => (b.prCount + b.commitCount) - (a.prCount + a.commitCount));

	const externalPRCount = externalContributions.reduce((sum, c) => sum + c.prCount, 0);
	const externalCommitCount = externalContributions.reduce((sum, c) => sum + c.commitCount, 0);

	const contributions: ContributionsCollection = {
		totalCommitContributions: user.contributionsCollection.totalCommitContributions,
		totalIssueContributions: user.contributionsCollection.totalIssueContributions,
		totalPullRequestContributions: user.contributionsCollection.totalPullRequestContributions,
		totalPullRequestReviewContributions: user.contributionsCollection.totalPullRequestReviewContributions,
		contributionCalendar: user.contributionsCollection.contributionCalendar,
		externalContributions,
		externalPRCount,
		externalCommitCount
	};

	// Filter out forks for language stats (only count original work)
	const originalRepos = repositories.filter((repo) => !repo.isFork);
	const languages = calculateLanguageStats(originalRepos);
	const yearsActive = calculateYearsActive(user.createdAt);

	const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazerCount, 0);
	const originalStars = originalRepos.reduce((sum, repo) => sum + repo.stargazerCount, 0);
	const totalForks = repositories.reduce((sum, repo) => sum + repo.forkCount, 0);

	return {
		user: {
			login: user.login,
			name: user.name,
			bio: user.bio,
			avatarUrl: user.avatarUrl,
			location: user.location,
			company: user.company,
			websiteUrl: user.websiteUrl,
			twitterUsername: user.twitterUsername,
			email: user.email,
			followers: user.followers.totalCount,
			following: user.following.totalCount,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		},
		repositories,
		pinnedRepositories: pinnedRepositories.length > 0 ? pinnedRepositories : originalRepos.slice(0, 6),
		contributions,
		languages,
		stats: {
			totalRepos: user.repositories.totalCount,
			totalStars,
			originalStars,
			totalForks,
			followers: user.followers.totalCount,
			following: user.following.totalCount,
			yearsActive
		}
	};
}

// Transform REST response to normalized profile
function transformRESTResponse(userData: RESTUserResponse, reposData: RESTRepoResponse[]): GitHubProfile {
	// Include all public repos (both original and forks)
	const repositories: GitHubRepository[] = reposData
		.filter((repo) => !repo.private)
		.map((repo) => ({
			name: repo.name,
			description: repo.description,
			url: repo.html_url,
			homepageUrl: repo.homepage,
			stargazerCount: repo.stargazers_count,
			forkCount: repo.forks_count,
			primaryLanguage: repo.language
				? { name: repo.language, color: LANGUAGE_COLORS[repo.language] || '#8b949e' }
				: null,
			isPrivate: repo.private,
			isFork: repo.fork,
			isArchived: repo.archived,
			topics: repo.topics || [],
			pushedAt: repo.pushed_at,
			createdAt: repo.created_at
		}));

	// Filter out forks for language stats
	const originalRepos = repositories.filter((repo) => !repo.isFork);
	const languages = calculateLanguageStats(originalRepos);
	const yearsActive = calculateYearsActive(userData.created_at);

	const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazerCount, 0);
	const originalStars = originalRepos.reduce((sum, repo) => sum + repo.stargazerCount, 0);
	const totalForks = repositories.reduce((sum, repo) => sum + repo.forkCount, 0);

	return {
		user: {
			login: userData.login,
			name: userData.name,
			bio: userData.bio,
			avatarUrl: userData.avatar_url,
			location: userData.location,
			company: userData.company,
			websiteUrl: userData.blog,
			twitterUsername: userData.twitter_username,
			email: userData.email,
			followers: userData.followers,
			following: userData.following,
			createdAt: userData.created_at,
			updatedAt: userData.updated_at
		},
		repositories,
		pinnedRepositories: originalRepos.slice(0, 6), // REST API doesn't have pinned items
		contributions: null, // REST API doesn't have contribution data
		languages,
		stats: {
			totalRepos: userData.public_repos,
			totalStars,
			originalStars,
			totalForks,
			followers: userData.followers,
			following: userData.following,
			yearsActive
		}
	};
}

// Calculate language statistics from repositories using byte counts
function calculateLanguageStats(repositories: GitHubRepository[]): LanguageStats[] {
	const languageBytes = new Map<string, { bytes: number; color: string }>();

	for (const repo of repositories) {
		// GraphQL path: use detailed byte counts
		if (repo.languages?.edges) {
			for (const edge of repo.languages.edges) {
				const existing = languageBytes.get(edge.node.name);
				if (existing) {
					existing.bytes += edge.size;
				} else {
					languageBytes.set(edge.node.name, {
						bytes: edge.size,
						color: edge.node.color
					});
				}
			}
		} else if (repo.primaryLanguage) {
			// REST fallback: use repo count (1 per repo)
			const existing = languageBytes.get(repo.primaryLanguage.name);
			if (existing) {
				existing.bytes += 1;
			} else {
				languageBytes.set(repo.primaryLanguage.name, {
					bytes: 1,
					color: repo.primaryLanguage.color
				});
			}
		}
	}

	const totalBytes = Array.from(languageBytes.values()).reduce((sum, lang) => sum + lang.bytes, 0);

	if (totalBytes === 0) return [];

	const stats: LanguageStats[] = Array.from(languageBytes.entries())
		.map(([name, data]) => ({
			name,
			color: data.color,
			percentage: Math.round((data.bytes / totalBytes) * 100),
			size: data.bytes
		}))
		.sort((a, b) => b.size - a.size)
		.slice(0, 10);

	// Fix rounding to ensure 100%
	const sum = stats.reduce((s, x) => s + x.percentage, 0);
	if (stats.length > 0 && sum !== 100) {
		stats[0].percentage += 100 - sum;
	}

	return stats;
}

// Calculate years active from account creation
function calculateYearsActive(createdAt: string): number {
	const created = new Date(createdAt);
	const now = new Date();
	const years = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365);
	return Math.max(1, Math.round(years));
}

// Check API rate limit status
export async function checkRateLimit(): Promise<{ remaining: number; reset: Date } | null> {
	try {
		const headers: HeadersInit = {
			'User-Agent': 'CheckMyGit'
		};
		if (GITHUB_TOKEN) {
			headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
		}

		const response = await fetch(`${GITHUB_REST_URL}/rate_limit`, { headers });
		if (!response.ok) return null;

		const data = await response.json();
		return {
			remaining: data.resources.core.remaining,
			reset: new Date(data.resources.core.reset * 1000)
		};
	} catch {
		return null;
	}
}
