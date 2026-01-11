<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<tfoot class="border-t border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] font-medium {className}">
	{@render children()}
</tfoot>
