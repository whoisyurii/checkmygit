<script lang="ts">
	interface Props {
		variant?: 'text' | 'circular' | 'rectangular';
		width?: string;
		height?: string;
		class?: string;
	}

	let {
		variant = 'text',
		width,
		height,
		class: className = ''
	}: Props = $props();

	const variantClasses = {
		text: 'h-4 w-full rounded',
		circular: 'rounded-full',
		rectangular: 'rounded-md'
	};
</script>

<div
	class="skeleton-shimmer {variantClasses[variant]} {className}"
	style="{width ? `width: ${width};` : ''} {height ? `height: ${height};` : ''}"
></div>

<style>
	.skeleton-shimmer {
		background: linear-gradient(
			90deg,
			var(--color-bg-tertiary) 0%,
			var(--color-bg-secondary) 50%,
			var(--color-bg-tertiary) 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
