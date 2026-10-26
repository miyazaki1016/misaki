// Offline-only Japanese plan-utterance candidate classifier.
// Conservative heuristic: ambiguous sentences MUST be reviewed, never persisted as facts.
const RULES=[
  {state:'cancelled',re:/(?:中止|キャンセル|取りやめ|行かないことにした|やめることにした|今回はやめた)/},
  {state:'completed',re:/(?:行ってきた|行って来た|終わった|済ませた)/},
  {state:'confirmed',re:/(?:行くことにした|予約した|申し込んだ|決めた)/},
  {state:'planned',re:/(?:行こうかな|行きたいな|検討中|行くかも|予定を考え)/},
];
const NEGATION=/(?:行かないかも|やめない|中止しない|予約してない|行くことにしてない|行ってない|決めてない)/;
const QUOTED=/(?:友達が|彼が|彼女が|ニュースで|と言ってた|らしい|って聞いた)/;
const QUESTION=/(?:[？?]|どうしよう|かなと思ったけど)/;
export function classifyPlanCandidate(text){
  if(typeof text!=='string'||!text.trim())return {state:null,review:true,reason:'empty'};
  const matches=RULES.filter(rule=>rule.re.test(text));
  if(NEGATION.test(text)||QUOTED.test(text)||QUESTION.test(text))
    return {state:null,review:true,reason:'negation_quote_or_question'};
  if(matches.length!==1)return {state:null,review:true,reason:matches.length?'multiple_states':'no_clear_signal'};
  // Even a clear keyword cannot establish speaker, date, topic, or verification.
  return {state:matches[0].state,review:true,reason:'candidate_only_unverified'};
}
