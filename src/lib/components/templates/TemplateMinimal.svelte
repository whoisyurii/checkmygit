<script lang="ts">
	import type { GitHubProfile } from '$lib/types/github';
	import { formatNumber, formatJoinDate, getTotalContributions } from '$lib/utils/github-transform';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Dropdown from '$lib/components/ui/Dropdown.svelte';
	import ExternalContributions from '$lib/components/portfolio/ExternalContributions.svelte';

	interface Props {
		profile: GitHubProfile;
		class?: string;
		views?: number;
	}

	let { profile, class: className = '', views = 0 }: Props = $props();

	const totalContributions = $derived(getTotalContributions(profile));
	const joinDate = $derived(formatJoinDate(profile.user.createdAt));

	let sortBy = $state('stars');
	const sortOptions = [
		{ value: 'stars', label: 'Most Stars' },
		{ value: 'pinned', label: 'Pinned Order' }
	];

	const sortedRepos = $derived(
		sortBy === 'stars'
			? [...profile.pinnedRepositories].sort((a, b) => b.stargazerCount - a.stargazerCount)
			: profile.pinnedRepositories
	);
</script>

<div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 {className}">

	<!-- Header -->
	<header class="mb-16 text-center">
		<img
			src={profile.user.avatarUrl}
			alt={profile.user.login}
			class="mx-auto mb-6 h-32 w-32 rounded-full border-4 border-border-default"
		/>
		<h1 class="text-4xl font-bold text-text-primary">
			{profile.user.name || profile.user.login}
		</h1>
		<p class="mt-2 text-xl text-text-secondary">
			@{profile.user.login}
		</p>
		{#if profile.user.bio}
			<p class="mx-auto mt-4 max-w-xl text-text-secondary">
				{profile.user.bio}
			</p>
		{/if}

		<!-- Social Links -->
		<div class="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-text-tertiary">
			{#if profile.user.location}
				<span>{profile.user.location}</span>
			{/if}
			{#if profile.user.company}
				<span>{profile.user.company.replace('@', '')}</span>
			{/if}
			{#if profile.user.websiteUrl}
				<a
					href={profile.user.websiteUrl.startsWith('http') ? profile.user.websiteUrl : `https://${profile.user.websiteUrl}`}
					target="_blank"
					rel="noopener noreferrer"
					class="text-accent-green hover:underline"
				>
					{profile.user.websiteUrl.replace(/^https?:\/\//, '')}
				</a>
			{/if}
		</div>
	</header>

	<!-- Stats Row -->
	<section class="mb-16">
		<div class="flex flex-wrap items-center justify-center gap-8 text-center">
			<div>
				<div class="text-3xl font-bold text-text-primary">
					{profile.stats.totalRepos}
				</div>
				<div class="text-sm text-text-secondary">Repositories</div>
			</div>
			<div class="h-12 w-px bg-border-default"></div>
			<div>
				<div class="text-3xl font-bold text-text-primary">
					{formatNumber(profile.stats.totalStars)}
				</div>
				<div class="text-sm text-text-secondary">Stars</div>
			</div>
			<div class="h-12 w-px bg-border-default"></div>
			<div>
				<div class="text-3xl font-bold text-text-primary">
					{formatNumber(profile.stats.followers)}
				</div>
				<div class="text-sm text-text-secondary">Followers</div>
			</div>
			{#if totalContributions > 0}
				<div class="h-12 w-px bg-border-default"></div>
				<div>
					<div class="text-3xl font-bold text-accent-green">
						{formatNumber(totalContributions)}
					</div>
					<div class="text-sm text-text-secondary">Contributions</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Languages -->
	{#if profile.languages.length > 0}
		<section class="mb-16">
			<h2 class="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-text-tertiary">
				Technologies
			</h2>
			<div class="flex flex-wrap justify-center gap-2">
				{#each profile.languages as lang}
					<Badge variant="outline" color={lang.color} size="md">
						{lang.name}
					</Badge>
				{/each}
			</div>
		</section>
	{/if}

	<!-- External Open Source Contributions -->
	{#if profile.contributions?.externalContributions && profile.contributions.externalContributions.length > 0}
		<section class="mb-16">
			<ExternalContributions
				contributions={profile.contributions.externalContributions}
				totalPRs={profile.contributions.externalPRCount ?? 0}
				totalCommits={profile.contributions.externalCommitCount ?? 0}
			/>
		</section>
	{/if}

	<!-- Featured Projects -->
	{#if profile.pinnedRepositories.length > 0}
		<section class="mb-16">
			<div class="mb-8 flex items-center justify-between">
				<h2 class="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
					Featured Projects
				</h2>
				<Dropdown options={sortOptions} bind:value={sortBy} />
			</div>
			<div class="space-y-6">
				{#each sortedRepos.slice(0, 4) as repo}
					<a
						href={repo.url}
						target="_blank"
						rel="noopener noreferrer"
						class="group block border-b border-border-muted pb-6 last:border-0"
					>
						<div class="flex items-start justify-between">
							<div>
								<h3 class="text-lg font-semibold text-accent-green group-hover:underline">
									{repo.name}
								</h3>
								{#if repo.description}
									<p class="mt-1 text-text-secondary">
										{repo.description}
									</p>
								{/if}
							</div>
							<div class="flex items-center gap-3 text-sm text-text-tertiary">
								{#if repo.primaryLanguage}
									<span class="flex items-center gap-1">
										<span class="h-2 w-2 rounded-full" style="background-color: {repo.primaryLanguage.color}"></span>
										{repo.primaryLanguage.name}
									</span>
								{/if}
								<span class="flex items-center gap-1">
									<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
										<path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
									</svg>
									{repo.stargazerCount}
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Footer -->
	<footer class="text-center text-sm text-text-tertiary">
		<p>{joinDate}</p>
		<p class="mt-2">
			<a
				href="https://github.com/{profile.user.login}"
				target="_blank"
				rel="noopener noreferrer"
				class="text-accent-green hover:underline"
			>
				View on GitHub →
			</a>
		</p>
		<p class="mt-4 flex items-center justify-center gap-2 text-text-secondary">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
			</svg>
			<span><span class="font-semibold text-text-primary">{views.toLocaleString()}</span> viewers</span>
		</p>
	</footer>
</div>
