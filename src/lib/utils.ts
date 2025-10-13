/**
 * Helper to explicitly mark a promise as deferred for SvelteKit load functions.
 * This prevents TypeScript from auto-unwrapping the Promise type in PageData.
 */
export function defer<T>(promise: Promise<T>): Promise<T> {
  return promise;
}
