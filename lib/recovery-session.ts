// Tab-local pointer. A full navigation freezes the new scope before auth mounts.
const POINTER = 'misaki-active-recovery-scope-v1';
const valid = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9-]{36}$/.test(value);
export function readRecoveryScope(): string | null {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem(POINTER);
  if (value === null) return null;
  if (!valid(value)) throw new Error('Invalid recovery session scope');
  return value;
}
// Never change the mounted client's scope while requests are in flight.
export const recoveryScope = readRecoveryScope();
export function scopedStorage(storage: Storage, scope: string | null): Storage {
  const prefix = scope ? `recovery:${scope}:` : '';
  const keys = () => Array.from({length: storage.length}, (_, i) => storage.key(i)!).filter(k => prefix ? k.startsWith(prefix) : !k.startsWith('recovery:'));
  return {
    get length() { return keys().length; }, key: i => keys()[i]?.slice(prefix.length) ?? null,
    getItem: k => storage.getItem(prefix + k), setItem: (k,v) => storage.setItem(prefix+k,v),
    removeItem: k => storage.removeItem(prefix+k), clear: () => keys().forEach(k=>storage.removeItem(k)),
  };
}
function browserStorage(kind: 'localStorage' | 'sessionStorage'): Storage {
  // Lazy access allows SSR imports; scope remains fixed for this mounted module.
  return new Proxy({} as Storage, {get(_target, key) {
    const storage = scopedStorage(globalThis[kind], recoveryScope);
    const value = Reflect.get(storage, key);
    return typeof value === 'function' ? value.bind(storage) : value;
  }});
}
export const conversationLocalStorage = browserStorage('localStorage');
export const conversationSessionStorage = browserStorage('sessionStorage');
export function startIndependentRecovery(user: { is_anonymous?: boolean } | null, code: unknown, id: string) {
  if (user?.is_anonymous !== true || !['TEMPORARY_STATE_EXPIRED','TEMPORARY_STATE_UNVERIFIABLE'].includes(String(code)) || !valid(id)) {
    throw new Error('Explicit anonymous recovery required');
  }
  // No signOut, cache copy, root update, token import or old-key deletion.
  sessionStorage.setItem(POINTER, id);
}
