<script lang="ts">
	import type { GitHubProfile } from '$lib/types/github';
	import {
		formatNumber,
		getContributionLevel,
		getContributionStreak,
		getMostActiveDay,
		getTotalContributions
	} from '$lib/utils/github-transform';

	interface Props {
		profile: GitHubProfile;
		class?: string;
		views?: number;
	}

	let { profile, class: className = '', views = 0 }: Props = $props();

	const user = $derived(profile.user);
	const totalContributions = $derived(getTotalContributions(profile));
	const streak = $derived(getContributionStreak(profile));
	const activeDay = $derived(getMostActiveDay(profile));

	const joined = $derived(
		new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
	);
	const website = $derived(
		user.websiteUrl &&
			(user.websiteUrl.startsWith('http') ? user.websiteUrl : `https://${user.websiteUrl}`)
	);

	// The fetch block: label and value pairs, empty ones dropped
	const info = $derived(
		[
			['name', user.name],
			['bio', user.bio],
			['location', user.location],
			['company', user.company?.replace('@', '')],
			['uptime', `${profile.stats.yearsActive} years (since ${joined})`],
			['repos', profile.stats.totalRepos.toLocaleString()],
			['stars', formatNumber(profile.stats.totalStars)],
			['followers', `${formatNumber(user.followers)} (following ${formatNumber(user.following)})`]
		].filter((row): row is [string, string] => Boolean(row[1]))
	);

	// Language bars are drawn with block characters, this many cells wide
	const BAR_CELLS = 32;
	// Shares are recomputed from byte sizes: the stored percentages are whole numbers
	const languageBytes = $derived(profile.languages.reduce((sum, lang) => sum + lang.size, 0) || 1);
	const languages = $derived(
		profile.languages.slice(0, 8).map((lang) => {
			const share = lang.size / languageBytes;
			return { ...lang, share, cells: Math.max(1, Math.round(share * BAR_CELLS)) };
		})
	);

	const weeks = $derived(profile.contributions?.contributionCalendar.weeks.slice(-53) ?? []);
	const heat = [
		'bg-text-primary/8',
		'bg-accent/30',
		'bg-accent/55',
		'bg-accent/80',
		'bg-accent'
	] as const;

	const repos = $derived(
		[...profile.pinnedRepositories].sort((a, b) => b.stargazerCount - a.stargazerCount).slice(0, 6)
	);
	const external = $derived(profile.contributions?.externalContributions?.slice(0, 6) ?? []);
	const orgs = $derived(profile.organizations ?? []);
</script>

<!-- A prompt line; with no command it sits idle on a blinking cursor -->
{#snippet prompt(command?: string)}
	<p class="mt-7 first:mt-0">
		<span class="text-accent-blue">~</span>
		<span class="text-accent">❯</span>
		{#if command}
			<span class="text-text-primary">{command}</span>
		{:else}
			<span class="cursor inline-block h-4 w-2 translate-y-0.5 bg-text-primary" aria-hidden="true"
			></span>
		{/if}
	</p>
{/snippet}

<div class="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 {className}">
	<div
		class="overflow-hidden rounded-lg border border-border-default bg-bg-secondary font-mono text-[13px] leading-6 text-text-secondary shadow-lg"
	>
		<!-- Window title bar -->
		<div class="relative flex h-10 items-center border-b border-border-default bg-bg-tertiary px-4">
			<div class="flex gap-2" aria-hidden="true">
				<span class="h-3 w-3 rounded-full bg-[#ff5f57]"></span>
				<span class="h-3 w-3 rounded-full bg-[#febc2e]"></span>
				<span class="h-3 w-3 rounded-full bg-[#28c840]"></span>
			</div>
			<span class="absolute inset-x-0 text-center text-xs text-text-tertiary">
				{user.login}@github: ~
			</span>
		</div>

		<div class="px-5 py-5 sm:px-7 sm:py-6">
			<!-- Who this is, laid out like a system fetch -->
			{@render prompt('neofetch')}
			<div class="mt-3 flex flex-col gap-x-8 gap-y-4 sm:flex-row sm:items-start">
				<img
					src={user.avatarUrl}
					alt={user.login}
					width="168"
					height="168"
					fetchpriority="high"
					decoding="async"
					class="h-[168px] w-[168px] shrink-0 rounded-md border border-border-default"
				/>
				<div class="min-w-0">
					<h1>
						<span class="font-semibold text-accent">{user.login}</span><span
							class="text-text-tertiary">@</span
						><span class="font-semibold text-accent">github</span>
					</h1>
					<p class="text-text-tertiary" aria-hidden="true">
						{'-'.repeat(user.login.length + 7)}
					</p>
					<dl class="grid grid-cols-[max-content_1fr] gap-x-4">
						{#each info as [label, value] (label)}
							<dt class="text-accent">{label}</dt>
							<dd class="text-text-primary">{value}</dd>
						{/each}
						{#if website}
							<dt class="text-accent">web</dt>
							<dd class="truncate">
								<a
									href={website}
									target="_blank"
									rel="noopener noreferrer"
									class="text-text-primary underline decoration-text-tertiary underline-offset-4 hover:decoration-accent"
								>
									{website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
								</a>
							</dd>
						{/if}
					</dl>
					<!-- The palette row every fetch ends with, in this profile's language colours -->
					{#if languages.length > 0}
						<div class="mt-3 flex" aria-hidden="true">
							{#each languages as lang (lang.name)}
								<span class="h-5 w-7" style="background-color: {lang.color}" title={lang.name}
								></span>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			{#if languages.length > 0}
				{@render prompt('github-linguist --breakdown')}
				<div class="mt-2 grid grid-cols-[max-content_max-content_1fr] gap-x-4">
					{#each languages as lang (lang.name)}
						<span class="text-right text-text-primary tabular-nums"
							>{(lang.share * 100).toFixed(2)}%</span
						>
						<span class="text-text-primary">{lang.name}</span>
						<span class="overflow-hidden whitespace-nowrap" aria-hidden="true">
							<span style="color: {lang.color}">{'█'.repeat(lang.cells)}</span><span
								class="text-text-primary/15">{'░'.repeat(BAR_CELLS - lang.cells)}</span
							>
						</span>
					{/each}
				</div>
			{/if}

			{#if weeks.length > 0}
				{@render prompt('git cal --since=1.year')}
				<div class="mt-3 overflow-x-auto">
					<div class="flex gap-[3px]">
						{#each weeks as week, i (i)}
							<!-- The first week can start mid-week, so it hangs from the bottom -->
							<div class={['flex flex-col gap-[3px]', i === 0 && 'justify-end']}>
								{#each week.contributionDays as day (day.date)}
									<span
										class="h-[11px] w-[11px] rounded-[2px] {heat[
											getContributionLevel(day.contributionCount)
										]}"
										title="{day.date}: {day.contributionCount}"
									></span>
								{/each}
							</div>
						{/each}
					</div>
				</div>
				<p class="mt-3">
					<span class="text-text-primary">{totalContributions.toLocaleString()}</span>
					contributions in the last year
					{#if streak > 0}
						<span class="text-text-tertiary">·</span>
						<span class="text-text-primary">{streak}</span>
						day streak
					{/if}
					{#if activeDay && activeDay.contributionCount > 0}
						<span class="text-text-tertiary">·</span>
						busiest day
						<span class="text-text-primary">
							{new Date(activeDay.date).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								timeZone: 'UTC'
							})}
						</span>
						({activeDay.contributionCount})
					{/if}
				</p>
			{/if}

			{#if repos.length > 0}
				{@render prompt('ls -l --sort=stars ~/pinned')}
				<p class="mt-2 text-text-tertiary">total {repos.length}</p>
				<div class="grid grid-cols-[repeat(4,max-content)_1fr] gap-x-4 overflow-x-auto">
					{#each repos as repo (repo.name)}
						<a
							href={repo.url}
							target="_blank"
							rel="noopener noreferrer"
							class="group col-span-5 grid grid-cols-subgrid hover:bg-text-primary/6"
						>
							<span class="text-text-tertiary">drwxr-xr-x</span>
							<span class="text-right text-accent-yellow tabular-nums"
								>★ {formatNumber(repo.stargazerCount)}</span
							>
							<span class="flex items-center gap-1.5">
								{#if repo.primaryLanguage}
									<span
										class="h-2 w-2 rounded-full"
										style="background-color: {repo.primaryLanguage.color}"
									></span>
									{repo.primaryLanguage.name}
								{:else}
									-
								{/if}
							</span>
							<span class="font-semibold text-accent-blue group-hover:underline">{repo.name}/</span>
							<span class="truncate">{repo.description ?? ''}</span>
						</a>
					{/each}
				</div>
			{/if}

			{#if external.length > 0}
				{@render prompt(`gh search prs --author=${user.login} --merged`)}
				<div class="mt-2 grid grid-cols-[repeat(3,max-content)_1fr] gap-x-4">
					{#each external as contribution (contribution.repoName)}
						<a
							href="https://github.com/{contribution.repoName}"
							target="_blank"
							rel="noopener noreferrer"
							class="group col-span-4 grid grid-cols-subgrid hover:bg-text-primary/6"
						>
							<span class="text-right text-accent-purple tabular-nums"
								>{contribution.prCount} PRs</span
							>
							<span class="text-right tabular-nums">{contribution.commitCount} commits</span>
							<span class="text-right text-accent-yellow tabular-nums"
								>★ {formatNumber(contribution.stargazerCount)}</span
							>
							<span class="truncate text-text-primary group-hover:underline"
								>{contribution.repoName}</span
							>
						</a>
					{/each}
				</div>
			{/if}

			{#if orgs.length > 0}
				{@render prompt('gh org list')}
				<div class="mt-2 flex flex-wrap gap-x-6">
					{#each orgs.slice(0, 12) as org (org.login)}
						<a
							href={org.url}
							target="_blank"
							rel="noopener noreferrer"
							class="text-text-primary hover:underline">{org.login}</a
						>
					{/each}
				</div>
			{/if}

			{@render prompt()}
		</div>

		<!-- Status line along the bottom, tmux style -->
		<div
			class="flex items-center justify-between gap-4 bg-accent-deep px-4 text-xs leading-6 text-text-primary"
		>
			<span class="truncate">[{user.login}] 0:zsh*</span>
			<span class="shrink-0">
				{views.toLocaleString()} views
				<span class="text-text-primary/40">│</span>
				<a
					href="https://github.com/{user.login}"
					target="_blank"
					rel="noopener noreferrer"
					class="hover:underline">github.com/{user.login}</a
				>
			</span>
		</div>
	</div>
</div>

<style>
	.cursor {
		animation: blink 1.1s steps(1) infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cursor {
			animation: none;
		}
	}
</style>
