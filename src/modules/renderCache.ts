
export type CacheStats = {
  hits: number; // number of times a cache entry was successfully retrieved
  misses: number; // number of times a cache entry was not found
  size: number; // current number of entries in the cache
};

const cache = new Map<string, string>();
let hits = 0; //successful retrievals from the cache
let misses = 0;// how many failed retrievals from the cache


export function buildCacheKey( // create a key for the cache based on the id,version and imputs
  templateId: string,
  version: number,
  inputs: Record<string, unknown>
): string {
  const sortedInputs = Object.fromEntries(
    Object.entries(inputs).sort(([a], [b]) => a.localeCompare(b)) // sort the inputs by key to ensure that the same inputs in different order produce the same cache key, we convert the inputs object to an array of [key, value] pairs
  );
  return `${templateId}@${version}|${JSON.stringify(sortedInputs)}`;
}

export function getCached(key: string): string | undefined {
  const value = cache.get(key);
  if (value !== undefined) {
    hits++;
    return value;
  }
  misses++;
  return undefined;
}

export function setCached(key: string, output: string): void { // safe the render output in the cache
  cache.set(key, output);
}

export function clearCache(): void { //clean iremove all entries from the cache and reset the hit/miss counters
  cache.clear();
  hits = 0;
  misses = 0;
}

export function getCacheStats(): CacheStats { // Returns current hit/miss/size statistics.
  return { hits, misses, size: cache.size };
}
