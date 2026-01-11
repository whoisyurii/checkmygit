<script lang="ts">
	import Dropdown from '$lib/components/ui/Dropdown.svelte';

	interface Props {
		sortBy: 'followers' | 'stars';
		onchange: (value: 'followers' | 'stars') => void;
	}

	let { sortBy, onchange }: Props = $props();

	const options = [
		{ value: 'followers', label: 'Followers' },
		{ value: 'stars', label: 'Stars' }
	];
</script>

<div class="flex items-center gap-2">
	<span class="text-sm text-[var(--color-text-secondary)]">Sort by:</span>
	<Dropdown
		{options}
		value={sortBy}
		onchange={(value) => onchange(value as 'followers' | 'stars')}
		class="w-32"
	/>
</div>
