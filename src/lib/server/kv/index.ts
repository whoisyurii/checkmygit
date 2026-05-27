// KV optimization module for view counting
// Provides caching, deduplication, and 429 error handling

export { getProfileViews, recordProfileView, getGlobalViewCount } from './view-counter';
export type { ViewCountResult, CookieAccessor } from './types';
