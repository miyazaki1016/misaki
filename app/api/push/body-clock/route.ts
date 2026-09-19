import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { admitOperation, operationHeaders, progressOperation, maintenanceResponse, type LegacyOperation } from '../../../../lib/legacy-drain';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// A signed delivery ID authorizes only a persisted body-clock notification.
// The VAPID private key stays in Vercel and is never returned or copied.
export async function POST(request: Request) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return Response.json({ error: "admin_config_missing" }, { status: 503 });
  const timestamp = request.headers.get("x-body-clock-time") || "";
  const signature = request.headers.get("x-body-clock-signature") || "";
  if (!/^\d{13}$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > 300000 || !/^[a-f0-9]{64}$/.test(signature)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const deliveryId = body?.deliveryId;
  if (typeof deliveryId !== "string" || (deliveryId !== "health" && !/^[a-f0-9-]{36}$/i.test(deliveryId))) {
    return Response.json({ error: "invalid_delivery" }, { status: 400 });
  }
  let db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tzozajnwznxqgxnjikoy.supabase.co", key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) },
  });
  const { data: signed, error: signError } = await db.rpc("sign_misaki_body_clock_relay", { p_timestamp: timestamp, p_delivery_id: deliveryId });
  if (signError || typeof signed !== "string" || !/^[a-f0-9]{64}$/.test(signed)) {
    return Response.json({ error: "relay_auth_unavailable" }, { status: 503 });
  }
  const expected = Buffer.from(signed, "hex");
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return Response.json({ error: "vapid_missing" }, { status: 503 });
  if (deliveryId === "health") return Response.json({ ok: true, vapid: true });

  let operation: LegacyOperation;
  let ownedOperation = false;
  let operationDone = false;
  const parentId = request.headers.get('x-misaki-operation');
  const parentCapability = request.headers.get('x-misaki-capability');
  if (parentId && parentCapability) {
    operation = { id: parentId, capability: parentCapability, trackingKey: '' };
    // The DB guard validates capability and unresolved state. The Edge batch
    // owns finalization and remains unresolved until this HTTP call completes.
  } else {
    try { operation = await admitOperation('relay', null); ownedOperation = true; }
    catch { return maintenanceResponse(); }
  }
  db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tzozajnwznxqgxnjikoy.supabase.co', key, {
    global: { headers: operationHeaders(operation), fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: delivery, error } = await db.from("misaki_proactive_deliveries")
      .select("id,user_id,message,photo_context,delivered_at,status").eq("id", deliveryId).single();
    if (error || !delivery || delivery.photo_context?.source !== "body_clock" || delivery.status !== "delivered") {
      return Response.json({ error: "delivery_not_found" }, { status: 404 });
    }
    if (!delivery.delivered_at || Date.now() - Date.parse(delivery.delivered_at) > 3600000) {
      return Response.json({ error: "delivery_expired" }, { status: 409 });
    }
    const { data: state, error: stateError } = await db.from("background_push_state")
      .select("notifications_enabled").eq("user_id", delivery.user_id).single();
    if (stateError) throw new Error("state_lookup_failed");
    if (!state.notifications_enabled) {
      if (ownedOperation) operationDone = await progressOperation(operation, 'succeeded');
      return Response.json({ sent: 0, removed: 0, failed: 0, skipped: "notifications_disabled" });
    }
    const { data: subscriptions, error: subsError } = await db.from("push_subscriptions")
      .select("id,endpoint,p256dh,auth").eq("user_id", delivery.user_id);
    if (subsError) throw new Error("subscription_lookup_failed");

    // A primary key permits at most one send attempt per delivery, including replays.
    const { error: claimError } = await db.from("misaki_body_clock_push_attempts").insert({ delivery_id: deliveryId });
    if (claimError?.code === "23505") {
      if (ownedOperation) operationDone = await progressOperation(operation, 'succeeded');
      return Response.json({ sent: 0, removed: 0, failed: 0, skipped: "already_attempted" });
    }
    if (claimError) throw new Error("push_claim_failed");
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:misaki@example.com", publicKey, privateKey);
    const payload = JSON.stringify({ title: "美咲", body: delivery.message, url: "/chat" });
    let sent = 0, removed = 0, failed = 0;
    let uncertainWrite = false;
    await Promise.all((subscriptions || []).map(async (subscription) => {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 3600, timeout: 10000 });
        sent++;
        const written = await db.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", subscription.id);
        if (written.error) uncertainWrite = true;
      } catch (e: unknown) {
        const status = Number((e as { statusCode?: number })?.statusCode);
        if (status === 404 || status === 410) {
          removed++;
          const deleted = await db.from("push_subscriptions").delete().eq("id", subscription.id);
          if (deleted.error) uncertainWrite = true;
        } else { failed++; }
      }
    }));
    if (uncertainWrite) throw new Error('subscription_write_unresolved');
    const result = { sent, removed, failed, ...(!subscriptions?.length ? { skipped: "no_subscription" } : {}) };
    const { error: logError } = await db.from("misaki_body_clock_push_attempts")
      .update({ completed_at: new Date().toISOString(), result }).eq("delivery_id", deliveryId);
    if (logError) throw new Error("push_result_save_failed");
    if (ownedOperation) operationDone = await progressOperation(operation, failed ? 'unknown' : 'succeeded');
    return Response.json(result, { status: failed ? 502 : 200 });
  } catch {
    return Response.json({ error: "push_relay_failed" }, { status: 500 });
  } finally {
    if (ownedOperation && !operationDone) await progressOperation(operation, 'unknown');
  }
}
