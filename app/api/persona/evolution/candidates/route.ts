import {
  createAuthenticatedSupabase,
  getBearerToken,
} from "../_auth";

export async function GET(
  request: Request
) {
  try {
    const accessToken =
      getBearerToken(
        request
      );

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

    const url =
      new URL(
        request.url
      );

    const statusParam =
      url.searchParams.get(
        "status"
      );

    const status =
      statusParam ===
        "approved" ||
      statusParam ===
        "rejected" ||
      statusParam ===
        "pending"
        ? statusParam
        : "pending";

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "misaki_evolution_candidates"
        )
        .select(
          [
            "id",
            "trait_key",
            "current_content",
            "proposed_content",
            "reason",
            "confidence",
            "risk_level",
            "status",
            "evidence",
            "created_at",
            "reviewed_at",
          ].join(",")
        )
        .eq(
          "scope",
          "user"
        )
        .eq(
          "user_id",
          userData.user.id
        )
        .eq(
          "status",
          status
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(50);

    if (error) {
      console.error(
        "EVOLUTION CANDIDATE LIST ERROR:",
        error
      );

      return Response.json(
        {
          error:
            "Failed to load evolution candidates.",
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      candidates:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "EVOLUTION CANDIDATE LIST ROUTE ERROR:",
      error
    );

    return Response.json(
      {
        error:
          "Failed to load evolution candidates.",
      },
      {
        status: 500,
      }
    );
  }
}
