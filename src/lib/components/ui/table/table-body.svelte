<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<tbody class="[&_tr:last-child]:border-0 {className}">
	{@render children()}
</tbody>
