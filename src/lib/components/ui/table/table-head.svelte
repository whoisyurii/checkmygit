<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<th class="h-10 px-3 text-left align-middle font-medium text-[var(--color-text-secondary)] [&:has([role=checkbox])]:pr-0 {className}">
	{@render children()}
</th>
