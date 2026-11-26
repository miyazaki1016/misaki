import { DEFAULT_CONVERSATION_RULES } from './vendor/selection/lib/conversation-lab-decision.ts';
import { prepareScopedConversationHandoff } from './vendor/selection/lib/conversation-lab-pipeline.ts';
import type { ConversationLabScope, ScopedConversationCandidate } from './vendor/selection/lib/conversation-lab-scope.ts';
import { createTuningPreviewPair, validateTuningDraft, type TuningDraft } from './vendor/tuning/lib/conversation-tuning-preview.ts';
import { makePromptVariants } from './vendor/slimming/lib/context-ab-prompt.ts';

type Material = ScopedConversationCandidate & {
  source: { engine: string; version: string; evidence: string };
  forgotten: boolean;
  actionResult?: 'failed';
};
type Constraint = { id: string; kind: 'required' | 'forbidden'; value: string };
type Turn = {
  scope: ConversationLabScope;
  materials: Material[];
  now: string;
  expiresAt: string;
  snapshotId: string;
  selectionRulesVersion: string;
  userInput: string;
  intent: 'respond' | 'silent';
  questionAllowed: boolean;
  constraints: Constraint[];
};

// Synthetic approved-version pointer. Each session pins an immutable preview draft.
export function createPreviewSessions(current: TuningDraft, confirmedRestore: TuningDraft) {
  let approved = validateTuningDraft(current);
  const restoreTarget = validateTuningDraft(confirmedRestore);
  if (approved.characterId !== restoreTarget.characterId) throw new Error('Cross-character restore');
  return {
    start: () => approved,
    restore: () => { approved = restoreTarget; },
  };
}

// Fixture-only boundary: no network-capable adapter, persistent state or production imports.
export function runOnePass(input: Turn, session: TuningDraft, options: {
  afterTuning?: () => void;
  stubReply?: string;
} = {}) {
  const turn = structuredClone(input);
  const now = new Date(turn.now);
  if (!(Date.parse(turn.expiresAt) > now.getTime())) throw new Error('Invalid snapshot lifetime');
  if (typeof turn.questionAllowed !== 'boolean') throw new Error('Missing question decision');

  const candidateKey = ({ kind, id }: Material['candidate']) => `${kind}:${id}`;
  const originals = new Map(turn.materials.map(material => [candidateKey(material.candidate), material]));
  if (originals.size !== turn.materials.length) throw new Error('Duplicate synthetic material identity');
  const { handoff } = prepareScopedConversationHandoff(
    turn.materials.filter(material => !material.forgotten), turn.scope, DEFAULT_CONVERSATION_RULES,
    { snapshotId: turn.snapshotId, selectionRulesVersion: turn.selectionRulesVersion }, now,
  );
  const selected = handoff.selected.map(candidate => {
    const original = originals.get(candidateKey(candidate));
    if (!original) throw new Error('Missing synthetic source metadata');
    return { ...original, candidate };
  });
  const expiresAt = new Date(Math.min(Date.parse(turn.expiresAt), ...selected.map(({candidate}) =>
    candidate.expiresAt ? Date.parse(candidate.expiresAt) : Infinity))).toISOString();
  const selection = {
    schemaVersion: handoff.schemaVersion,
    selectionRulesVersion: handoff.selectionRulesVersion,
    snapshotId: handoff.snapshotId,
    scope: turn.scope,
    createdAt: turn.now,
    expiresAt,
    selected,
    intent: turn.intent,
    questionAllowed: turn.questionAllowed,
    constraints: turn.constraints,
  };
  const preview = createTuningPreviewPair({
    characterId: selection.scope.characterId,
    snapshotId: selection.snapshotId,
    selectionRulesVersion: selection.selectionRulesVersion,
    promptVersion: 'synthetic-prompt-v1',
    model: 'synthetic-stub',
    userInput: turn.userInput,
    selectedFacts: selection.selected.map(material => material.candidate.text),
    requiredConstraints: selection.constraints.filter(c => c.kind === 'required').map(c => c.value),
    forbiddenConstraints: selection.constraints.filter(c => c.kind === 'forbidden').map(c => c.value),
    questionAllowed: selection.questionAllowed,
  }, session, session);
  const tuned = {
    ...structuredClone(selection),
    snapshotId: preview.fixture.snapshotId,
    selectionRulesVersion: preview.fixture.selectionRulesVersion,
    questionAllowed: preview.fixture.questionAllowed,
    tuningVersion: preview.baseline.tuningVersion,
    settings: preview.baseline.settings,
    promptVersion: preview.fixture.promptVersion,
  };
  options.afterTuning?.();

  const modelCalls: string[] = [];
  const sends: { text: string; contract: typeof tuned }[] = [];
  const trace = { selection, tuned, modelCalls, sends };
  if (tuned.intent === 'silent') return { ...trace, result: 'silent' as const };

  const { B: prompt, metrics } = makePromptVariants(
    '合成材料と調律・制約は同送の構造化入力を参照。\n{{RECENT_REPLY_SECTION}}',
    ['合成履歴の直近発言。'.repeat(32)],
  );
  modelCalls.push(JSON.stringify({ prompt, contract: tuned, userInput: preview.fixture.userInput }));
  const { contract }: { contract: typeof tuned } = JSON.parse(modelCalls[0]);
  const failedAction = contract.selected.some(material => material.actionResult === 'failed');
  const text = options.stubReply ?? (failedAction ? '満席で予約できなかった。' : '合成材料を確認したよ。');
  if (failedAction && /予約できた|予約済み|予約完了/u.test(text)) {
    return { ...trace, metrics, result: 'false-completion' as const };
  }
  if (!contract.questionAllowed && /[?？]/u.test(text)) {
    return { ...trace, metrics, result: 'question-forbidden' as const };
  }
  sends.push({ text, contract });
  return { ...trace, metrics, result: 'sent' as const };
}
