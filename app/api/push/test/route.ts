import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

import webpush
  from "web-push";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const SUPABASE_URL =
  "https://tzozajnwznxqgxnjikoy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1";

type PushRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function getBearerToken(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return null;
  }

  return authorization
    .slice(7)
    .trim();
}

export async function POST(
  request: Request
) {
  try {
    const token =
      getBearerToken(
        request
      );

    if (!token) {
      return NextResponse.json(
        {
          error:
            "認証情報がありません。",
        },
        {
          status: 401,
        }
      );
    }

    const publicKey =
      process.env
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    const privateKey =
      process.env
        .VAPID_PRIVATE_KEY;

    const subject =
      process.env
        .VAPID_SUBJECT ||
      "mailto:misaki@example.com";

    if (
      !publicKey ||
      !privateKey
    ) {
      return NextResponse.json(
        {
          error:
            "VAPIDキーが設定されていません。",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      await request
        .json()
        .catch(
          () => ({})
        );

    const title =
      typeof body?.title ===
        "string" &&
      body.title.trim()
        ? body.title.trim()
        : "美咲";

    const message =
      typeof body?.body ===
        "string" &&
      body.body.trim()
        ? body.body.trim()
        : "美咲からメッセージだよ";

    const url =
      typeof body?.url ===
        "string" &&
      body.url.startsWith(
        "/"
      )
        ? body.url
        : "/chat";

    const supabase =
      createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
          global: {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },

          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      );

    const {
      data:
        userData,
      error:
        userError,
    } =
      await supabase
        .auth
        .getUser(
          token
        );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error:
            "ログイン情報を確認できませんでした。",
        },
        {
          status: 401,
        }
      );
    }

    const userId =
      userData.user.id;

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "push_subscriptions"
        )
        .select(
          "id,endpoint,p256dh,auth"
        )
        .eq(
          "user_id",
          userId
        );

    if (error) {
      console.error(
        "PUSH SUBSCRIPTIONS ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            "通知端末情報を取得できませんでした。",
        },
        {
          status: 500,
        }
      );
    }

    const subscriptions =
      (
        data ||
        []
      ) as PushRow[];

    if (
      subscriptions.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "通知を受け取る端末が登録されていません。",
        },
        {
          status: 404,
        }
      );
    }

    webpush
      .setVapidDetails(
        subject,
        publicKey,
        privateKey
      );

    const payload =
      JSON.stringify({
        title,
        body: message,
        url,
      });

    let sent = 0;
    let removed = 0;

    for (
      const subscription
        of subscriptions
    ) {
      try {
        await webpush
          .sendNotification(
            {
              endpoint:
                subscription
                  .endpoint,

              keys: {
                p256dh:
                  subscription
                    .p256dh,

                auth:
                  subscription
                    .auth,
              },
            },
            payload,
            {
              TTL:
                60 * 60,
            }
          );

        sent += 1;

        await supabase
          .from(
            "push_subscriptions"
          )
          .update({
            last_used_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            subscription.id
          )
          .eq(
            "user_id",
            userId
          );
      } catch (
        pushError:
          any
      ) {
        console.error(
          "WEB PUSH ERROR:",
          pushError
        );

        const statusCode =
          Number(
            pushError
              ?.statusCode
          );

        if (
          statusCode ===
            404 ||
          statusCode ===
            410
        ) {
          await supabase
            .from(
              "push_subscriptions"
            )
            .delete()
            .eq(
              "id",
              subscription.id
            )
            .eq(
              "user_id",
              userId
            );

          removed += 1;
        }
      }
    }

    if (
      sent ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Push通知を送信できませんでした。",
          removed,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      sent,
      removed,
    });
  } catch (error) {
    console.error(
      "PUSH TEST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Push通知の送信中にエラーが発生しました。",
      },
      {
        status: 500,
      }
    );
  }
}
