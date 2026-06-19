<script lang="ts">
	import { page } from '$app/stores';

	const tabs = [
		{ href: '/explore/trending', label: 'Trending' },
		{ href: '/explore/rankings', label: 'Rankings' },
		{ href: '/explore/globe', label: 'Globe' }
	];

	let pathname = $derived($page.url.pathname);
</script>

<nav
	class="inline-flex gap-1 rounded-lg border border-border-default bg-bg-secondary p-1"
	aria-label="Explore sections"
>
	{#each tabs as tab (tab.href)}
		{@const active = pathname === tab.href}
		<a
			href={tab.href}
			aria-current={active ? 'page' : undefined}
			class="flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all
				{active
				? 'bg-bg-primary text-accent shadow-sm ring-1 ring-border-default/60'
				: 'text-text-secondary hover:bg-bg-tertiary/60 hover:text-text-primary'}"
		>
			{#if tab.href === '/explore/trending'}
				<svg
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
					/>
				</svg>
			{:else if tab.href === '/explore/rankings'}
				<svg
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			{:else}
				<svg
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			{/if}
			{tab.label}
		</a>
	{/each}
</nav>
