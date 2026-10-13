import {prepareApprovedReplayFixture, type ReplayFixture} from "./context-ab-approved-replay.ts";

/**
 * Choose a replay boundary from a locally reviewed conversation.
 * Replays the last user turn and only earlier context, never future turns.
 * This is an offline utility: no database, auth, network or model calls.
 */
export function selectLastUserReplayBoundary(input: unknown): ReplayFixture {
  if (!Array.isArray(input)) throw new Error("Expected conversation array");
  let lastUser=-1;
  for(let i=input.length-1;i>=0;i--) {
    const item=input[i];
    if(item && typeof item==="object" && !Array.isArray(item) && item.role==="user") {
      lastUser=i;
      break;
    }
  }
  if(lastUser<2) throw new Error("Not enough context before last user turn");
  return prepareApprovedReplayFixture(input.slice(0,lastUser+1));
}
