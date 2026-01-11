<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import type { RankedUser } from '$lib/types/rankings';

	interface Props {
		users: RankedUser[];
		userSortBy: 'followers' | 'stars';
	}

	let { users, userSortBy }: Props = $props();

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
			<Table.Head>User</Table.Head>
			<Table.Head class="text-right">{userSortBy === 'stars' ? 'Stars' : 'Followers'}</Table.Head>
			<Table.Head class="text-right hidden sm:table-cell">{userSortBy === 'stars' ? 'Followers' : 'Stars'}</Table.Head>
			<Table.Head class="text-right hidden md:table-cell">Repos</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each users as user}
			<Table.Row href="/{user.login}">
				<Table.Cell class="font-medium text-[var(--color-text-secondary)]">
					{user.rank}
				</Table.Cell>
				<Table.Cell>
					<div class="flex items-center gap-3">
						<img
							src={user.avatarUrl}
							alt={user.login}
							class="h-10 w-10 rounded-full"
						/>
						<div class="min-w-0">
							<div class="font-medium text-[var(--color-text-primary)]">
								{user.name || user.login}
							</div>
							<div class="text-sm text-[var(--color-text-secondary)]">
								@{user.login}
							</div>
							{#if user.bio}
								<p class="text-sm text-[var(--color-text-tertiary)] truncate max-w-[300px] md:max-w-[400px] hidden md:block">
									{user.bio}
								</p>
							{/if}
						</div>
					</div>
				</Table.Cell>
				<Table.Cell class="text-right">
					{#if userSortBy === 'stars'}
						<div class="flex items-center justify-end gap-1">
							<svg class="h-4 w-4 text-[var(--color-accent-yellow)]" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
							</svg>
							<span class="font-medium">{formatNumber(user.totalStars)}</span>
						</div>
					{:else}
						<div class="flex items-center justify-end gap-1">
							<svg class="h-4 w-4 text-[var(--color-accent-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
							</svg>
							<span class="font-medium">{formatNumber(user.followers)}</span>
						</div>
					{/if}
				</Table.Cell>
				<Table.Cell class="text-right hidden sm:table-cell">
					{#if userSortBy === 'stars'}
						<div class="flex items-center justify-end gap-1 text-[var(--color-text-secondary)]">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
							</svg>
							<span>{formatNumber(user.followers)}</span>
						</div>
					{:else}
						<div class="flex items-center justify-end gap-1 text-[var(--color-text-secondary)]">
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
							</svg>
							<span>{formatNumber(user.totalStars)}</span>
						</div>
					{/if}
				</Table.Cell>
				<Table.Cell class="text-right hidden md:table-cell">
					<span class="text-[var(--color-text-secondary)]">{formatNumber(user.totalRepos)}</span>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
