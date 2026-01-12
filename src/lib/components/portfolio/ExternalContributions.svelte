<script lang="ts">
	import type { ExternalContribution } from '$lib/types/github';
	import { formatNumber } from '$lib/utils/github-transform';
	import Badge from '$lib/components/ui/Badge.svelte';

	interface Props {
		contributions: ExternalContribution[];
		totalPRs: number;
		totalCommits: number;
		class?: string;
	}

	let { contributions, totalPRs, totalCommits, class: className = '' }: Props = $props();

	// Show top 4 contributions (2x2 grid like Notable Projects)
	const topContributions = $derived(contributions.slice(0, 4));
</script>

<div class={className}>
	<!-- Header (outside cards, like Notable Projects) -->
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<svg class="h-5 w-5 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
			</svg>
			<h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Open Source Contributions</h3>
		</div>
		<div class="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
			<span class="flex items-center gap-1">
				<svg class="h-4 w-4 text-[var(--color-accent-green)]" fill="currentColor" viewBox="0 0 16 16">
					<path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/>
				</svg>
				{formatNumber(totalPRs)} PRs
			</span>
			<span class="flex items-center gap-1">
				<svg class="h-4 w-4 text-[var(--color-accent-purple)]" fill="currentColor" viewBox="0 0 16 16">
					<path d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.43.75a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/>
				</svg>
				{formatNumber(totalCommits)} commits
			</span>
		</div>
	</div>

	<!-- Contributions Grid (2x2 like Notable Projects) -->
	<div class="grid gap-4 sm:grid-cols-2">
		{#each topContributions as contrib}
			<a
				href="https://github.com/{contrib.repoName}"
				target="_blank"
				rel="noopener noreferrer"
				class="group block rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 transition-all hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-tertiary)]"
			>
				<!-- Header -->
				<div class="mb-2 flex items-start justify-between">
					<div class="flex items-center gap-2">
						<svg class="h-4 w-4 text-[var(--color-text-tertiary)]" fill="currentColor" viewBox="0 0 16 16">
							<path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
						</svg>
						<h3 class="font-semibold text-[var(--color-accent-green)] group-hover:underline">
							{contrib.repoName.split('/')[1]}
						</h3>
					</div>
					{#if contrib.language}
						<Badge variant="default" size="sm" color={contrib.language.color}>
							{contrib.language.name}
						</Badge>
					{/if}
				</div>

				<!-- Owner -->
				<p class="mb-3 text-sm text-[var(--color-text-secondary)]">
					Contributed to <span class="text-[var(--color-text-primary)]">{contrib.owner}</span>
				</p>

				<!-- Stats -->
				<div class="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)]">
					{#if contrib.prCount > 0}
						<div class="flex items-center gap-1">
							<svg class="h-4 w-4 text-[var(--color-accent-green)]" fill="currentColor" viewBox="0 0 16 16">
								<path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354Z"/>
							</svg>
							<span>{contrib.prCount} PR{contrib.prCount !== 1 ? 's' : ''}</span>
						</div>
					{/if}
					{#if contrib.commitCount > 0}
						<div class="flex items-center gap-1">
							<svg class="h-4 w-4 text-[var(--color-accent-purple)]" fill="currentColor" viewBox="0 0 16 16">
								<path d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.43.75a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Z"/>
							</svg>
							<span>{contrib.commitCount} commit{contrib.commitCount !== 1 ? 's' : ''}</span>
						</div>
					{/if}
					{#if contrib.stargazerCount > 0}
						<div class="flex items-center gap-1">
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
								<path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
							</svg>
							<span>{formatNumber(contrib.stargazerCount)}</span>
						</div>
					{/if}
					<!-- External link icon -->
					<svg
						class="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
						/>
					</svg>
				</div>
			</a>
		{/each}
	</div>
</div>
