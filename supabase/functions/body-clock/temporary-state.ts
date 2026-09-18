// Shares the authenticated token format with lib/canonical-state.ts.
// Shared roots and replay receipts are authenticated by server writers only.
export async function openTemporaryReceipt(token: unknown, serviceKey: string) {
  if (typeof token !== "string" || token.length > 512_000) return null;
  try {
    const bytes = Uint8Array.from(atob(token.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`misaki-temporary-state-v1:${serviceKey}`));
    const key = await crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["decrypt"]);
    const ciphertext = new Uint8Array(bytes.length - 12);
    ciphertext.set(bytes.subarray(28));
    ciphertext.set(bytes.subarray(12, 28), bytes.length - 28);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.subarray(0, 12), tagLength: 128 }, key, ciphertext);
    const payload = JSON.parse(new TextDecoder().decode(plain));
    if (!Number.isFinite(payload.expires) || payload.expires <= Date.now()) return null;
    return payload.state as { history: unknown; memory: unknown; todayMemory: { date: string; items: string[] }; relationshipPoints: number };
  } catch {
    return null;
  }
}

export async function sealTemporaryRoot(state: unknown, serviceKey: string, expiresAt: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`misaki-temporary-state-v1:${serviceKey}`));
  const key = await crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt"]);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key,
    new TextEncoder().encode(JSON.stringify({ state, requestId: "body-clock", expires: Date.parse(expiresAt) }))));
  const bytes = new Uint8Array(28 + encrypted.length - 16);
  bytes.set(iv);
  bytes.set(encrypted.subarray(encrypted.length - 16), 12);
  bytes.set(encrypted.subarray(0, encrypted.length - 16), 28);
  // Avoid spread limits when the bounded conversation contains large text.
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
