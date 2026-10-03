import { NextRequest } from "next/server";
import { ACTING_LAB_PROFILES, createRelationshipActingGuide } from "../../../lib/relationship-acting-guide";
import { generateGeminiJson } from "../../../lib/gemini-json-generator";
import { createFallbackPersonaPrompt } from "../../../lib/persona/fallback-persona";

const DEFAULT_AUDITION_LINE = "今日ちょっと疲れた。なんか話そ";

function parseReply(text: string | null) {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return typeof parsed?.reply === "string" ? parsed.reply.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Development-only acting lab.
 * No Supabase client is created here: no quota, history, memory, relationship,
 * Body Clock, or canonical-state write can happen through this endpoint.
 */
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const message =
    typeof body?.message === "string" && body.message.trim()
      ? body.message.trim()
      : DEFAULT_AUDITION_LINE;

  const requestedProfiles =
    Array.isArray(body?.profiles) && body.profiles.length > 0
      ? body.profiles.filter((value: unknown): value is string => typeof value === "string")
      : Object.keys(ACTING_LAB_PROFILES);

  const profiles = requestedProfiles
    .map((key: string) => [key, ACTING_LAB_PROFILES[key]] as const)
    .filter((entry) => Boolean(entry[1]));

  const results = await Promise.all(
    profiles.map(async ([profile, state]) => {
      const actingGuide = createRelationshipActingGuide(state);
      const personaPrompt = createFallbackPersonaPrompt("chat");
      const systemInstruction = `
${personaPrompt}

【演技研究室】
以下の演技指示は現在の関係状態だけを差し替える研究用入力です。
演技指示は背景として使い、説明・引用・数値化しないでください。
ユーザーの事情を勝手に作らないでください。

${actingGuide}

出力は必ずJSONだけにしてください。
{"reply":"美咲の返事"}
`.trim();

      try {
        const generated = await generateGeminiJson({
          apiKey,
          systemInstruction,
          contents: [],
          userText: message,
        });

        return {
          profile,
          state,
          actingGuide,
          personaSource: "shared-fallback",
          status: generated.status,
          reply: generated.ok ? parseReply(generated.text) : null,
        };
      } catch (error) {
        return {
          profile,
          state,
          actingGuide,
          status: 500,
          reply: null,
          error: error instanceof Error ? error.message : "generation failed",
        };
      }
    })
  );

  return Response.json({
    message,
    model: "gemini-3.1-flash-lite",
    writes: false,
    results,
  });
}
