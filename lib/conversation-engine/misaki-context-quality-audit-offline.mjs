// Offline synthetic guardrail suite: no model calls or production wiring.
import {packMisakiContext,estimateContextSize} from './misaki-context-packing-offline.mjs';
export function auditSyntheticConversation(input) {
  const packed=packMisakiContext(input);
  const recent=Array.isArray(input?.recentTurns)?input.recentTurns.slice(-16):[];
  const checks={
    recentVerbatim:recent.every((turn,i)=>packed.recentTurns[i]?.content===String(turn?.content??'')),
    recentOrder:recent.every((turn,i)=>packed.recentTurns[i]?.role===(turn?.role==='assistant'?'assistant':'user')),
    noUnverifiedMemory:packed.memory.every(x=>Boolean(x.fact)),
    noUnselectedEvent:(Array.isArray(input?.events)?input.events:[])
      .filter(x=>x?.selected!==true).every(x=>!packed.events.some(y=>y.detail===String(x?.detail??'').replace(/\s+/g,' ').trim().slice(0,180))),
    eventProvenance:packed.events.every(x=>'observedAt'in x&&'source'in x&&'status'in x),
  };
  return {checks,pass:Object.values(checks).every(Boolean),
    packedChars:estimateContextSize(packed),
    limitations:['Not a semantic recall test','No tokenizer or Gemini quality evaluation',
      'No automatic summarization of old turns','No proof of production parity']};
}
