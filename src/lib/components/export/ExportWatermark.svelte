<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<div class="absolute bottom-4 right-5 flex items-center gap-2 {className}">
	<!-- Logo: simplified version of favicon with dark green background -->
	<svg width="22" height="22" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect width="512" height="512" rx="96" fill="#041B11" />
		<path
			fill="white"
			fill-rule="evenodd"
			d="M256 89.6c-91.8 0-166.4 74.6-166.4 166.4 0 73.5 47.7 135.9 113.8 157.9 8.3 1.5 11.4-3.6 11.4-8 0-4-.1-17.1-.2-31-46.3 10.1-56.1-19.6-56.1-19.6-7.6-19.2-18.5-24.4-18.5-24.4-15.1-10.3 1.1-10.1 1.1-10.1 16.7 1.2 25.5 17.1 25.5 17.1 14.8 25.4 38.9 18.1 48.4 13.8 1.5-10.8 5.8-18.1 10.6-22.3-37-4.2-75.9-18.5-75.9-82.3 0-18.2 6.5-33 17.2-44.7-1.7-4.2-7.4-21.1 1.6-44 0 0 14-4.5 45.8 17.1 13.3-3.7 27.5-5.6 41.7-5.6 14.1.1 28.4 1.9 41.7 5.6 31.8-21.5 45.7-17.1 45.7-17.1 9.1 22.9 3.4 39.8 1.7 44 10.7 11.7 17.1 26.5 17.1 44.7 0 64-38.9 78-76 82.1 6 5.2 11.3 15.3 11.3 30.9 0 22.3-.2 40.2-.2 45.7 0 4.4 3 9.6 11.5 8 66-22.1 113.6-84.4 113.6-157.9 0-91.8-74.6-166.4-166.4-166.4z"
			clip-rule="evenodd"
		/>
	</svg>
	<span class="text-sm font-medium text-white/50">checkmygit.com</span>
</div>
