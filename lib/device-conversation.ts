export const TEMPORARY_STATE_KEY = "misaki-temporary-state-v1";
export const DEVICE_USER_KEY = "misaki-device-user-id";
export const EMAIL_SAVE_USER_KEY = "misaki-email-save-user-id";

export function clearMisakiDeviceData() {
  for (const storage of [localStorage, sessionStorage]) {
    for (let i = storage.length - 1; i >= 0; i -= 1) {
      const key = storage.key(i);
      if (key?.startsWith("misaki-")) storage.removeItem(key);
    }
  }
}

export function bindDeviceUser(userId: string) {
  const owner = localStorage.getItem(DEVICE_USER_KEY);
  if (owner && owner !== userId) clearMisakiDeviceData();
  localStorage.setItem(DEVICE_USER_KEY, userId);
}

export function readDeviceArray(key: string): unknown[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error("Invalid conversation cache.");
  return value;
}
