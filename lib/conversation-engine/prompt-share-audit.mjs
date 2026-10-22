/** Offline-only prompt accounting for synthetic, already-authorized content. */
const BYTES = new TextEncoder();
const CATEGORIES = new Set(['scaffold', 'persona', 'relationship', 'memory', 'history', 'external', 'other']);

export function measurePromptShare(sections) {
  if (!Array.isArray(sections) || sections.length === 0) throw new Error('SECTIONS_REQUIRED');
  const seen = new Set();
  const totals = Object.fromEntries([...CATEGORIES].map(key => [key, 0]));
  const rows = [];
  for (const s of sections) {
    if (!s || typeof s.key !== 'string' || !s.key.trim() || seen.has(s.key) || !CATEGORIES.has(s.category) || typeof s.text !== 'string' || typeof s.selected !== 'boolean') {
      throw new Error('INVALID_SECTION');
    }
    seen.add(s.key);
    const rawBytes = BYTES.encode(s.text).length;
    const selectedBytes = s.selected ? rawBytes : 0;
    totals[s.category] += selectedBytes;
    rows.push({key:s.key, category:s.category, rawBytes, selectedBytes});
  }
  const totalBytes = Object.values(totals).reduce((sum, n) => sum + n, 0);
  return {
    categoryBytes: totals,
    totalBytes,
    categories: [...CATEGORIES].map(category => ({
      category, bytes: totals[category], sharePercent: totalBytes ? Number((totals[category] / totalBytes * 100).toFixed(2)) : 0,
    })),
    sections: rows,
    actualGeminiTokens: null,
    actualApiCost: null,
    productionParityEstablished: false,
  };
}

export function exampleSyntheticTurn({historyTurns = 12, includeExternal = true} = {}) {
  if (!Number.isInteger(historyTurns) || historyTurns < 0 || historyTurns > 60) throw new Error('INVALID_HISTORY_COUNT');
  const history = Array.from({length:historyTurns}, (_, i) => `発言${i+1}: 今日の出来事を話しているよ。`).join('\n');
  const external = '現在の天気：くもり。交通情報：特に確認できていません。';
  return [
    {key:'scaffold',category:'scaffold',text:'返答はJSON。未確認情報を作らず、自然に話す。',selected:true},
    {key:'persona',category:'persona',text:'美咲は親しみやすい大人の女性。',selected:true},
    {key:'relationship',category:'relationship',text:'既存の関係性に合った返答をする。',selected:true},
    {key:'memory',category:'memory',text:'過去の大切な出来事を保持する。',selected:true},
    {key:'history',category:'history',text:history,selected:true},
    {key:'external',category:'external',text:external,selected:includeExternal},
  ];
}
