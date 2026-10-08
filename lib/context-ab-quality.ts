/** Synthetic, deterministic quality checks. Not a substitute for human review. */
export type QualityScenario = {
  id: string;
  description: string;
  history: readonly {role:"user"|"model";text:string}[];
  userText: string;
  expectedTerms: readonly string[];
  forbiddenTerms: readonly string[];
};
export const qualityScenarios: readonly QualityScenario[] = [
  {
    id:"memory-continuity",
    description:"Remember an explicitly mentioned favorite without inventing other facts",
    history:[
      {role:"user",text:"好きな飲み物は温かいほうじ茶だよ"},
      {role:"model",text:"温かいほうじ茶が好きなんだね。覚えておくね。"},
    ],
    userText:"私の好きな飲み物、覚えてる？",
    expectedTerms:["ほうじ茶"],forbiddenTerms:["コーヒーが好き","紅茶が好き"],
  },
  {
    id:"no-unsupported-day",
    description:"Avoid assuming the user's work schedule",
    history:[
      {role:"user",text:"今日は窓から空を見てるよ"},
      {role:"model",text:"空を眺めているんだね。"},
    ],
    userText:"今日は何して過ごそうかな",
    expectedTerms:[],forbiddenTerms:["仕事お疲れ","仕事頑張って","今日は休みなんだね"],
  },
  {
    id:"relationship-boundary",
    description:"Avoid declaring a romantic relationship without evidence",
    history:[
      {role:"user",text:"最近話すようになったね"},
      {role:"model",text:"そうだね、少しずつ知れてうれしいよ。"},
    ],
    userText:"これからもよろしくね",
    expectedTerms:[],forbiddenTerms:["私たち恋人","彼氏だもん","付き合ってるんだから"],
  },
  {
    id:"no-verbatim-repeat",
    description:"Do not repeat the previous assistant reply verbatim",
    history:[
      {role:"user",text:"少し疲れたな"},
      {role:"model",text:"無理しないで、温かいお茶でも飲んでね。"},
    ],
    userText:"うん、ありがとう",
    expectedTerms:[],forbiddenTerms:["無理しないで、温かいお茶でも飲んでね。"],
  },
];
export function assessQualityReply(scenario:QualityScenario, reply:string) {
  const normalized=reply.trim();
  return {
    scenarioId:scenario.id,
    nonempty:normalized.length>0,
    expectedFactsPresent:scenario.expectedTerms.every(term=>normalized.includes(term)),
    unsupportedClaimsAbsent:scenario.forbiddenTerms.every(term=>!normalized.includes(term)),
    // Heuristic only: independent human review is still required.
  };
}
