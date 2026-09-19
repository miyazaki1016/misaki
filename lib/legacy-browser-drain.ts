import { supabase } from './supabase';
type Operation = { id: string; capability: string; trackingKey: string };
const pendingKey = 'misaki-drain-pending-saves';
// Persist exact per-turn snapshots. A later session must never acknowledge an
// older operation with an unrelated current cache, or another account's data.
export async function saveLegacyTurn(operation: Operation, history: unknown[], memory: unknown[], todayMemory: unknown,
  points: number, expectedUserId: string) {
  const { data } = await supabase.auth.getSession();
  if (!data.session || data.session.user.id !== expectedUserId) throw new Error('Account changed during chat');
  const item = { userId: data.session.user.id, operation, history, memory, todayMemory, points };
  const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
  localStorage.setItem(pendingKey, JSON.stringify([...pending.filter((p: any) => p.operation.id !== operation.id), item]));
  await flushLegacySaves();
}
export async function flushLegacySaves() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
  for (const p of pending) {
    if (p.userId !== data.session.user.id) continue;
    const { error } = await supabase.rpc('complete_misaki_legacy_browser_save', {
      p_id: p.operation.id, p_capability: p.operation.capability,
      p_history: p.history.slice(-60), p_memory: p.memory.slice(-30), p_today_memory: p.todayMemory,
      p_relationship_points: p.points,
      p_notifications_enabled: typeof Notification !== 'undefined' && Notification.permission === 'granted',
      p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tokyo',
    });
    if (error) throw new Error('Conversation save remains unresolved');
    const latest = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    localStorage.setItem(pendingKey, JSON.stringify(latest.filter((item: any) => item.operation.id !== p.operation.id)));
  }
}
