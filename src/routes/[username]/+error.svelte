<script lang="ts">
	import { page } from '$app/stores';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';

	const statusMessages: Record<number, { title: string; description: string }> = {
		404: {
			title: 'User not found',
			description: "The GitHub user you're looking for doesn't exist or has been deleted."
		},
		429: {
			title: 'Rate limit exceeded',
			description: "We've hit GitHub's API rate limit. Please try again in a few minutes."
		},
		500: {
			title: 'Something went wrong',
			description: 'An error occurred while fetching the profile. Please try again.'
		}
	};

	const status = $derived($page.status);
	// Statuses without copy of their own show what the server said
	const message = $derived(
		statusMessages[status] ?? {
			...statusMessages[500],
			description: $page.error?.message || statusMessages[500].description
		}
	);
</script>

<svelte:head>
	<title>{status} - CheckMyGit</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<Header overlay />

<main>
	<ErrorState {status} {...message} retry={status !== 404} />
</main>

<Footer />
