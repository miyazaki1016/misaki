/** #220: isolated tuning validation; no Gemini, database or production side effects. */
export type ReplyLength = "short" | "medium" | "long";
export type TuningSettings = Readonly<{
  warmth: number;
  humor: number;
  phrasingInitiative: number;
  questionTone: number;
  length: ReplyLength;
}>;
export type TuningDraft = Readonly<{
  tuningVersion: string;
  scope: "preview";
  settings: TuningSettings;
}>;
export type PreviewFixture = Readonly<{
  snapshotId: string;
  selectionRulesVersion: string;
  promptVersion: string;
  model: string;
  userInput: string;
  selectedFacts: readonly string[];
  requiredConstraints: readonly string[];
  forbiddenConstraints: readonly string[];
  questionAllowed: boolean;
}>;
export type PreviewPair = Readonly<{
  fixture: PreviewFixture;
  baseline: TuningDraft;
  candidate: TuningDraft;
  experiment: "tuning";
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function score(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Invalid tuning score");
  }
  return value;
}
export function validateTuningDraft(value: unknown): TuningDraft {
  if (!isRecord(value) || value.scope !== "preview" ||
      typeof value.tuningVersion !== "string" || !/^[a-zA-Z0-9._-]{1,64}$/.test(value.tuningVersion) ||
      !isRecord(value.settings)) {
    throw new Error("Invalid preview tuning draft");
  }
  const s = value.settings;
  if (s.length !== "short" && s.length !== "medium" && s.length !== "long") {
    throw new Error("Invalid reply length");
  }
  return Object.freeze({
    tuningVersion: value.tuningVersion,
    scope: "preview" as const,
    settings: Object.freeze({
      warmth: score(s.warmth), humor: score(s.humor),
      phrasingInitiative: score(s.phrasingInitiative),
      questionTone: score(s.questionTone), length: s.length,
    }),
  });
}
export function createTuningPreviewPair(
  fixture: PreviewFixture, baseline: unknown, candidate: unknown,
): PreviewPair {
  if (!fixture.snapshotId || !fixture.selectionRulesVersion || !fixture.promptVersion ||
      !fixture.model || !fixture.userInput ||
      !Array.isArray(fixture.selectedFacts) ||
      !Array.isArray(fixture.requiredConstraints) ||
      !Array.isArray(fixture.forbiddenConstraints) ||
      !fixture.selectedFacts.every(x => typeof x === "string" && x.length > 0) ||
      !fixture.requiredConstraints.every(x => typeof x === "string" && x.length > 0) ||
      !fixture.forbiddenConstraints.every(x => typeof x === "string" && x.length > 0) ||
      typeof fixture.questionAllowed !== "boolean") {
    throw new Error("Invalid or incomplete preview fixture");
  }
  const a = validateTuningDraft(baseline);
  const b = validateTuningDraft(candidate);
  if (a.tuningVersion === b.tuningVersion && JSON.stringify(a.settings) !== JSON.stringify(b.settings)) {
    throw new Error("Conflicting settings for one tuning version");
  }
  // Preview-only. The shared fixture ensures A/B cannot accidentally vary selected facts.
  return Object.freeze({fixture: Object.freeze({
    ...fixture,
    selectedFacts: Object.freeze([...fixture.selectedFacts]),
    requiredConstraints: Object.freeze([...fixture.requiredConstraints]),
    forbiddenConstraints: Object.freeze([...fixture.forbiddenConstraints]),
  }), baseline: a, candidate: b, experiment: "tuning" as const});
}
