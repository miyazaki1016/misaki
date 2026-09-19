import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type LegacyOperation = { id: string; capability: string; trackingKey: string };
const url = 'https://tzozajnwznxqgxnjikoy.supabase.co';
const publishable = 'sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1';
function admin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('maintenance control unavailable');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function operationHeaders(op: LegacyOperation) {
  return { 'x-misaki-operation': op.id, 'x-misaki-capability': op.capability };
}
export function operationClient(token: string, op: LegacyOperation): SupabaseClient {
  return createClient(url, publishable, { global: { headers: { Authorization: `Bearer ${token}`, ...operationHeaders(op) } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
export async function admitOperation(kind: string, userId: string): Promise<LegacyOperation> {
  const { data, error } = await admin().rpc('admit_misaki_legacy_operation', { p_kind: kind, p_user_id: userId });
  if (error || !data?.id || !data?.capability || !data?.trackingKey) throw new Error('maintenance admission unavailable');
  return data;
}
export async function progressOperation(op: LegacyOperation, state: string): Promise<boolean> {
  try {
    const { error } = await admin().rpc('progress_misaki_legacy_operation', { p_id: op.id, p_capability: op.capability, p_state: state });
    if (error) console.error('OPERATION_UNRESOLVED', op.id, state);
    return !error;
  } catch { console.error('OPERATION_UNRESOLVED', op.id, state); return false; }
}
export function maintenanceResponse() {
  return Response.json({ maintenance: true, error: 'ただいまメンテナンス中です。少し待ってからもう一度お試しください。' },
    { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } });
}
