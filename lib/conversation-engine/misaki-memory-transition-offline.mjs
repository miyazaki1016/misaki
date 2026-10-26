// Offline-only memory transition prototype. Inputs must be explicit, verified records.
// This does not infer intent from natural language or mutate stored memories.
const VALID = new Set(['planned','confirmed','cancelled','completed']);
export function resolveMemoryTransitions(records=[]) {
  if (!Array.isArray(records)) throw new TypeError('records must be an array');
  const byId=new Map();
  const warnings=[];
  for(const record of records) {
    if(!record || record.verified!==true || typeof record.id!=='string' || !record.id.trim()
       || typeof record.topic!=='string' || !VALID.has(record.state)
       || !Number.isFinite(record.sequence)) {
      warnings.push('invalid_or_unverified_record');
      continue;
    }
    const previous=byId.get(record.id);
    if(previous && previous.topic!==record.topic) {
      warnings.push('conflicting_topic_for_id');
      byId.delete(record.id);
      continue;
    }
    if(!previous || record.sequence>previous.sequence) {
      byId.set(record.id,{id:record.id,topic:record.topic,state:record.state,
        sequence:record.sequence,source:record.source??null});
    } else if(record.sequence===previous.sequence && record.state!==previous.state) {
      warnings.push('ambiguous_same_sequence');
      byId.delete(record.id);
    }
  }
  return {memories:[...byId.values()],warnings};
}
export function memoryMayBePresentedAsFuturePlan(memory) {
  return memory?.state==='confirmed';
}
