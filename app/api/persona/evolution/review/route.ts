import {
  createAuthenticatedSupabase,
  getBearerToken,
} from "../_auth";

type ReviewAction =
  | "approve"
  | "reject";

function isReviewAction(
  value: unknown
): value is ReviewAction {
  return (
    value ===
      "approve" ||
    value ===
      "reject"
  );
}

export async function POST(
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

    const body =
      await request.json();

    const candidateId =
      typeof body?.candidateId ===
        "string"
        ? body.candidateId.trim()
        : "";

    const action =
      body?.action;

    if (
      !candidateId ||
      !isReviewAction(
        action
      )
    ) {
      return Response.json(
        {
          error:
            "candidateId and valid action are required.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "review_user_evolution_candidate",
        {
          p_candidate_id:
            candidateId,
          p_action:
            action,
        }
      );

    if (error) {
      console.error(
        "EVOLUTION REVIEW RPC ERROR:",
        error
      );

      const message =
        String(
          error.message ??
          ""
        );

      const status =
        message.includes(
          "candidate not found"
        )
          ? 404
          : message.includes(
              "invalid action"
            )
            ? 400
            : 500;

      return Response.json(
        {
          error:
            "Evolution review failed.",
        },
        {
          status,
        }
      );
    }

    return Response.json({
      reviewed: true,
      result:
        data,
    });
  } catch (error) {
    console.error(
      "EVOLUTION REVIEW ROUTE ERROR:",
      error
    );

    return Response.json(
      {
        reviewed: false,
        error:
          "Evolution review failed.",
      },
      {
        status: 500,
      }
    );
  }
}
