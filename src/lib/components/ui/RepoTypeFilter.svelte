<script lang="ts">
	import Dropdown from '$lib/components/ui/Dropdown.svelte';

	interface Props {
		value: 'all' | 'original';
		onchange: (value: 'all' | 'original') => void;
		label?: string;
	}

	let { value, onchange, label = 'Repos:' }: Props = $props();

	const options = [
		{ value: 'all', label: 'All repos', mobileLabel: 'All' },
		{ value: 'original', label: 'Own repos', mobileLabel: 'Own' }
	];
</script>

<div class="flex items-center gap-2">
	<span class="text-sm text-[var(--color-text-secondary)]">{label}</span>
	<Dropdown
		{options}
		{value}
		onchange={(v) => onchange(v as 'all' | 'original')}
		class="w-36"
	/>
</div>
