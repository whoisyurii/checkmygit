<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
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
		{#each Array(10) as _, i (i)}
			<Table.Row>
				<Table.Cell>
					<Skeleton width="20px" height="20px" variant="rectangular" />
				</Table.Cell>
				<Table.Cell>
					<div class="flex items-center gap-3">
						<Skeleton variant="circular" width="32px" height="32px" />
						<div class="flex flex-col gap-2">
							<Skeleton width="180px" height="16px" variant="rectangular" />
							<Skeleton width="260px" height="14px" variant="rectangular" />
						</div>
					</div>
				</Table.Cell>
				<Table.Cell class="text-right">
					<Skeleton width="50px" height="16px" variant="rectangular" class="ml-auto" />
				</Table.Cell>
				<Table.Cell class="text-right hidden sm:table-cell">
					<Skeleton width="40px" height="16px" variant="rectangular" class="ml-auto" />
				</Table.Cell>
				<Table.Cell class="hidden md:table-cell">
					<Skeleton width="70px" height="22px" variant="rectangular" />
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
