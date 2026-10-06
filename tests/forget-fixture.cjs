// Scripted semantic-model port. Tests policy/storage orchestration, not Gemini accuracy.
exports.judge = async (task, input) => {
  if (task === 'target') {
    if (/それ|あれ/.test(input.text)) return { ambiguous: true, targets: [] };
    const rows = input.candidates, out = [];
    rows.forEach((row, evidenceIndex) => {
      const brother = row.text.match(/(?:ユーザーの)?弟(?:の名前(?:は|が)|は|の)(隆紀|健太)(?:だよ|だ|です)?/);
      if (brother && (/UI/.test(input.text) || input.text.includes(brother[1]) || input.text.includes('弟'))) out.push({ subject: 'user.brother', predicate: 'name', value: brother[1], scope: /UI/.test(input.text) ? 'fact' : 'person', evidenceIndex, evidence: brother[0] });
      if (/UI/.test(input.text) && /猫が好き/.test(row.text)) out.push({ subject: 'user', predicate: 'preference.pet', value: '猫', scope: 'fact', evidenceIndex, evidence: '猫が好き' });
    });
    return { ambiguous: false, targets: out };
  }
  if (task === 'reoffer') {
    const offers = [];
    if (!/[?？]|覚えてる|忘れて|「|もし/.test(input.text)) input.targets.forEach((t, targetIndex) => {
      const m = t.subject === 'user.brother' && input.text.match(/弟(?:の名前は|は|の)(隆紀|健太)(?:だよ|だ|です)?/);
      if (m) offers.push({ targetIndex, fact: m[0], evidence: m[0] });
    });
    return { ambiguous: false, offers };
  }
  if (task === 'mask') return { rows: input.rows.map((row, index) => {
    const spans = new Set(); let uncertain = false;
    for (const [targetIndex,t] of input.targets.entries()) {
      if (t.subject === 'user.brother') {
        if(row.linkedTargets?.includes(targetIndex)) {const m=row.text.match(/隆紀のことは忘れて/);if(m)spans.add(m[0]);}
        const regex = /(?:ユーザーの)?弟(?:の名前(?:は|が)|は|の)(隆紀|健太)(?:だよ|だ|です)?/g;
        for (const m of row.text.matchAll(regex)) if (m[1] === t.value || t.scope === 'person') spans.add(m[0]);
        // Standalone old answer is an ambiguous identity; privacy fails closed.
        if (row.text.trim() === t.value || row.text.trim() === t.value+'だよ') uncertain = true;
      }
      if (t.predicate === 'preference.pet' && row.text.includes('猫が好き')) spans.add('猫が好き');
    }
    return { index, spans: [...spans], uncertain };
  }) };
  throw new Error('Unexpected semantic task');
};
