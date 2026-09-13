import {
  createClient,
} from "@supabase/supabase-js";

import {
  analyzeUserEvolution,
  type ExistingRelationshipTrait,
} from "../../../../../lib/persona/evolution-analyzer";

import type {
  ChatMessage,
} from "../../../../../lib/user-profile";

const MAX_MEMORY = 30;
const MAX_HISTORY = 60;

const SUPABASE_URL =
  "https://tzozajnwznxqgxnjikoy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

function createAuthenticatedSupabase(
  accessToken: string
) {
  return createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },

      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    const apiKey =
      process.env
        .GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "Gemini API key is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      request.headers.get(
        "authorization"
      ) ?? "";

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return Response.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization
        .slice(
          "Bearer ".length
        )
        .trim();

    if (!accessToken) {
      return Response.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const supabase =
      createAuthenticatedSupabase(
        accessToken
      );

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      return Response.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const safeHistory:
      ChatMessage[] =
      Array.isArray(
        body?.history
      )
        ? body.history
            .filter(
              (item: unknown) => {
                if (
                  !item ||
                  typeof item !==
                    "object"
                ) {
                  return false;
                }

                const value =
                  item as {
                    role?: unknown;
                    text?: unknown;
                  };

                return (
                  (
                    value.role ===
                      "user" ||
                    value.role ===
                      "misaki"
                  ) &&
                  typeof value.text ===
                    "string" &&
                  value.text
                    .trim()
                    .length >
                    0
                );
              }
            )
            .map(
              (item: {
                role:
                  | "user"
                  | "misaki";
                text: string;
              }) => ({
                role:
                  item.role,
                text:
                  item.text
                    .trim()
                    .slice(
                      0,
                      2000
                    ),
              })
            )
            .slice(
              -MAX_HISTORY
            )
        : [];

    const safeMemory:
      string[] =
      Array.isArray(
        body?.memory
      )
        ? body.memory
            .filter(
              (item: unknown) =>
                typeof item ===
                  "string" &&
                item
                  .trim()
                  .length >
                  0
            )
            .map(
              (item: string) =>
                item
                  .trim()
                  .slice(
                    0,
                    500
                  )
            )
            .slice(
              -MAX_MEMORY
            )
        : [];

    if (
      safeHistory.length ===
        0 &&
      safeMemory.length ===
        0
    ) {
      return Response.json({
        analyzed: true,
        saved: 0,
        candidates: [],
      });
    }

    const {
      data: traitRows,
      error: traitError,
    } =
      await supabase
        .from(
          "misaki_user_relationship_traits"
        )
        .select(
          "trait_key, content, strength"
        )
        .eq(
          "user_id",
          userData.user.id
        )
        .limit(20);

    if (traitError) {
      console.error(
        "EVOLUTION TRAIT READ ERROR:",
        traitError
      );
    }

    const existingTraits:
      ExistingRelationshipTrait[] =
      Array.isArray(
        traitRows
      )
        ? traitRows.map(
            (row) => ({
              trait_key:
                String(
                  row.trait_key ??
                  ""
                ),
              content:
                String(
                  row.content ??
                  ""
                ),
              strength:
                typeof row.strength ===
                  "number"
                  ? row.strength
                  : row.strength !==
                      null &&
                    row.strength !==
                      undefined
                    ? Number(
                        row.strength
                      )
                    : null,
            })
          )
        : [];

    const candidates =
      await analyzeUserEvolution(
        apiKey,
        safeHistory,
        safeMemory,
        existingTraits
      );

    if (
      candidates.length ===
      0
    ) {
      return Response.json({
        analyzed: true,
        saved: 0,
        candidates: [],
      });
    }

    const currentByTrait =
      new Map(
        existingTraits.map(
          (trait) => [
            trait.trait_key,
            trait.content,
          ]
        )
      );

    const saved:
      Array<{
        id: string;
        traitKey: string;
      }> = [];

    for (
      const candidate of
        candidates
    ) {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "create_user_evolution_candidate",
          {
            p_trait_key:
              candidate.traitKey,

            p_current_content:
              currentByTrait.get(
                candidate.traitKey
              ) ?? null,

            p_proposed_content:
              candidate.proposedContent,

            p_reason:
              candidate.reason,

            p_confidence:
              candidate.confidence,

            p_risk_level:
              candidate.riskLevel,

            p_evidence: {
              quotes:
                candidate.evidence,
              source:
                "conversation_analysis",
              analyzer:
                "gemini-3.1-flash-lite",
            },
          }
        );

      if (error) {
        console.error(
          "EVOLUTION CANDIDATE SAVE ERROR:",
          error
        );

        continue;
      }

      if (
        typeof data ===
          "string" &&
        data
      ) {
        saved.push({
          id: data,
          traitKey:
            candidate.traitKey,
        });
      }
    }

    return Response.json({
      analyzed: true,
      saved:
        saved.length,
      candidates:
        saved,
      autoApplied:
        false,
    });
  } catch (error) {
    console.error(
      "EVOLUTION ANALYZE ROUTE ERROR:",
      error
    );

    return Response.json(
      {
        analyzed: false,
        error:
          "Evolution analysis failed.",
      },
      {
        status: 500,
      }
    );
  }
}
