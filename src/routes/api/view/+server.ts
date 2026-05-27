import type { RequestHandler } from './$types';
import { recordProfileView } from '$lib/server/kv';

// GitHub usernames: 1–39 chars, alphanumeric with single internal hyphens, no
// leading/trailing hyphen. Validating here stops the public beacon from being
// used to create arbitrary KV keys.
const USERNAME_RE = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

// Records a single profile view. Fired as a fire-and-forget beacon from the
// profile page after it loads in a real browser, which keeps crawlers (no JS)
// off the KV write path.
export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	let username: unknown;
	try {
		const body = (await request.json()) as { username?: unknown };
		username = body?.username;
	} catch {
		return new Response(null, { status: 400 });
	}

	if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
		return new Response(null, { status: 400 });
	}

	await recordProfileView({
		platform,
		username,
		cookies: {
			get: (name) => cookies.get(name),
			set: (name, value, opts) => cookies.set(name, value, opts)
		}
	});

	return new Response(null, { status: 204 });
};
