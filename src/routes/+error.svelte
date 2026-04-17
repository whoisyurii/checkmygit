<script lang="ts">
	import { page } from '$app/stores';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	const statusMessages: Record<number, { title: string; description: string }> = {
		404: {
			title: 'Page not found',
			description: "The page you're looking for doesn't exist or has moved."
		},
		500: {
			title: 'Something went wrong',
			description: 'An unexpected error occurred. Please try again.'
		}
	};

	const status = $derived($page.status);
	const message = $derived(statusMessages[status] ?? statusMessages[500]);
</script>

<svelte:head>
	<title>{status} - CheckMyGit</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<Header />

<main class="flex min-h-[60vh] items-center justify-center px-4">
	<Card variant="default" padding="lg" class="max-w-md text-center">
		<div class="mb-4 text-6xl font-bold text-text-tertiary">
			{status}
		</div>
		<h1 class="text-xl font-semibold text-text-primary">
			{message.title}
		</h1>
		<p class="mt-2 text-text-secondary">
			{$page.error?.message || message.description}
		</p>
		<div class="mt-6 flex justify-center gap-3">
			<Button variant="primary" href="/">Go Home</Button>
		</div>
	</Card>
</main>

<Footer />
