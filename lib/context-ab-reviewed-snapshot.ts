import type {FrozenContextSnapshot} from "./context-ab-offline-harness.ts";
import type {ReplayPreflight} from "./context-ab-replay-preflight.ts";

/**
 * Local-only bridge. Does not access authentication, Supabase, or Gemini.
 * Manual approval is explicit and scoped to the specific reviewed snapshot.
 * Never persist the returned snapshot in a repository or Actions artifact.
 */
export function makeReviewedOfflineSnapshot(args: {
  preflight: ReplayPreflight;
  systemPromptTemplate: string;
  manuallyReviewedAndApproved: true;
}): FrozenContextSnapshot {
  const {preflight,systemPromptTemplate,manuallyReviewedAndApproved}=args;
  if (manuallyReviewedAndApproved !== true) {
    throw new Error("Explicit review and approval required");
  }
  if (!systemPromptTemplate.includes("{{RECENT_REPLY_SECTION}}")) {
    throw new Error("Prompt template must contain recent reply placeholder");
  }
  const history=preflight.fixture.history.map(turn=>({
    role:turn.role,
    text:turn.parts[0].text,
  }));
  const recentReplies=history.filter(turn=>turn.role==="model").slice(-8).map(turn=>turn.text);
  return {
    systemPromptTemplate,
    recentReplies,
    history,
    userText:preflight.fixture.nextUserText,
  };
}
