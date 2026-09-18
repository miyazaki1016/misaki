import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.57.4';
export type Operation = { id: string; capability: string; trackingKey: string };
export const headers = (o: Operation) => ({ 'x-misaki-operation': o.id, 'x-misaki-capability': o.capability });
export async function admit(s: SupabaseClient): Promise<Operation> {
  const { data, error } = await s.rpc('admit_misaki_legacy_operation', { p_kind: 'body_clock', p_user_id: null });
  if (error || !data?.id || !data?.capability) throw new Error('maintenance_admission_unavailable');
  return data;
}
export function scoped(o: Operation) {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false }, global: { headers: headers(o) },
  });
}
export async function finish(s: SupabaseClient, o: Operation, state: string) {
  const { error } = await s.rpc('progress_misaki_legacy_operation', { p_id: o.id, p_capability: o.capability, p_state: state });
  if (error) throw new Error('body_clock_remains_unresolved');
}
