<script lang="ts" module>
	let counter = 0;
	function nextGradId() {
		counter += 1;
		return `fire-grad-${counter}`;
	}
</script>

<script lang="ts">
	interface Props {
		size?: number | string;
		class?: string;
		animated?: boolean;
	}

	let { size = 20, class: className = '', animated = true }: Props = $props();

	const dim = $derived(typeof size === 'number' ? `${size}px` : size);
	const gradId = nextGradId();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	width={dim}
	height={dim}
	class="fire-icon {animated ? 'fire-icon--animated' : ''} {className}"
	aria-hidden="true"
	focusable="false"
>
	<defs>
		<linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" stop-color="#fbbf24" />
			<stop offset="55%" stop-color="#f97316" />
			<stop offset="100%" stop-color="#ef4444" />
		</linearGradient>
	</defs>
	<path
		fill="url(#{gradId})"
		d="M13.5 1c.3 2.6-1.4 4.3-2.7 5.7C9.4 8.2 8 9.6 8 12c0 1.4.6 2.6 1.5 3.4-.4-.7-.6-1.5-.5-2.3.2-1.7 1.7-2.6 2.6-3.7.6 1.3 1.6 2 2.5 3 1 1.1 1.7 2.4 1.6 3.9 0 .3-.1.7-.2 1 1.5-.9 2.5-2.5 2.5-4.4 0-2.3-1.1-4.3-2.6-6C13.7 5.1 13.4 3.1 13.5 1zM10.5 17.5c0 1.4 1 2.5 2.3 2.7 1.6.3 3-.9 3.1-2.4.1-1-.4-1.9-1.2-2.5.1.5 0 1.1-.4 1.5-.5.6-1.4.6-2 .1-.5-.5-.6-1.3-.2-1.9-.9.5-1.6 1.4-1.6 2.5z"
	/>
</svg>

<style>
	.fire-icon {
		display: inline-block;
		flex-shrink: 0;
		transform-origin: center bottom;
		filter: drop-shadow(0 0 2px rgba(249, 115, 22, 0.35));
	}

	.fire-icon--animated {
		animation: flame-flicker 0.6s ease-in-out infinite alternate;
	}

	@keyframes flame-flicker {
		0% {
			transform: scale(1) rotate(0deg);
			opacity: 0.92;
		}
		50% {
			transform: scale(1.08) rotate(2deg);
			opacity: 1;
		}
		100% {
			transform: scale(1.04) rotate(-2deg);
			opacity: 0.96;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.fire-icon--animated {
			animation: none;
		}
	}
</style>
