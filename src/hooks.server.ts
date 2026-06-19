import { redirect, type Handle } from '@sveltejs/kit';

// Trending, Rankings and the Globe moved under /explore. Permanently redirect the
// old top-level URLs (and bare /explore) so bookmarks, backlinks and search engines
// follow to the new locations. Query strings are preserved.
const REDIRECTS: Record<string, string> = {
	'/trending': '/explore/trending',
	'/rankings': '/explore/rankings',
	'/globe': '/explore/globe',
	'/explore': '/explore/trending'
};

export const handle: Handle = async ({ event, resolve }) => {
	const to = REDIRECTS[event.url.pathname];
	if (to) {
		redirect(308, to + event.url.search);
	}
	return resolve(event);
};
