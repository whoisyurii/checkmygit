<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		// HTTP status, shown large above the title when there is one
		status?: number;
		title: string;
		description: string;
		// Offer a reload for failures that can pass on a second attempt
		retry?: boolean;
	}

	let { status, title, description, retry = false }: Props = $props();
</script>

<section class="relative overflow-hidden">
	<div
		class="landing-grid pointer-events-none absolute inset-0 hidden md:block"
		aria-hidden="true"
	></div>

	<div
		class="landing-container relative flex min-h-[calc(100svh-5.5rem)] flex-col items-center justify-center py-20 text-center"
	>
		{#if status}
			<p
				class="font-display text-[96px] leading-none tracking-tight text-text-primary/20 md:text-[144px]"
			>
				{status}
			</p>
		{/if}
		<h1 class="landing-heading mt-2">{title}</h1>
		<p class="landing-body mt-2 max-w-[30rem]">{description}</p>

		<div
			class="mt-8 flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto max-sm:[&>*]:w-full"
		>
			<Button variant="primary" size="pill" href={resolve('/')}>Back to home</Button>
			{#if retry}
				<Button variant="secondary" size="pill" onclick={() => window.location.reload()}>
					Try again
				</Button>
			{/if}
		</div>
	</div>
</section>
