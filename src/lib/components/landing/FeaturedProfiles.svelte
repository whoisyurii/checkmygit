<script lang="ts">
	import { navigationState } from '$lib/stores/navigation.svelte';

	const featuredProfiles = [
		{ username: 'torvalds', name: 'Linus Torvalds', role: 'Creator of Linux & Git' },
		{ username: 'rich-harris', name: 'Rich Harris', role: 'Creator of Svelte' },
		{ username: 'whoisyurii', name: 'Yurii', role: 'Full Stack Developer' }
	];

	async function handleProfileClick(username: string) {
		await navigationState.navigateToProfile(username);
	}
</script>

<section class="animate-fade-in-delay-3 relative z-10 border-t border-border-muted bg-bg-secondary py-24">
	<div class="mx-auto max-w-5xl px-6">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold text-text-primary">Featured Profiles</h2>
			<p class="text-text-secondary">See what CheckMyGit can do for these legends</p>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
			{#each featuredProfiles as profile}
				<button
					type="button"
					onclick={() => handleProfileClick(profile.username)}
					class="group relative overflow-hidden rounded-2xl border border-border-default bg-bg-tertiary p-6 text-left transition-all hover:border-border-highlight hover:shadow-xl cursor-pointer"
				>
					<div class="flex items-center gap-4">
						<div class="relative">
							<img
								src="https://github.com/{profile.username}.png"
								alt={profile.name}
								width="48"
								height="48"
								loading="lazy"
								decoding="async"
								class="h-12 w-12 rounded-full border border-border-subtle bg-bg-secondary"
							/>
							<div class="absolute -bottom-1 -right-1 rounded-full border-2 border-bg-tertiary bg-accent-green p-1"></div>
						</div>
						<div>
							<h3 class="font-semibold text-text-primary group-hover:text-accent-green">{profile.name}</h3>
							<p class="text-xs text-text-tertiary">@{profile.username}</p>
						</div>
					</div>
					<p class="mt-4 text-sm font-medium text-text-secondary">{profile.role}</p>
				</button>
			{/each}
		</div>
	</div>
</section>
