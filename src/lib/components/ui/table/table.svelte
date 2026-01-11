<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="relative w-full overflow-x-auto">
	<table class="w-full caption-bottom text-sm {className}">
		{@render children()}
	</table>
</div>
