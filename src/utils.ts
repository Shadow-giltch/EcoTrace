/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useCallback } from "react";

/**
 * Reusable debounce hook for slider inputs to prevent unbounded recalculation.
 */
export function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  const timer = useRef<NodeJS.Timeout | null>(null);

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay]);

  return debouncedFn;
}

/**
 * HTML-escaping sanitization utility as a security layer for user inputs.
 */
export function sanitize(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Custom light performance profiler helper.
 */
export function measurePerf(label: string, action: () => void): number {
  const t0 = performance.now();
  action();
  const dur = performance.now() - t0;
  console.debug(`[Perf] ${label} completed in ${dur.toFixed(2)}ms`);
  return dur;
}
