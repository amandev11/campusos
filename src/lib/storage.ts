/**
 * Namespaced, failure-tolerant localStorage access.
 *
 * The demo store is the only writer here. Reads never throw: a corrupt or
 * unavailable store degrades to in-memory state instead of breaking the app.
 */

const PREFIX = 'campusos.';

let memoryFallback = new Map<string, string>();
let available: boolean | null = null;

function canUseStorage(): boolean {
  if (available !== null) return available;
  try {
    const probe = `${PREFIX}probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

export function readKey<T>(key: string, fallback: T): T {
  const fullKey = PREFIX + key;
  try {
    const raw = canUseStorage() ? window.localStorage.getItem(fullKey) : memoryFallback.get(fullKey);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeKey<T>(key: string, value: T): void {
  const fullKey = PREFIX + key;
  const raw = JSON.stringify(value);
  try {
    if (canUseStorage()) {
      window.localStorage.setItem(fullKey, raw);
    } else {
      memoryFallback.set(fullKey, raw);
    }
  } catch {
    memoryFallback.set(fullKey, raw);
  }
}

export function removeKey(key: string): void {
  const fullKey = PREFIX + key;
  try {
    if (canUseStorage()) window.localStorage.removeItem(fullKey);
  } catch {
    /* ignore */
  }
  memoryFallback.delete(fullKey);
}

export function clearAll(): void {
  try {
    if (canUseStorage()) {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(PREFIX)) keys.push(key);
      }
      keys.forEach((key) => window.localStorage.removeItem(key));
    }
  } catch {
    /* ignore */
  }
  memoryFallback = new Map();
}

export function isPersistent(): boolean {
  return canUseStorage();
}
