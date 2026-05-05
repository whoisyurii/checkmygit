<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import Badge from '$lib/components/ui/Badge.svelte';
	import FireIcon from '$lib/components/ui/FireIcon.svelte';
	import { formatNumber } from '$lib/utils/github-transform';
	import type { TrendingRepository, TrendingWindow } from '$lib/types/trending';
	import { WINDOW_PERIOD_TEXT } from '$lib/types/trending';

	interface Props {
		repos: TrendingRepository[];
		since: TrendingWindow;
	}

	let { repos, since }: Props = $props();
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-12">#</Table.Head>
			<Table.Head>Repository</Table.Head>
			<Table.Head class="text-right">Stars {WINDOW_PERIOD_TEXT[since]}</Table.Head>
			<Table.Head class="hidden text-right sm:table-cell">Total</Table.Head>
			<Table.Head class="hidden md:table-cell">Language</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each repos as repo (repo.nameWithOwner)}
			<Table.Row href={repo.url} target="_blank">
				<Table.Cell class="font-medium text-text-secondary">{repo.rank}</Table.Cell>
				<Table.Cell>
					<div class="flex items-center gap-3">
						<a
							href="/{repo.owner}"
							class="shrink-0"
							aria-label="View {repo.owner}'s CheckMyGit portfolio"
							onclick={(e) => e.stopPropagation()}
						>
							<img
								src={repo.avatarUrl}
								alt={repo.owner}
								loading="lazy"
								class="h-8 w-8 rounded-full hover:ring-2 hover:ring-accent-blue"
							/>
						</a>
						<div class="min-w-0">
							<a
								href={repo.url}
								target="_blank"
								rel="noopener noreferrer"
								class="block truncate font-medium text-text-primary hover:text-accent-blue"
								onclick={(e) => e.stopPropagation()}
							>
								{repo.nameWithOwner}
							</a>
							{#if repo.description}
								<p class="max-w-[300px] truncate text-sm text-text-secondary md:max-w-[400px]">
									{repo.description}
								</p>
							{/if}
						</div>
					</div>
				</Table.Cell>
				<Table.Cell class="text-right">
					{#if repo.periodStars > 0}
						<div class="flex items-center justify-end gap-1.5">
							<FireIcon size={16} animated={false} />
							<span class="font-semibold text-text-primary">+{formatNumber(repo.periodStars)}</span>
						</div>
					{:else}
						<span class="text-text-tertiary">—</span>
					{/if}
				</Table.Cell>
				<Table.Cell class="hidden text-right sm:table-cell">
					<div class="flex items-center justify-end gap-1 text-text-secondary">
						<svg class="h-4 w-4 text-accent-yellow" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"
							/>
						</svg>
						<span>{formatNumber(repo.stargazerCount)}</span>
					</div>
				</Table.Cell>
				<Table.Cell class="hidden md:table-cell">
					{#if repo.language}
						<Badge color={repo.language.color}>{repo.language.name}</Badge>
					{:else}
						<span class="text-text-tertiary">—</span>
					{/if}
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
