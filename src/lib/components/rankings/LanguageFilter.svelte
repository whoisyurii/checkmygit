<script lang="ts">
	import Dropdown from '$lib/components/ui/Dropdown.svelte';
	import { RANKING_LANGUAGES } from '$lib/types/rankings';
	import { goto } from '$app/navigation';

	interface Props {
		language: string;
	}

	let { language }: Props = $props();

	const options = [
		{ value: '', label: 'All Languages' },
		...RANKING_LANGUAGES.map((lang) => ({ value: lang, label: lang }))
	];

	function handleChange(value: string) {
		const url = new URL(window.location.href);
		if (value) {
			url.searchParams.set('language', value);
		} else {
			url.searchParams.delete('language');
		}
		url.searchParams.set('tab', 'repos');
		goto(url.toString(), { replaceState: true });
	}
</script>

<div class="flex items-center gap-2">
	<span class="text-sm text-[var(--color-text-secondary)]">Filter by:</span>
	<Dropdown
		{options}
		value={language}
		placeholder="All Languages"
		onchange={handleChange}
		class="w-40"
	/>
</div>
