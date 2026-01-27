import { DEDUP_COOKIE_NAME, DEDUP_WINDOW_MS, MAX_TRACKED_PROFILES } from './constants';
import type { SeenProfile, CookieAccessor } from './types';
import { createHmac } from 'crypto'; // NEW
import { IP_HASH_SECRET } from '$env/static/private'; // NEW

export function parseSeenCookie(cookieValue: string | undefined): SeenProfile[] {
	if (!cookieValue) return [];

	try {
		const decoded = atob(cookieValue);
		const entries = decoded.split(',').filter(Boolean);

		return entries
			.map((entry) => {
				const [username, timestampStr] = entry.split(':');
				return {
					username: username.toLowerCase(),
					timestamp: parseInt(timestampStr, 10)
				};
			})
			.filter((entry) => !isNaN(entry.timestamp) && entry.username);
	} catch {
		// Invalid cookie, return empty
		return [];
	}
}

// check if a view should be counted (not seen within dedup window)
export function shouldCountView(seen: SeenProfile[], username: string): boolean {
	const normalizedUsername = username.toLowerCase();
	const nowSeconds = Math.floor(Date.now() / 1000);

	const existingEntry = seen.find((s) => s.username === normalizedUsername);

	if (!existingEntry) return true;

	// Check if dedup window has passed
	const timeSinceViewMs = (nowSeconds - existingEntry.timestamp) * 1000;
	return timeSinceViewMs >= DEDUP_WINDOW_MS;
}

// Update the seen profiles list with a new view
// Returns the new cookie value (base64 encoded)
export function updateSeenCookie(seen: SeenProfile[], username: string): string {
	const normalizedUsername = username.toLowerCase();
	const nowSeconds = Math.floor(Date.now() / 1000);

	// Remove expired entries and the current username (will re-add with new timestamp)
	const filtered = seen.filter((s) => {
		if (s.username === normalizedUsername) return false;

		// Remove entries older than dedup window
		const ageMs = (nowSeconds - s.timestamp) * 1000;
		return ageMs < DEDUP_WINDOW_MS;
	});

	// Add current username at the front
	filtered.unshift({ username: normalizedUsername, timestamp: nowSeconds });

	// Limit to max tracked profiles (keep most recent)
	const limited = filtered.slice(0, MAX_TRACKED_PROFILES);

	// Encode as base64
	const encoded = limited.map((s) => `${s.username}:${s.timestamp}`).join(',');
	return btoa(encoded);
}

// Get the cookie name for deduplication
export function getCookieName(): string {
	return DEDUP_COOKIE_NAME;
}

// Handle deduplication check and cookie update
// Returns whether the view should be counted
// This function is designed to be safe - errors are caught and logged
export function handleDeduplication(
	cookies: CookieAccessor,
	username: string
): { shouldCount: boolean } {
	try {
		const cookieValue = cookies.get(DEDUP_COOKIE_NAME);
		const seen = parseSeenCookie(cookieValue);
		const shouldCount = shouldCountView(seen, username);

		if (shouldCount) {
			try {
				const newCookieValue = updateSeenCookie(seen, username);
				cookies.set(DEDUP_COOKIE_NAME, newCookieValue, {
					path: '/',
					maxAge: 86400, // 24 hours
					httpOnly: true,
					sameSite: 'lax'
				});
			} catch (err) {
				// Cookie set failed - still count the view, just won't dedupe next time
				console.error('Failed to set dedup cookie:', err);
			}
		}

		return { shouldCount };
	} catch (err) {
		// Any error in dedup logic - default to counting the view
		console.error('Deduplication error:', err);
		return { shouldCount: true };
	}
}

const SECRET_MIN_LENGTH = 32; // Enforce strong secrets
// --- NEW ADDITION ---
// Generate a secure hash of the IP address for privacy-preserving deduplication
export function getIpHash(ip: string): string {
	if (!IP_HASH_SECRET || IP_HASH_SECRET.length < SECRET_MIN_LENGTH) {
		throw new Error(
			`IP_HASH_SECRET is not configured or is too short (min ${SECRET_MIN_LENGTH} chars).`
		);
	}
	// Handle empty IP (Upstream logic in view-counter.ts should prevent this, but good to be safe)
	if (!ip) return '';
	return createHmac('sha256', IP_HASH_SECRET).update(ip).digest('hex');
}
