// Fixed classifications only: never include tokens, IDs or conversation data.
export type TemporaryStateFailure = 'expired' | 'unverifiable';
export class TemporaryStateUnavailableError extends Error {
  constructor(public readonly reason: TemporaryStateFailure) {
    super(reason === 'expired' ? 'Temporary root expired' : 'Temporary root could not be verified');
    this.name = 'TemporaryStateUnavailableError';
  }
}
export function temporaryStateMessage(status: number, body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const code = (body as { code?: unknown }).code;
  if (status === 410 && code === 'TEMPORARY_STATE_EXPIRED') return '匿名の一時状態の有効期限が切れています。表示中の履歴だけでは会話の復元を確認できません。古い状態を残したまま、下のボタンから独立した新しい会話を始められます。';
  if (status === 409 && code === 'TEMPORARY_STATE_UNVERIFIABLE') return '匿名の一時状態を検証できませんでした。会話の復元は未確認です。古い状態を残したまま、下のボタンから独立した新しい会話を始められます。';
  return null;
}
