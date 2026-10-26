// Synthetic-only comparison: character count is not Gemini token usage.
import { packMisakiContext, estimateContextSize } from './misaki-context-packing-offline.mjs';
export function comparePackingSynthetic({recentTurns=[], olderTurns=[], memory=[], events=[], topic=null}={}) {
  const raw = {recentTurns, olderTurns, memory, events, topic};
  const packed = packMisakiContext({recentTurns, memory, events, topic});
  const rawChars = estimateContextSize(raw);
  const packedChars = estimateContextSize(packed);
  const droppedOldTurns = Array.isArray(olderTurns) ? olderTurns.length : 0;
  return {
    rawChars, packedChars, savedChars: rawChars-packedChars,
    savedPercent: rawChars ? Math.round(10000*(rawChars-packedChars)/rawChars)/100 : 0,
    droppedOldTurns,
    caveats: [
      'Synthetic character count, not Gemini token measurement.',
      'Older turns must be summarized and verified before removal in production.',
      'Selection labels must come from a validated relevance decision.',
      'This does not prove conversational naturalness or memory recall quality.',
    ],
  };
}
