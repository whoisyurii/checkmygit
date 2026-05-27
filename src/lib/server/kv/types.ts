/** Represents a profile that has been viewed by this visitor */
export interface SeenProfile {
	username: string;
	timestamp: number; // Unix seconds
}

/** Cached view count data stored in edge cache */
export interface CachedViewCount {
	count: number;
	cachedAt: number; // Unix milliseconds
}

/** Result from reading a view count */
export interface ViewCountResult {
	count: number;
	isStale: boolean;
	source: 'cache' | 'kv' | 'fallback';
}

/** Options for KV read operations with retry */
export interface KVRetryOptions {
	maxRetries: number;
	retryDelayMs: number;
	backoffMultiplier: number;
}

/** Cookie accessor interface for SvelteKit compatibility */
export interface CookieAccessor {
	get: (name: string) => string | undefined;
	set: (name: string, value: string, options: CookieOptions) => void;
}

/** Cookie options for set operation */
export interface CookieOptions {
	path?: string;
	maxAge?: number;
	httpOnly?: boolean;
	sameSite?: 'strict' | 'lax' | 'none';
	secure?: boolean;
}
