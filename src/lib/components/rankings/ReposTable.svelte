<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import Badge from '$lib/components/ui/Badge.svelte';
	import type { RankedRepository } from '$lib/types/rankings';

	interface Props {
		repos: RankedRepository[];
	}

	let { repos }: Props = $props();

	function formatNumber(count: number): string {
		if (count >= 1000000) {
			return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
		}
		if (count >= 1000) {
			return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
		}
		return count.toString();
	}
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-12">#</Table.Head>
			<Table.Head>Repository</Table.Head>
			<Table.Head class="text-right">Stars</Table.Head>
			<Table.Head class="text-right hidden sm:table-cell">Forks</Table.Head>
			<Table.Head class="hidden md:table-cell">Language</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each repos as repo}
			<Table.Row href="/{repo.owner.login}">
				<Table.Cell class="font-medium text-[var(--color-text-secondary)]">
					{repo.rank}
				</Table.Cell>
				<Table.Cell>
					<div class="flex items-center gap-3">
						<img
							src={repo.owner.avatarUrl}
							alt={repo.owner.login}
							class="h-8 w-8 rounded-full"
						/>
						<div class="min-w-0">
							<a
								href={repo.url}
								target="_blank"
								rel="noopener noreferrer"
								class="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-blue)] truncate block"
								onclick={(e) => e.stopPropagation()}
							>
								{repo.nameWithOwner}
							</a>
							{#if repo.description}
								<p class="text-sm text-[var(--color-text-secondary)] truncate max-w-[300px] md:max-w-[400px]">
									{repo.description}
								</p>
							{/if}
						</div>
					</div>
				</Table.Cell>
				<Table.Cell class="text-right">
					<div class="flex items-center justify-end gap-1">
						<svg class="h-4 w-4 text-[var(--color-accent-yellow)]" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
						</svg>
						<span class="font-medium">{formatNumber(repo.stargazerCount)}</span>
					</div>
				</Table.Cell>
				<Table.Cell class="text-right hidden sm:table-cell">
					<div class="flex items-center justify-end gap-1 text-[var(--color-text-secondary)]">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
						</svg>
						<span>{formatNumber(repo.forkCount)}</span>
					</div>
				</Table.Cell>
				<Table.Cell class="hidden md:table-cell">
					{#if repo.primaryLanguage}
						<Badge color={repo.primaryLanguage.color}>
							{repo.primaryLanguage.name}
						</Badge>
					{:else}
						<span class="text-[var(--color-text-tertiary)]">-</span>
					{/if}
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
