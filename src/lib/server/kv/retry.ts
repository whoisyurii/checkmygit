import { DEFAULT_KV_RETRY_OPTIONS } from './constants';
import type { KVRetryOptions } from './types';

// KV namespace type, derived from the platform binding
export type KV = App.Platform['env']['PROFILE_VIEWS'];

// check if an error is a rate limit (429) error
export function isRateLimitError(error: unknown): boolean {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		return msg.includes('429') || msg.includes('rate limit') || msg.includes('too many');
	}
	return false;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// read from KV with retry + exponential backoff on transient rate-limit errors
export async function kvReadWithRetry(
	kv: KV,
	key: string,
	options: KVRetryOptions = DEFAULT_KV_RETRY_OPTIONS
): Promise<string | null> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
		try {
			return await kv.get(key);
		} catch (error) {
			lastError = error as Error;

			if (!isRateLimitError(error) || attempt === options.maxRetries) {
				throw error;
			}

			const delay = options.retryDelayMs * Math.pow(options.backoffMultiplier, attempt);
			await sleep(delay);
		}
	}

	throw lastError;
}
