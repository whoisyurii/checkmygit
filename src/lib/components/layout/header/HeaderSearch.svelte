<script lang="ts">
	import { goto } from '$app/navigation';

	interface Props {
		username?: string;
	}

	let { username = '' }: Props = $props();

	let searchValue = $state(username);
	let searchFocused = $state(false);

	// Update searchValue when username changes (e.g. navigation)
	$effect(() => {
		searchValue = username;
	});

	function handleSearch(e: KeyboardEvent) {
		if (e.key === 'Enter' && searchValue.trim()) {
			goto(`/${searchValue.trim()}`);
		}
	}
</script>

<div class="relative w-full max-w-[320px]">
	<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
		<svg class="h-4 w-4 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
		</svg>
	</div>
	<input
		type="text"
		placeholder="Search users..."
		bind:value={searchValue}
		onkeydown={handleSearch}
		onfocus={() => searchFocused = true}
		onblur={() => searchFocused = false}
		class="h-9 w-full rounded-lg border bg-[var(--color-bg-secondary)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-all focus:border-[var(--color-saas-green)] focus:bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-saas-green)] {searchFocused ? 'border-[var(--color-saas-green)]' : 'border-[var(--color-border-default)]'}"
	/>
</div>
