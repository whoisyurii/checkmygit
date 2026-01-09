// Navigation loading state using Svelte 5 runes
import { goto } from '$app/navigation';

class NavigationState {
	isLoading = $state(false);
	targetUsername = $state<string | null>(null);
	phase = $state<'idle' | 'exiting' | 'loading' | 'entering'>('idle');

	async navigateToProfile(username: string) {
		if (this.isLoading) return;

		this.targetUsername = username;
		this.isLoading = true;
		this.phase = 'exiting';

		// Wait for exit animation to complete
		await new Promise((resolve) => setTimeout(resolve, 500));

		this.phase = 'loading';

		// Navigate to the profile page
		await goto(`/${username.trim()}`);
	}

	profileLoaded() {
		if (this.phase === 'loading' || this.phase === 'exiting') {
			this.phase = 'entering';

			// Reset after enter animation completes
			setTimeout(() => {
				this.phase = 'idle';
				this.isLoading = false;
				this.targetUsername = null;
			}, 800);
		}
	}


	reset() {
		this.isLoading = false;
		this.targetUsername = null;
		this.phase = 'idle';
	}
}

export const navigationState = new NavigationState();
