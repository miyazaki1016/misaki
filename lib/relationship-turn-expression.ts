import type { RelationshipTimeContext } from "./relationship-time";
import type { RelationshipSignalAssessment } from "./relationship-signal";
import { reduceRelationshipEmotion } from "./relationship-emotion-reducer";
import { createActionDecisionGuide, reduceRelationshipAction, type ActionDecision } from "./relationship-action-reducer";

export function previewRelationshipTurn(context: RelationshipTimeContext | null, signals: RelationshipSignalAssessment) {
  const allowed = new Set(["neutral","happy","affectionate","concerned","hurt","sulky","guarded"]);
  const primary = allowed.has(context?.emotionPrimary ?? "") ? context!.emotionPrimary as any : "neutral";
  const emotion = reduceRelationshipEmotion({previous:{primary,intensity:context?.emotionIntensity ?? 0},signals,elapsedHours:context?.elapsedHours ?? 0,intimacyLevel:context?.intimacyLevel ?? "initial"});
  const action = reduceRelationshipAction({previousAction:context?.actionState ?? "NORMAL",emotion,signals,intimacyLevel:context?.intimacyLevel ?? "initial"});
  return {emotion,action};
}

export function createCurrentTurnActionGuide(decision: ActionDecision) {
  return `${createActionDecisionGuide(decision)}\n\nこの方針は「今回のユーザー発言を受けた後」の美咲の振る舞いです。返答文はこの方針に合わせてください。\n\n重要:\n・感情や action / direction の内部名を説明しない\n・SULK / PULL / space でも会話を拒否しない\n・CHASE / check_in は根拠のある心配だけに使う\n・RECONNECT / repair は謝罪を強制せず、仲直りの余地を自然に見せる\n・closer でも恋人関係が未成立なら、恋人であることを前提にした表現へ飛躍しない\n・ユーザーに好かれるためだけに現在感情を無視しない`;
}
