import { createHash, timingSafeEqual } from "node:crypto";
import { createServerSupabase } from "../../../../lib/canonical-state";
import { resumeRelationshipEmotion } from "../../../../lib/relationship-emotion-store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.MISAKI_EMOTION_RECOVERY_SECRET;
  if (!secret) return Response.json({ error: "recovery_disabled" }, { status: 503 });
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(request.headers.get("authorization") ?? ""), digest(`Bearer ${secret}`))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const db = createServerSupabase();
    const { data, error } = await db.rpc("claim_misaki_emotion_recovery");
    if (error || !Array.isArray(data)) throw new Error("Emotion recovery claim failed");

    const attempts = await Promise.allSettled(data.map(({ user_id }) =>
      resumeRelationshipEmotion(db, user_id, 1)));
    const failed = attempts.filter(attempt => attempt.status === "rejected").length;
    return Response.json({ claimed: attempts.length, failed }, { status: failed ? 503 : 200 });
  } catch {
    return Response.json({ error: "recovery_unavailable" }, { status: 503 });
  }
}
