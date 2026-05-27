// Cookie configuration for visitor deduplication
export const DEDUP_COOKIE_NAME = 'pv_seen';
export const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_TRACKED_PROFILES = 50;

// Cache configuration - reduces KV reads significantly
export const CACHE_TTL_SECONDS = 600; // 10 minutes
export const CACHE_KEY_PREFIX = 'https://kv-cache/_/views/';
export const STALE_CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour - max age for stale cache fallback

// KV keys
export const GLOBAL_VIEW_KEY = 'global:total_portfolios';

// Global counter write-coalescing: the global key is touched by every counted
// view, so we buffer increments in the edge cache and flush to KV at most once
// per interval. This stops one hot key from draining the daily write quota; a
// vanity total tolerates the resulting sub-minute lag.
export const GLOBAL_FLUSH_INTERVAL_MS = 60 * 1000; // 1 minute
export const GLOBAL_BUFFER_CACHE_KEY = 'https://kv-cache/_/global-view-buffer';

// Retry configuration for KV operations (handles transient errors)
export const DEFAULT_KV_RETRY_OPTIONS = {
	maxRetries: 1,
	retryDelayMs: 50,
	backoffMultiplier: 2
};

// Local dev fallback values
export const DEV_PROFILE_VIEWS = 42;
export const DEV_GLOBAL_VIEWS = 1234;

// Fallback when KV is unavailable - shows 1 (current user is viewing)
export const FALLBACK_VIEW_COUNT = 1;
