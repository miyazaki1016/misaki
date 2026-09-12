import {
  supabase,
} from "./supabase";

type PushSubscriptionJson = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding =
    "=".repeat(
      (
        4 -
        (
          base64String.length %
          4
        )
      ) %
        4
    );

  const base64 =
    (
      base64String +
      padding
    )
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );

  const rawData =
    window.atob(
      base64
    );

  const outputArray =
    new Uint8Array(
      rawData.length
    );

  for (
    let i = 0;
    i < rawData.length;
    i += 1
  ) {
    outputArray[i] =
      rawData.charCodeAt(
        i
      );
  }

  return outputArray;
}

async function getVapidPublicKey() {
  const response =
    await fetch(
      "/api/push/vapid-public-key",
      {
        method: "GET",
        cache: "no-store",
      }
    );

  if (!response.ok) {
    const text =
      await response.text();

    throw new Error(
      text ||
        "VAPID公開鍵を取得できませんでした。"
    );
  }

  const data =
    await response.json();

  if (
    !data ||
    typeof data.publicKey !==
      "string" ||
    !data.publicKey
  ) {
    throw new Error(
      "VAPID公開鍵が設定されていません。"
    );
  }

  return data.publicKey;
}

export async function registerPushSubscription() {
  if (
    !(
      "serviceWorker" in
      navigator
    )
  ) {
    throw new Error(
      "この端末はService Workerに対応していません。"
    );
  }

  if (
    !(
      "PushManager" in
      window
    )
  ) {
    throw new Error(
      "このブラウザはPush通知に対応していません。"
    );
  }

  const {
    data:
      sessionData,
    error:
      sessionError,
  } =
    await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const user =
    sessionData
      .session
      ?.user;

  if (!user) {
    throw new Error(
      "ログイン情報を確認できませんでした。"
    );
  }

  const registration =
    await navigator
      .serviceWorker
      .ready;

  const publicKey =
    await getVapidPublicKey();

  let subscription =
    await registration
      .pushManager
      .getSubscription();

  if (!subscription) {
    subscription =
      await registration
        .pushManager
        .subscribe({
          userVisibleOnly:
            true,

          applicationServerKey:
            urlBase64ToUint8Array(
              publicKey
            ),
        });
  }

  const json =
    subscription.toJSON() as
      PushSubscriptionJson;

  const endpoint =
    json.endpoint;

  const p256dh =
    json.keys?.p256dh;

  const auth =
    json.keys?.auth;

  if (
    !endpoint ||
    !p256dh ||
    !auth
  ) {
    throw new Error(
      "Push通知端末情報を取得できませんでした。"
    );
  }

  const {
    error,
  } =
    await supabase
      .from(
        "push_subscriptions"
      )
      .upsert(
        {
          user_id:
            user.id,

          endpoint,

          p256dh,

          auth,

          user_agent:
            navigator.userAgent,

          updated_at:
            new Date()
              .toISOString(),

          last_used_at:
            new Date()
              .toISOString(),
        },
        {
          onConflict:
            "user_id,endpoint",
        }
      );

  if (error) {
    throw error;
  }

  return subscription;
}

export async function sendTestPushNotification(
  accessToken: string
) {
  const response =
    await fetch(
      "/api/push/test",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },

        body:
          JSON.stringify({
            title:
              "美咲",

            body:
              "通知テストだよ。ちゃんと届いた？☺️",

            url:
              "/chat",
          }),
      }
    );

  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "テスト通知を送れませんでした。"
    );
  }

  return data;
}
