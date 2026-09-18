// Shares the authenticated token format with lib/canonical-state.ts.
// Only encrypted receipts written by the server's successful-turn RPC qualify.
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
    if (!Number.isFinite(payload.expires) || payload.expires <= Date.now() || !payload.result) return null;
    return payload.state as { history: unknown; memory: unknown; relationshipPoints: number };
  } catch {
    return null;
  }
}
