import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readKey, writeKey } from '@/lib/storage';

/** Tailwind-aligned breakpoint helper. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/** Global keyboard shortcut with a `mod` helper for Cmd on macOS and Ctrl elsewhere. */
export function useHotkey(
  combo: { key: string; mod?: boolean; shift?: boolean },
  handler: (event: KeyboardEvent) => void,
  enabled = true,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      const modPressed = event.metaKey || event.ctrlKey;
      if (combo.mod && !modPressed) return;
      if (!combo.mod && modPressed) return;
      if (combo.shift && !event.shiftKey) return;
      if (event.key.toLowerCase() !== combo.key.toLowerCase()) return;
      handlerRef.current(event);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [combo.key, combo.mod, combo.shift, enabled]);
}

/** State mirrored into the namespaced local store. */
export function usePersistentState<T>(key: string, initial: T): [T, (value: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readKey<T>(key, initial));
  const set = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
        writeKey(key, resolved);
        return resolved;
      });
    },
    [key],
  );
  return [value, set];
}

export function useDebounced<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useOnClickOutside<T extends HTMLElement>(handler: () => void, enabled = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!enabled) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) handler();
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [handler, enabled]);
  return ref;
}

/** Counts down to a timestamp, ticking once a minute — used for deadlines. */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);
  return now;
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult> | TResult,
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      setPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Something went wrong.';
        setError(message);
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  return useMemo(() => ({ run, pending, error, clearError: () => setError(null) }), [run, pending, error]);
}
