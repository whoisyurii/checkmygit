<script lang="ts">
	interface Props {
		size?: number | string;
		class?: string;
	}

	let { size = 20, class: className = '' }: Props = $props();

	const dim = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	width={dim}
	height={dim}
	fill="none"
	stroke="currentColor"
	class="shrink-0 {className}"
	aria-hidden="true"
	focusable="false"
>
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width="2"
		d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
	/>
</svg>
