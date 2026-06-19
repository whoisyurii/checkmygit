<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { REPO_URL } from '$lib/constants';
</script>

<svelte:head>
	<title>About - CheckMyGit</title>
	<meta
		name="description"
		content="Learn about CheckMyGit - a free, open-source tool to generate beautiful portfolio pages from your GitHub profile."
	/>
</svelte:head>

<Header />

<main class="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
	<article class="space-y-12">
		<!-- Header -->
		<header class="border-b border-border-default pb-8">
			<h1 class="text-3xl font-bold text-text-primary sm:text-4xl">About CheckMyGit</h1>
			<p class="mt-4 text-lg text-text-secondary">
				Generate beautiful portfolio pages from your GitHub profile in seconds.
			</p>
		</header>

		<!-- What is CheckMyGit -->
		<section class="space-y-4">
			<h2 class="text-xl font-semibold text-text-primary">What is CheckMyGit?</h2>
			<p class="leading-relaxed text-text-secondary">
				CheckMyGit is a free, open-source tool that transforms your GitHub profile into a
				stunning portfolio page. Simply enter your GitHub username, and we'll automatically
				generate a beautiful showcase of your projects, contributions, and coding activity.
			</p>
			<p class="leading-relaxed text-text-secondary">
				Whether you're a developer looking to share your work, a hiring manager reviewing
				candidates, or just curious about someone's GitHub presence, CheckMyGit makes it easy
				to visualize and share GitHub profiles.
			</p>
		</section>

		<!-- How it works -->
		<section class="space-y-4">
			<h2 class="text-xl font-semibold text-text-primary">How it works</h2>
			<ol class="list-inside list-decimal space-y-3 text-text-secondary">
				<li class="leading-relaxed">
					<span class="text-text-primary">Enter a GitHub username</span> - Type any public GitHub
					username into the search bar
				</li>
				<li class="leading-relaxed">
					<span class="text-text-primary">We fetch the data</span> - CheckMyGit retrieves
					public profile information, repositories, and contribution data from GitHub's API
				</li>
				<li class="leading-relaxed">
					<span class="text-text-primary">Choose your template</span> - Select from multiple
					portfolio templates including GitHub-style, Bento grid, and Minimal layouts
				</li>
				<li class="leading-relaxed">
					<span class="text-text-primary">Share or export</span> - Copy the shareable link or
					export your portfolio as an image
				</li>
			</ol>
		</section>

		<!-- Features -->
		<section class="space-y-4">
			<h2 class="text-xl font-semibold text-text-primary">Features</h2>
			<ul class="space-y-3 text-text-secondary">
				<li class="flex items-start gap-3">
					<span class="mt-1 text-accent">&#10003;</span>
					<span><span class="text-text-primary">Multiple templates</span> - Choose from GitHub, Bento, or Minimal layouts</span>
				</li>
				<li class="flex items-start gap-3">
					<span class="mt-1 text-accent">&#10003;</span>
					<span><span class="text-text-primary">Contribution graph</span> - Visual representation of coding activity</span>
				</li>
				<li class="flex items-start gap-3">
					<span class="mt-1 text-accent">&#10003;</span>
					<span><span class="text-text-primary">Language breakdown</span> - See programming language distribution</span>
				</li>
				<li class="flex items-start gap-3">
					<span class="mt-1 text-accent">&#10003;</span>
					<span><span class="text-text-primary">Project showcase</span> - Highlight top repositories with stars and descriptions</span>
				</li>
				<li class="flex items-start gap-3">
					<span class="mt-1 text-accent">&#10003;</span>
					<span><span class="text-text-primary">Export as image</span> - Download your portfolio as a PNG</span>
				</li>
				<li class="flex items-start gap-3">
					<span class="mt-1 text-accent">&#10003;</span>
					<span><span class="text-text-primary">Shareable links</span> - Unique URLs for each profile</span>
				</li>
			</ul>
		</section>

		<!-- Open Source -->
		<section class="space-y-4">
			<h2 class="text-xl font-semibold text-text-primary">Open Source</h2>
			<p class="leading-relaxed text-text-secondary">
				CheckMyGit is completely open source. We believe in transparency and community-driven
				development. You can view, fork, and contribute to the source code on GitHub.
			</p>
			<p class="leading-relaxed text-text-secondary">
				Found a bug or have a feature request? We welcome contributions and feedback from the
				community.
			</p>
			<a
				href={REPO_URL}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 text-accent-blue transition-colors hover:underline"
			>
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
					/>
				</svg>
				View on GitHub
			</a>
		</section>

		<!-- Contact -->
		<section class="space-y-4 border-t border-border-default pt-8">
			<h2 class="text-xl font-semibold text-text-primary">Questions?</h2>
			<p class="leading-relaxed text-text-secondary">
				If you have questions, suggestions, or feedback, feel free to open an issue on our
				GitHub repository or reach out through the links in the footer.
			</p>
		</section>
	</article>
</main>

<Footer />
