import { GITHUB_API_URL } from '$lib/constants';

const CACHE_KEY = 'github-stars-v1';
const TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
	count: number;
	expires: number;
}

class GithubStarsState {
	count = $state<number | null>(null);
	#initialized = false;

	init() {
		if (this.#initialized || typeof window === 'undefined') return;
		this.#initialized = true;

		let isFresh = false;
		try {
			const raw = localStorage.getItem(CACHE_KEY);
			if (raw) {
				const cached = JSON.parse(raw) as CacheEntry;
				if (typeof cached.count === 'number' && typeof cached.expires === 'number') {
					this.count = cached.count;
					isFresh = cached.expires > Date.now();
				}
			}
		} catch {
			/* */
		}

		if (isFresh) return;

		fetch(GITHUB_API_URL)
			.then((res) => res.json())
			.then((data) => {
				if (typeof data.stargazers_count !== 'number') return;
				if (this.count !== data.stargazers_count) {
					this.count = data.stargazers_count;
				}
				try {
					localStorage.setItem(
						CACHE_KEY,
						JSON.stringify({
							count: data.stargazers_count,
							expires: Date.now() + TTL_MS
						} satisfies CacheEntry)
					);
				} catch {
					/* */
				}
			})
			.catch(() => {
				/* */
			});
	}
}

export const githubStarsState = new GithubStarsState();
