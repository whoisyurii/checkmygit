<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<caption class="mt-4 text-sm text-[var(--color-text-secondary)] {className}">
	{@render children()}
</caption>
