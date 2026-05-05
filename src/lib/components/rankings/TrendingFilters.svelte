<script lang="ts">
	import Dropdown from '$lib/components/ui/Dropdown.svelte';
	import { RANKING_LANGUAGES } from '$lib/types/rankings';

	interface Props {
		language: string;
		onchange: (value: string) => void;
	}

	let { language, onchange }: Props = $props();

	const options = [
		{ value: '', label: 'All Languages' },
		...RANKING_LANGUAGES.map((lang) => ({ value: lang, label: lang }))
	];
</script>

<div class="flex items-center gap-2">
	<span class="text-sm text-[var(--color-text-secondary)]">Language:</span>
	<Dropdown {options} value={language} placeholder="All Languages" {onchange} class="w-40" />
</div>
