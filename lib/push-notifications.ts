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

  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "VAPID公開鍵を取得できませんでした。"
    );
  }

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

async function getCurrentUser() {
  const {
    data,
    error,
  } =
    await supabase
      .auth
      .getSession();

  if (error) {
    throw error;
  }

  const user =
    data
      .session
      ?.user;

  if (!user) {
    throw new Error(
      "ログイン情報を確認できませんでした。ページを再読み込みしてね。"
    );
  }

  return user;
}

export async function registerPushSubscription() {
  if (
    typeof window ===
    "undefined"
  ) {
    throw new Error(
      "Push通知はブラウザ上でのみ設定できます。"
    );
  }

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

  if (
    !(
      "Notification" in
      window
    )
  ) {
    throw new Error(
      "このブラウザは通知機能に対応していません。"
    );
  }

  if (
    Notification
      .permission !==
    "granted"
  ) {
    throw new Error(
      "通知がまだ許可されていません。"
    );
  }

  const user =
    await getCurrentUser();

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
    subscription
      .toJSON() as
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

  const now =
    new Date()
      .toISOString();

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
            navigator
              .userAgent,

          updated_at:
            now,

          last_used_at:
            now,
        },
        {
          onConflict:
            "user_id,endpoint",
        }
      );

  if (error) {
    console.error(
      "Push subscription save failed:",
      error
    );

    throw new Error(
      "通知端末の登録に失敗しました。"
    );
  }

  return subscription;
}

export async function getPushSubscription() {
  if (
    typeof window ===
    "undefined" ||
    !(
      "serviceWorker" in
      navigator
    ) ||
    !(
      "PushManager" in
      window
    )
  ) {
    return null;
  }

  const registration =
    await navigator
      .serviceWorker
      .ready;

  return registration
    .pushManager
    .getSubscription();
}

export async function unregisterPushSubscription() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const subscription =
    await getPushSubscription();

  if (!subscription) {
    return;
  }

  const endpoint =
    subscription
      .endpoint;

  try {
    const user =
      await getCurrentUser();

    const {
      error,
    } =
      await supabase
        .from(
          "push_subscriptions"
        )
        .delete()
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "endpoint",
          endpoint
        );

    if (error) {
      console.error(
        "Push subscription delete failed:",
        error
      );
    }
  } catch (error) {
    console.error(
      "Push subscription user lookup failed:",
      error
    );
  }

  try {
    await subscription
      .unsubscribe();
  } catch (error) {
    console.error(
      "Browser push unsubscribe failed:",
      error
    );
  }
}

export async function sendTestPushNotification(
  accessToken:
    string
) {
  const response =
    await fetch(
      "/api/push/test",
      {
        method:
          "POST",

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
