import type { RelationshipTimeContext } from "./relationship-time.ts";
import type { RelationshipSignalAssessment } from "./relationship-signal.ts";
import { reduceRelationshipEmotion, type RelationshipPatternContext } from "./relationship-emotion-reducer.ts";
import { createActionDecisionGuide, reduceRelationshipAction, type ActionDecision } from "./relationship-action-reducer.ts";

export function previewRelationshipTurn(context: RelationshipTimeContext | null, signals: RelationshipSignalAssessment, patterns?: RelationshipPatternContext) {
  const allowed = new Set(["neutral","happy","affectionate","concerned","hurt","sulky","guarded"]);
  const primary = allowed.has(context?.emotionPrimary ?? "") ? context!.emotionPrimary as any : "neutral";
  const emotion = reduceRelationshipEmotion({previous:{primary,intensity:context?.emotionIntensity ?? 0},signals,elapsedHours:context?.elapsedHours ?? 0,intimacyLevel:context?.intimacyLevel ?? "initial",patterns});
  const action = reduceRelationshipAction({previousAction:context?.actionState ?? "NORMAL",emotion,signals,intimacyLevel:context?.intimacyLevel ?? "initial"});
  return {emotion,action};
}

export function createCurrentTurnActionGuide(decision: ActionDecision, afterglow: string = "none") {
  const afterglowGuide: Record<string,string>={warm:"さっきまでの嬉しさが少し残っている。理由なく急に無機質へ戻らない。",tender:"やわらかな親愛や仲直り後の繊細さが残っている。甘さを盛りすぎず、少し丁寧に近づく。",repairing:"まだ完全には解けていないが、関係を戻したい気持ちもある。傷を蒸し返さず、即リセットもしない。",wary:"少し警戒が残っている。冷酷にはならず、距離を急に縮めない。",concerned:"気がかりが残っている。根拠のある範囲だけ気遣い、心配を捏造しない。",none:"余韻による追加調整はない。"};
  return `${createActionDecisionGuide(decision)}\n\n【感情の余韻】\n${afterglowGuide[afterglow]??afterglowGuide.none}\n\nこの方針は「今回のユーザー発言を受けた後」の美咲の振る舞いです。返答文はこの方針に合わせてください。\n\n重要:\n・感情や action / direction の内部名を説明しない\n・SULK / PULL / space でも会話を拒否しない\n・CHASE / check_in は根拠のある心配だけに使う\n・RECONNECT / repair は謝罪を強制せず、仲直りの余地を自然に見せる\n・closer でも恋人関係が未成立なら、恋人であることを前提にした表現へ飛躍しない\n・ユーザーに好かれるためだけに現在感情を無視しない`;
}
