/**
 * Performance utilities for debouncing and throttling
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns The debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle
 * @returns The throttled function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastRan: number = 0;

  return function throttled(...args: Parameters<T>): void {
    const now = Date.now();

    if (!lastRan) {
      func(...args);
      lastRan = now;
    } else {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        if (now - lastRan >= wait) {
          func(...args);
          lastRan = now;
        }
        timeoutId = null;
      }, wait - (now - lastRan));
    }
  };
}

/**
 * Rate limiter class to limit function calls
 */
export class RateLimiter {
  private queue: number[] = [];
  private maxCalls: number;
  private timeWindow: number;

  /**
   * Creates a new RateLimiter
   * @param maxCalls - Maximum number of calls allowed
   * @param timeWindow - Time window in milliseconds
   */
  constructor(maxCalls: number, timeWindow: number) {
    this.maxCalls = maxCalls;
    this.timeWindow = timeWindow;
  }

  /**
   * Checks if an action is allowed based on rate limit
   * @returns true if action is allowed, false otherwise
   */
  public tryAcquire(): boolean {
    const now = Date.now();

    // Remove timestamps outside the time window
    this.queue = this.queue.filter(timestamp => now - timestamp < this.timeWindow);

    if (this.queue.length < this.maxCalls) {
      this.queue.push(now);
      return true;
    }

    return false;
  }

  /**
   * Gets the time to wait before next call is allowed (in milliseconds)
   * @returns milliseconds to wait, or 0 if call is allowed
   */
  public getWaitTime(): number {
    if (this.queue.length < this.maxCalls) {
      return 0;
    }

    const oldestTimestamp = this.queue[0];
    const now = Date.now();
    const elapsed = now - oldestTimestamp;

    return Math.max(0, this.timeWindow - elapsed);
  }

  /**
   * Resets the rate limiter
   */
  public reset(): void {
    this.queue = [];
  }
}
