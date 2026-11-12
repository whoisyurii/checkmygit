<script lang="ts">
	import { navigationState } from '$lib/stores/navigation.svelte';
	import { reveal } from '$lib/utils/reveal';
	import { githubAvatar } from '$lib/utils/github-transform';
	import { FEATURED_PROFILES } from '$lib/constants';

	async function handleProfileClick(username: string) {
		await navigationState.navigateToProfile(username);
	}
</script>

<section class="landing-container relative z-10 py-20 md:py-[120px]">
	<div use:reveal class="mb-12 max-w-[600px] md:mb-20">
		<h2 class="landing-heading">Featured profiles</h2>
		<p class="landing-body mt-2">See what CheckMyGit can do for these legends</p>
	</div>

	<div class="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
		{#each FEATURED_PROFILES as profile, i (profile.username)}
			<button
				type="button"
				use:reveal={{ y: 18, delay: i * 60 }}
				onclick={() => handleProfileClick(profile.username)}
				class="group flex min-w-0 cursor-pointer flex-col gap-3 rounded-xl border border-border-muted bg-bg-secondary p-6 text-left transition-colors hover:border-border-subtle md:p-10 lg:p-8"
			>
				<div class="flex items-center gap-4">
					<img
						src={githubAvatar(profile.username, 96)}
						alt={profile.name}
						width="48"
						height="48"
						loading="lazy"
						decoding="async"
						class="h-12 w-12 rounded-full border border-border-subtle bg-bg-tertiary"
					/>
					<h3 class="landing-subtitle min-w-0 truncate">{profile.name}</h3>
				</div>
				<p class="landing-body">{profile.role}</p>

				<div
					class="mt-2 flex w-full items-center justify-between gap-3 rounded-[10px] border border-border-muted bg-text-primary/6 px-4 py-3.5 font-mono text-sm text-text-primary"
				>
					<span class="min-w-0 truncate">
						<span class="text-accent select-none">/</span>{profile.username}
					</span>
					<span
						class="shrink-0 font-sans text-xs text-text-tertiary transition-colors group-hover:text-text-primary"
					>
						Open
					</span>
				</div>
			</button>
		{/each}
	</div>
</section>
