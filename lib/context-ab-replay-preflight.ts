import {prepareApprovedReplayFixture, type ReplayFixture} from "./context-ab-approved-replay.ts";
import {screenReplayPrivacy, type ReplayPrivacyReport} from "./context-ab-replay-privacy.ts";

/**
 * Local-only preflight. Does not fetch records, invoke Gemini, or persist
 * input. Even when no patterns are detected, manual review is mandatory.
 */
export type ReplayPreflight = {
  fixture: ReplayFixture;
  privacy: ReplayPrivacyReport;
  eligibleForAutomaticModelSubmission: false;
};
export function preflightApprovedReplay(
  history: unknown,
  nextUserText?: unknown,
): ReplayPreflight {
  const fixture=prepareApprovedReplayFixture(history,nextUserText);
  const sourceTurns=[
    ...fixture.history.map((turn)=>({text:turn.parts[0].text})),
    {text:fixture.nextUserText},
  ];
  const privacy=screenReplayPrivacy(sourceTurns);
  return {fixture,privacy,eligibleForAutomaticModelSubmission:false};
}

/** Safe for numeric-only diagnostics, excluding message bodies. */
export function summarizeReplayPreflight(preflight: ReplayPreflight) {
  return {
    historyMessages:preflight.fixture.counts.historyMessages,
    userMessages:preflight.fixture.counts.userMessages,
    modelMessages:preflight.fixture.counts.modelMessages,
    flaggedTurns:preflight.privacy.findings.length,
    manualReviewRequired:true as const,
    eligibleForAutomaticModelSubmission:false as const,
  };
}
