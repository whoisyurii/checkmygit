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
