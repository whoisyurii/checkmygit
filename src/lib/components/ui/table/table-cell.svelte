<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<td class="p-3 align-middle text-[var(--color-text-primary)] [&:has([role=checkbox])]:pr-0 {className}">
	{@render children()}
</td>
