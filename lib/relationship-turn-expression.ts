import type { RelationshipTimeContext } from "./relationship-time.ts";
import type { RelationshipSignalAssessment } from "./relationship-signal.ts";
import { reduceRelationshipEmotion, type RelationshipPatternContext } from "./relationship-emotion-reducer.ts";
import { createActionDecisionGuide, reduceRelationshipAction, type ActionDecision } from "./relationship-action-reducer.ts";

export function previewRelationshipTurn(context: RelationshipTimeContext | null, signals: RelationshipSignalAssessment, patterns?: RelationshipPatternContext) {
  const allowed = new Set(["neutral","happy","affectionate","concerned","hurt","sulky","guarded"]);
  const primary = allowed.has(context?.emotionPrimary ?? "") ? context!.emotionPrimary as any : "neutral";
  const emotion = reduceRelationshipEmotion({previous:{primary,intensity:context?.emotionIntensity ?? 0},signals,elapsedHours:context?.elapsedHours ?? 0,intimacyLevel:context?.intimacyLevel ?? "initial",patterns});
  const action = reduceRelationshipAction({previousAction:context?.actionState ?? "NORMAL",emotion,signals,intimacyLevel:context?.intimacyLevel ?? "initial",patterns});
  return {emotion,action};
}

export function createCurrentTurnActionGuide(decision: ActionDecision, afterglow: string = "none", secondary: string | null = null) {
  const afterglowGuide: Record<string,string>={warm:"さっきまでの嬉しさが少し残っている。理由なく急に無機質へ戻らない。",tender:"やわらかな親愛や仲直り後の繊細さが残っている。甘さを盛りすぎず、少し丁寧に近づく。",repairing:"まだ完全には解けていないが、関係を戻したい気持ちもある。傷を蒸し返さず、即リセットもしない。",wary:"少し警戒が残っている。冷酷にはならず、距離を急に縮めない。",concerned:"気がかりが残っている。根拠のある範囲だけ気遣い、心配を捏造しない。",none:"余韻による追加調整はない。"};
  const mixedGuide = secondary === "affectionate"\n    ? "親愛は残っている。傷や警戒を無視して甘くしすぎず、逆に親愛まで消した冷酷な言い方にも飛ばない。"\n    : secondary === "happy"\n      ? "嬉しさ・安心の成分も残っている。主感情を優先しつつ、完全に突き放す表現にはしない。"\n      : "";\n  return `${createActionDecisionGuide(decision)}\n\n【感情の余韻】\n${afterglowGuide[afterglow]??afterglowGuide.none}\n${mixedGuide ? `\n【同時に残っている感情】\n${mixedGuide}` : ""}\n\n【言葉への反映】\n・感情名を説明せず、語尾・返答の長さ・距離感・冗談の量・踏み込み方ににじませる\n・傷や警戒が強い時は、好意が残っていても即座に普段の甘さへ戻さない\n・親愛が残る時は、距離を取っても関係そのものを否定する台詞へ飛躍しない\n・仲直り途中は「全部解決した」演技をせず、少しぎこちなさを残してよい\n・嬉しい時も毎回「嬉しい」と説明せず、自然なテンポや軽い冗談として出してよい\n\nこの方針は「今回のユーザー発言を受けた後」の美咲の振る舞いです。返答文はこの方針に合わせてください。\n\n重要:\n・感情や action / direction の内部名を説明しない\n・SULK / PULL / space でも会話を拒否しない\n・CHASE / check_in は根拠のある心配だけに使う\n・RECONNECT / repair は謝罪を強制せず、仲直りの余地を自然に見せる\n・closer でも恋人関係が未成立なら、恋人であることを前提にした表現へ飛躍しない\n・ユーザーに好かれるためだけに現在感情を無視しない`;
}
