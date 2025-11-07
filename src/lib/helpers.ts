/**
 * Get debounce async function wrapper. Returned promise is rejected if new call is within timeoutMs, otherwise resolved with func() call after timeoutMs.
 * @param {T} func target function
 * @param {number} timeoutMs debounce timeout in ms
 * @returns {(...args: Parameters<T>) => Promise<ReturnType<T>>} wrapper promise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  timeoutMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: NodeJS.Timeout | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rejectPrevious: ((reason?: any) => void) | undefined;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Отменяем предыдущий таймер и промис
    if (timer) {
      clearTimeout(timer);
    }
    if (rejectPrevious) {
      rejectPrevious('Debounce cancelled');
    }

    return new Promise<ReturnType<T>>((resolve, reject) => {
      rejectPrevious = reject;

      timer = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          rejectPrevious = undefined;
          timer = undefined;
        }
      }, timeoutMs);
    });
  };
}
