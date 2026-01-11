<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<thead class="[&_tr]:border-b border-[var(--color-border-default)] {className}">
	{@render children()}
</thead>
