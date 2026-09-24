import assert from "node:assert/strict";
import test from "node:test";

import { createRelationshipConversationPrompt } from "../lib/relationship-conversation-prompt.ts";
import { previewRelationshipConversation } from "../lib/relationship-conversation-preview.ts";

test("conversation prompt combines the real base persona with current relationship expression", () => {
  const preview = previewRelationshipConversation(
    {
      exists: true,
      elapsedSeconds: 0,
      elapsedHours: 0,
      timeBand: "recent",
      intimacyLevel: "intimate",
      intimacyPoints: 120,
      emotionPrimary: "affectionate",
      emotionIntensity: 55,
      actionState: "NORMAL",
      lastInteractionAt: "2026-09-25T00:00:00.000Z",
      stateUpdatedAt: "2026-09-25T00:00:00.000Z",
    },
    {
      signals: [
        { name: "hurtful", strength: 0.9, confidence: 0.95, evidence: "きつい言い方をされた" },
      ],
      relationshipFacts: { mutualAffectionExplicit: true, datingEstablishedExplicit: true },
    }
  );

  const prompt = createRelationshipConversationPrompt({
    preview,
    recentConversation: "ユーザー: もういいよ\n美咲: その言い方はちょっと嫌。",
    relationshipMemory: "普段は冗談を言い合えるくらい親しい。",
  });

  assert.match(prompt, /あなたは「美咲」という38歳の日本人女性です/);
  assert.match(prompt, /二人の共有履歴・記憶/);
  assert.match(prompt, /直近の会話/);
  assert.match(prompt, /好意は残っていても今は傷を優先/);
  assert.match(prompt, /ユーザーへの返答だけを書く/);
});

test("conversation prompt does not invent missing history sections", () => {
  const preview = previewRelationshipConversation(null, {
    signals: [],
    relationshipFacts: { mutualAffectionExplicit: false, datingEstablishedExplicit: false },
  });

  const prompt = createRelationshipConversationPrompt({ preview });

  assert.doesNotMatch(prompt, /【二人の共有履歴・記憶】/);
  assert.doesNotMatch(prompt, /【直近の会話】/);
  assert.match(prompt, /ユーザーとは最初から恋人ではありません/);
});
