<script lang="ts">
	import type { GitHubProfile } from '$lib/types/github';
	import {
		formatNumber,
		githubAvatar,
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
	const stats = $derived(profile.stats);
	const name = $derived(user.name || user.login);
	// Newspapers go by surname after the first mention
	const surname = $derived(name.trim().split(/\s+/).pop() ?? name);

	// Where the lead story is filed from
	const dateline = $derived(user.location?.trim() || 'GitHub');

	const totalContributions = $derived(getTotalContributions(profile));
	const streak = $derived(getContributionStreak(profile));
	const activeDay = $derived(getMostActiveDay(profile));

	const today = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
	const joined = $derived(
		new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
	);

	// Volume number: one per year on GitHub
	function roman(n: number): string {
		const numerals: [number, string][] = [
			[10, 'X'],
			[9, 'IX'],
			[5, 'V'],
			[4, 'IV'],
			[1, 'I']
		];
		let out = '';
		for (const [value, numeral] of numerals) {
			while (n >= value) {
				out += numeral;
				n -= value;
			}
		}
		return out;
	}

	const repos = $derived(
		[...profile.pinnedRepositories].sort((a, b) => b.stargazerCount - a.stargazerCount).slice(0, 6)
	);
	const external = $derived(profile.contributions?.externalContributions?.slice(0, 8) ?? []);
	const orgs = $derived(profile.organizations?.slice(0, 8) ?? []);

	const count = (n: number, one: string, many = `${one}s`) =>
		`${n.toLocaleString()} ${n === 1 ? one : many}`;

	const headline = $derived(
		totalContributions > 0
			? `${surname} Logs ${totalContributions.toLocaleString()} Contributions in Twelve Months`
			: stats.totalStars > 0
				? `${surname}’s Repositories Draw ${formatNumber(stats.totalStars)} Stars`
				: `${surname} Keeps ${count(stats.totalRepos, 'Public Repository', 'Public Repositories')}`
	);

	const deck = $derived.by(() => {
		const top = profile.languages[0];
		const reach = `${formatNumber(stats.totalStars)} stars across ${count(stats.totalRepos, 'repository', 'repositories')}`;
		return top ? `${top.name} leads the portfolio, with ${reach}` : `A portfolio of ${reach}`;
	});

	// The lead story, written from the numbers
	const story = $derived.by(() => {
		const paragraphs: string[] = [];

		let opening = `${name}, on GitHub as @${user.login} since ${joined}, maintains ${count(stats.totalRepos, 'public repository', 'public repositories')} that ${stats.totalRepos === 1 ? 'has' : 'have'} gathered ${count(stats.totalStars, 'star')} and ${count(stats.totalForks, 'fork')}.`;
		if (user.company) opening += ` ${surname} lists ${user.company.replace('@', '')} as employer.`;
		paragraphs.push(opening);

		const [first, second, third] = profile.languages;
		if (first) {
			let languages = `${first.name} accounts for ${first.percentage} percent of the code on record`;
			if (second) languages += `, ahead of ${second.name} at ${second.percentage} percent`;
			if (second && third) languages += ` and ${third.name} at ${third.percentage} percent`;
			paragraphs.push(`${languages}.`);
		}

		const contributions = profile.contributions;
		if (contributions && totalContributions > 0) {
			let year = `Over the past twelve months the account recorded ${count(totalContributions, 'contribution')}, among them ${count(contributions.totalCommitContributions, 'commit')}, ${count(contributions.totalPullRequestContributions, 'pull request')} and ${count(contributions.totalPullRequestReviewContributions, 'code review')}.`;
			if (activeDay && activeDay.contributionCount > 0) {
				const date = new Date(activeDay.date).toLocaleDateString('en-US', {
					weekday: 'long',
					month: 'long',
					day: 'numeric',
					timeZone: 'UTC'
				});
				year += ` The busiest day was ${date}, with ${activeDay.contributionCount}.`;
			}
			if (streak > 1) year += ` The current streak stands at ${streak} days.`;
			paragraphs.push(year);
		}

		const flagship = repos[0];
		if (flagship && flagship.stargazerCount > 0) {
			let top = `The most-starred repository, ${flagship.name}, stands at ${count(flagship.stargazerCount, 'star')}`;
			if (flagship.primaryLanguage)
				top += ` and is written mainly in ${flagship.primaryLanguage.name}`;
			paragraphs.push(`${top}.`);
		}

		const merged = contributions?.externalPRCount ?? 0;
		if (merged > 0 && external[0]) {
			paragraphs.push(
				`Beyond the account’s own repositories, ${surname} had ${count(merged, 'pull request')} merged elsewhere, most often in ${external[0].repoName}.`
			);
		}

		let audience = `${count(user.followers, 'person follows', 'people follow')} the work`;
		if (user.following > 0)
			audience += `; ${surname} follows ${user.following.toLocaleString()} in return`;
		paragraphs.push(`${audience}.`);

		return paragraphs;
	});

	const figures = $derived([
		{ label: 'Repositories', value: stats.totalRepos.toLocaleString() },
		{ label: 'Stars', value: formatNumber(stats.totalStars) },
		{ label: 'Forks', value: formatNumber(stats.totalForks) },
		{ label: 'Followers', value: formatNumber(stats.followers) },
		{ label: 'Years active', value: String(stats.yearsActive) }
	]);

	// One bar per week for the chart, plus a tick where each month starts
	const weeks = $derived(
		(profile.contributions?.contributionCalendar.weeks.slice(-53) ?? [])
			.filter((week) => week.contributionDays.length > 0)
			.map((week) => ({
				start: week.contributionDays[0].date,
				total: week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0)
			}))
	);
	const busiestWeek = $derived(Math.max(1, ...weeks.map((week) => week.total)));
	const months = $derived(
		weeks.flatMap((week, i) => {
			const month = new Date(week.start).getUTCMonth();
			const changed = i === 0 || month !== new Date(weeks[i - 1].start).getUTCMonth();
			return changed
				? [
						{
							at: (i / weeks.length) * 100,
							label: new Date(week.start).toLocaleDateString('en-US', {
								month: 'short',
								timeZone: 'UTC'
							})
						}
					]
				: [];
		})
	);
</script>

<svelte:head>
	<!-- Masthead blackletter and headline serif; only this template needs them -->
	<link
		rel="stylesheet"
		crossorigin="anonymous"
		href="https://fonts.googleapis.com/css2?family=Manufacturing+Consent&family=Playfair+Display:ital,wght@0,700;0,900;1,500&display=swap"
	/>
</svelte:head>

<div class="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 {className}">
	<div class="paper px-5 py-6 shadow-lg sm:px-10 sm:py-8">
		<!-- Masthead -->
		<header class="text-center">
			<div class="flex items-baseline justify-between gap-4 text-xs">
				<span
					>Vol. {roman(stats.yearsActive)}, No. {(totalContributions || 1).toLocaleString()}</span
				>
				<span class="hidden sm:inline">{today}</span>
				<span>Free &amp; Open Source</span>
			</div>
			<h1 class="masthead mt-3 text-balance">The {name} Times</h1>
			<p class="rule-double mt-3 py-1.5 text-sm italic">
				“All the Code That’s Fit to Ship”
				<span class="soft not-italic">&ensp;·&ensp;</span>
				<a
					href="https://github.com/{user.login}"
					target="_blank"
					rel="noopener noreferrer"
					class="not-italic hover:underline">github.com/{user.login}</a
				>
			</p>
		</header>

		<div class="mt-6 grid gap-x-8 gap-y-8 lg:grid-cols-12">
			<!-- Lead story -->
			<article class="lg:col-span-8">
				<h2 class="display text-4xl leading-[1.08] font-black text-balance sm:text-5xl">
					{headline}
				</h2>
				<p class="display soft mt-3 text-xl leading-snug font-medium italic">{deck}</p>

				<div class="mt-5 grid gap-6 sm:grid-cols-[220px_1fr]">
					<div>
						<figure>
							<img
								src={user.avatarUrl}
								alt={name}
								width="220"
								height="220"
								fetchpriority="high"
								decoding="async"
								class="aspect-square w-full object-cover contrast-110 grayscale"
							/>
							<figcaption class="soft mt-1.5 text-xs leading-snug italic">
								{name}{#if user.location}, of {user.location}{/if}. Photograph via GitHub.
							</figcaption>
						</figure>
						{#if user.bio}
							<blockquote
								class="display mt-4 border-t border-(--rule) pt-3 text-lg leading-snug italic"
							>
								“{user.bio}”
							</blockquote>
						{/if}
					</div>

					<div class="story sm:columns-2">
						{#each story as paragraph, i (i)}
							<p>
								{#if i === 0}
									<!-- A real element, not ::first-letter, so the PNG export keeps the drop cap -->
									<span class="sr-only">{dateline} —</span>
									<span aria-hidden="true"
										><span class="dropcap">{dateline[0]}</span><span class="font-bold uppercase"
											>{dateline.slice(1)} —</span
										></span
									>
								{/if}
								{paragraph}
							</p>
						{/each}
					</div>
				</div>

				{#if weeks.length > 0 && totalContributions > 0}
					<section class="mt-8">
						<h3 class="section">The Year in Contributions</h3>
						<div class="flex h-28 items-end gap-[3px]">
							{#each weeks as week (week.start)}
								<div
									class="min-h-px flex-1 bg-(--ink)"
									style="height: {(week.total / busiestWeek) * 100}%"
									title="Week of {week.start}: {week.total}"
								></div>
							{/each}
						</div>
						<div class="soft relative mt-1 h-4 border-t border-(--ink) text-[11px]">
							{#each months as month (month.at)}
								<span class="absolute top-0.5" style="left: {month.at}%">{month.label}</span>
							{/each}
						</div>
						<p class="soft mt-2 text-xs italic">
							Contributions per week over the past year; the tallest bar is {busiestWeek.toLocaleString()}.
							Source: GitHub.
						</p>
					</section>
				{/if}
			</article>

			<!-- Sidebar: the figures -->
			<aside class="lg:col-span-4 lg:border-l lg:border-(--rule) lg:pl-8">
				<h3 class="section">By the Numbers</h3>
				<dl>
					{#each figures as figure (figure.label)}
						<div class="leader">
							<dt>{figure.label}</dt>
							<dd class="display text-lg font-bold tabular-nums">{figure.value}</dd>
						</div>
					{/each}
				</dl>

				{#if profile.languages.length > 0}
					<h3 class="section mt-7">Language Index</h3>
					<dl>
						{#each profile.languages.slice(0, 8) as lang (lang.name)}
							<div class="leader">
								<dt>{lang.name}</dt>
								<dd class="tabular-nums">{lang.percentage < 1 ? '<1' : lang.percentage}%</dd>
							</div>
						{/each}
					</dl>
					<p class="soft mt-2 text-xs italic">Share of code by bytes, public repositories.</p>
				{/if}
			</aside>
		</div>

		{#if repos.length > 0}
			<section class="mt-8">
				<h3 class="section">Featured Repositories</h3>
				<div class="stories grid gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
					{#each repos as repo (repo.name)}
						<a href={repo.url} target="_blank" rel="noopener noreferrer" class="group block">
							<p class="soft text-sm italic">
								{[repo.primaryLanguage?.name ?? 'Repository', repo.topics[0]]
									.filter(Boolean)
									.join(' · ')}
							</p>
							<h4
								class="display mt-0.5 text-2xl leading-tight font-bold break-words group-hover:underline"
							>
								{repo.name}
							</h4>
							{#if repo.description}
								<p class="mt-1.5 text-[15px] leading-snug">{repo.description}</p>
							{/if}
							<p class="soft mt-2 text-xs">
								{formatNumber(repo.stargazerCount)} stars · {formatNumber(repo.forkCount)} forks
							</p>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if external.length > 0}
			<section class="mt-8">
				<h3 class="section">Contributions Elsewhere</h3>
				<div class="gap-x-10 sm:columns-2">
					{#each external as contribution (contribution.repoName)}
						<a
							href="https://github.com/{contribution.repoName}"
							target="_blank"
							rel="noopener noreferrer"
							class="leader group break-inside-avoid"
						>
							<span class="truncate group-hover:underline">{contribution.repoName}</span>
							<span class="soft shrink-0 text-sm tabular-nums">
								{count(contribution.prCount, 'pull request')}, {count(
									contribution.commitCount,
									'commit'
								)}
							</span>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Colophon -->
		<footer class="soft mt-8 border-t-3 border-double border-(--ink) pt-3 text-center text-xs">
			{#if orgs.length > 0}
				<p class="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
					<span class="italic">Affiliations:</span>
					{#each orgs as org (org.login)}
						<a
							href={org.url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 hover:underline"
						>
							<img src={githubAvatar(org.avatarUrl, 32)} alt="" class="h-4 w-4 grayscale" />
							{org.name || org.login}
						</a>
					{/each}
				</p>
			{/if}
			<p>
				Circulation: {count(views, 'reader')} · Established {joined} · Printed at checkmygit.com/{user.login}
			</p>
		</footer>
	</div>
</div>

<style>
	/* Newsprint and ink, tinted from the theme so both themes read as paper */
	.paper {
		--ink: var(--color-text-primary);
		--ink-soft: var(--color-text-secondary);
		--rule: color-mix(in srgb, var(--color-text-primary) 30%, transparent);
		background-color: color-mix(in srgb, var(--color-bg-secondary) 93%, #b08d57);
		border: 1px solid var(--color-border-default);
		color: var(--ink);
		font-family: Georgia, 'Times New Roman', serif;
	}

	.soft {
		color: var(--ink-soft);
	}

	.display {
		font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
	}

	.masthead {
		font-family: 'Manufacturing Consent', 'Playfair Display', Georgia, serif;
		font-size: clamp(2.75rem, 8vw, 5.75rem);
		line-height: 1;
	}

	.rule-double {
		border-top: 1px solid var(--ink);
		border-bottom: 3px double var(--ink);
	}

	/* Section heading: heavy rule above, hairline below */
	.section {
		margin-bottom: 0.75rem;
		border-top: 3px solid var(--ink);
		border-bottom: 1px solid var(--rule);
		padding-block: 0.3rem;
		font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
		font-size: 1.125rem;
		font-weight: 700;
	}

	/* Justified body copy with a drop cap */
	.story {
		column-gap: 1.5rem;
		column-rule: 1px solid var(--rule);
		font-size: 15px;
		line-height: 1.6;
		text-align: justify;
		hyphens: auto;
	}

	.story p + p {
		text-indent: 1.25em;
	}

	.dropcap {
		float: left;
		padding-right: 0.08em;
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 3.6em;
		font-weight: 900;
		line-height: 0.82;
		text-transform: uppercase;
	}

	/* Label and value joined by a dotted leader */
	.leader {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding-block: 0.3rem;
	}

	.leader > :first-child {
		display: flex;
		flex: 1;
		align-items: baseline;
		gap: 0.5rem;
		min-width: 0;
	}

	.leader > :first-child::after {
		flex: 1;
		min-width: 1rem;
		border-bottom: 1px dotted var(--rule);
		content: '';
	}

	/* Stories in ruled columns */
	.stories > * {
		padding-inline: 1.5rem;
		border-left: 1px solid var(--rule);
	}

	@media (min-width: 1024px) {
		.stories > :nth-child(3n + 1) {
			padding-left: 0;
			border-left: 0;
		}

		.stories > :nth-child(3n) {
			padding-right: 0;
		}
	}

	@media (min-width: 640px) and (max-width: 1023.98px) {
		.stories > :nth-child(2n + 1) {
			padding-left: 0;
			border-left: 0;
		}

		.stories > :nth-child(2n) {
			padding-right: 0;
		}
	}

	@media (max-width: 639.98px) {
		.stories > * {
			padding-inline: 0;
			border-left: 0;
		}
	}
</style>
