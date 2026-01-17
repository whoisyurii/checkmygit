<script lang="ts">
	import Button from './Button.svelte';
	import Skeleton from './Skeleton.svelte';

	interface Props {
		qrDataUrl: string;
		url: string;
		onClose: () => void;
		onDownload: () => void;
	}

	let { qrDataUrl, url, onClose, onDownload }: Props = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
	onclick={handleBackdropClick}
	role="dialog"
	aria-modal="true"
	aria-label="QR Code"
	tabindex="-1"
>
	<!-- Modal -->
	<div class="relative mx-4 min-w-80 rounded-lg border border-border-default bg-bg-primary p-6 shadow-xl">
		<!-- Close button -->
		<button
			onclick={onClose}
			class="absolute right-3 top-3 text-text-secondary transition-colors hover:text-text-primary"
			aria-label="Close"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>

		<!-- QR Code -->
		<div class="mt-4 text-center">
			<div class="inline-block rounded-lg bg-[#0d1117] p-2">
				{#if qrDataUrl}
					<img src={qrDataUrl} alt="QR Code for {url}" width="256" height="256" />
				{:else}
					<Skeleton variant="rectangular" width="256px" height="256px" />
				{/if}
			</div>

			<!-- URL -->
			<p class="mt-4 truncate text-sm text-text-secondary" title={url}>{url}</p>

			<!-- Download button -->
			<div class="mt-4">
				<Button variant="primary" onclick={onDownload}>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
					</svg>
					Download QR Code
				</Button>
			</div>
		</div>
	</div>
</div>
