import { GLOBAL_VIEW_KEY, GLOBAL_FLUSH_INTERVAL_MS, GLOBAL_BUFFER_CACHE_KEY } from './constants';
import { buildGlobalCacheKey, setCachedCount } from './cache';
import { kvReadWithRetry, type KV } from './retry';

type Caches = CacheStorage & { default: Cache };

// Pending global-view increments, held in the edge cache between flushes.
interface GlobalBuffer {
	delta: number;
	lastFlushAt: number; // Unix ms
}

async function readBuffer(caches: Caches): Promise<GlobalBuffer> {
	try {
		const res = await caches.default.match(new Request(GLOBAL_BUFFER_CACHE_KEY));
		if (res) {
			const data = (await res.json()) as Partial<GlobalBuffer>;
			if (typeof data.delta === 'number' && typeof data.lastFlushAt === 'number') {
				return { delta: data.delta, lastFlushAt: data.lastFlushAt };
			}
		}
	} catch {
		// fall through to an empty buffer
	}
	return { delta: 0, lastFlushAt: 0 };
}

async function writeBuffer(caches: Caches, buffer: GlobalBuffer): Promise<void> {
	try {
		const res = new Response(JSON.stringify(buffer), {
			headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
		});
		await caches.default.put(new Request(GLOBAL_BUFFER_CACHE_KEY), res);
	} catch {
		// best-effort: losing the buffer only drops a few buffered increments
	}
}

// Add `delta` to the durable global counter in KV and refresh its display cache.
// Reads first and skips the write if the read fails, so a transient error never
// clobbers the running total with a low value.
async function flushToKV(kv: KV, caches: Caches | undefined, delta: number): Promise<boolean> {
	let current: number | null = null;
	try {
		const value = await kvReadWithRetry(kv, GLOBAL_VIEW_KEY);
		current = value ? parseInt(value, 10) : 0;
	} catch (error) {
		console.error('Global counter read failed, skipping flush:', error);
	}
	// Read failed: report that nothing was written so the caller keeps the
	// buffered increments and retries, rather than dropping them.
	if (current === null || Number.isNaN(current)) return false;

	const next = current + delta;
	await kv.put(GLOBAL_VIEW_KEY, next.toString());

	if (caches) {
		await setCachedCount(caches, buildGlobalCacheKey(), { count: next, cachedAt: Date.now() });
	}
	return true;
}

// Record one global view. Buffers increments in the edge cache and only writes
// the single hot KV key at most once per GLOBAL_FLUSH_INTERVAL_MS, so it can't
// absorb the whole daily write budget. Best-effort — never throws.
//
// Trade-offs (acceptable for a vanity total): the edge cache is per-colo and
// evictable, so the buffer is approximate and the displayed total can lag by up
// to the flush interval.
export async function recordGlobalView(options: {
	kv: KV;
	caches?: Caches;
	waitUntil?: (promise: Promise<unknown>) => void;
}): Promise<void> {
	const { kv, caches, waitUntil } = options;

	// No edge cache available: fall back to a direct write so the counter still
	// advances (this is the original, un-debounced behaviour).
	if (!caches) {
		try {
			await flushToKV(kv, undefined, 1);
		} catch (error) {
			console.error('Global counter write failed:', error);
		}
		return;
	}

	try {
		const buffer = await readBuffer(caches);
		const delta = buffer.delta + 1;
		const now = Date.now();

		if (now - buffer.lastFlushAt >= GLOBAL_FLUSH_INTERVAL_MS) {
			const flush = flushToKV(kv, caches, delta)
				.then((written) =>
					// Reset only once the write lands; otherwise keep the buffered
					// increments and the old timestamp so the next view retries.
					writeBuffer(
						caches,
						written ? { delta: 0, lastFlushAt: now } : { delta, lastFlushAt: buffer.lastFlushAt }
					)
				)
				.catch((error) => console.error('Global counter flush failed:', error));

			if (waitUntil) waitUntil(flush);
			else await flush;
		} else {
			// Within the window: accumulate in the cache, no KV write.
			await writeBuffer(caches, { delta, lastFlushAt: buffer.lastFlushAt });
		}
	} catch (error) {
		console.error('recordGlobalView failed:', error);
	}
}
