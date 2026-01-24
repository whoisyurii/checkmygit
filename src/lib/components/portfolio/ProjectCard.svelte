<script lang="ts">
	import type { GitHubRepository } from '$lib/types/github';
	import { formatNumber } from '$lib/utils/github-transform';
	import Badge from '$lib/components/ui/Badge.svelte';

	interface Props {
		repo: GitHubRepository;
		class?: string;
	}

	let { repo, class: className = '' }: Props = $props();
</script>

<a
	href={repo.url}
	target="_blank"
	rel="noopener noreferrer"
	class="
		group block min-w-0 overflow-hidden rounded-md border border-border-default
		bg-bg-secondary p-4 transition-all
		hover:border-border-subtle hover:bg-bg-tertiary
		{className}
	"
>
	<!-- Header -->
	<div class="mb-2 flex items-start justify-between gap-2">
		<div class="flex min-w-0 items-center gap-2">
			<svg
				class="h-4 w-4 flex-shrink-0 text-text-tertiary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
				/>
			</svg>
			<h3 class="truncate font-semibold text-accent-green group-hover:underline">
				{repo.name}
			</h3>
		</div>
		{#if repo.primaryLanguage}
			<Badge variant="default" size="sm" color={repo.primaryLanguage.color} class="flex-shrink-0">
				{repo.primaryLanguage.name}
			</Badge>
		{/if}
	</div>

	<!-- Description -->
	{#if repo.description}
		<p class="mb-3 line-clamp-2 text-sm text-text-secondary">
			{repo.description}
		</p>
	{:else}
		<p class="mb-3 text-sm italic text-text-tertiary">
			No description available for this repository.
		</p>
	{/if}

	<!-- Topics -->
	{#if repo.topics && repo.topics.length > 0}
		<div class="mb-3 flex flex-wrap gap-1">
			{#each repo.topics.slice(0, 3) as topic}
				<span
					class="rounded-full bg-accent-green/10 px-2 py-0.5 text-xs text-accent-green"
				>
					{topic}
				</span>
			{/each}
		</div>
	{/if}

	<!-- Stats -->
	<div class="flex items-center gap-4 text-xs text-text-tertiary">
		<div class="flex items-center gap-1">
			<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
				<path
					d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"
				/>
			</svg>
			<span>{formatNumber(repo.stargazerCount)}</span>
		</div>
		<div class="flex items-center gap-1">
			<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
				<path
					d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"
				/>
			</svg>
			<span>{formatNumber(repo.forkCount)}</span>
		</div>
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
