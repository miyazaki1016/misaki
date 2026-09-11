"use client";

import { useState } from "react";

function base64UrlFromBytes(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(
      value.length + ((4 - (value.length % 4)) % 4),
      "="
    );

  const binary = atob(base64);

  return Uint8Array.from(
    binary,
    (char) => char.charCodeAt(0)
  );
}

export default function VapidGeneratorPage() {
  const [publicKey, setPublicKey] =
    useState("");

  const [privateKey, setPrivateKey] =
    useState("");

  const [error, setError] =
    useState("");

  async function generateKeys() {
    try {
      setError("");
      setPublicKey("");
      setPrivateKey("");

      const keyPair =
        (await crypto.subtle.generateKey(
          {
            name: "ECDSA",
            namedCurve: "P-256",
          },
          true,
          ["sign", "verify"]
        )) as CryptoKeyPair;

      const publicJwk =
        await crypto.subtle.exportKey(
          "jwk",
          keyPair.publicKey
        );

      const privateJwk =
        await crypto.subtle.exportKey(
          "jwk",
          keyPair.privateKey
        );

      if (
        !publicJwk.x ||
        !publicJwk.y ||
        !privateJwk.d
      ) {
        throw new Error(
          "鍵の生成に失敗しました。"
        );
      }

      const x =
        base64UrlToBytes(publicJwk.x);

      const y =
        base64UrlToBytes(publicJwk.y);

      // Web Push用の公開鍵は
      // 0x04 + X(32byte) + Y(32byte)
      const publicBytes =
        new Uint8Array(65);

      publicBytes[0] = 4;
      publicBytes.set(x, 1);
      publicBytes.set(y, 33);

      setPublicKey(
        base64UrlFromBytes(publicBytes)
      );

      setPrivateKey(privateJwk.d);
    } catch (err) {
      console.error(err);

      setError(
        "VAPIDキーの生成に失敗しました。"
      );
    }
  }

  async function copyText(
    text: string,
    label: string
  ) {
    try {
      await navigator.clipboard.writeText(
        text
      );

      alert(`${label}をコピーしました。`);
    } catch {
      alert(
        "コピーできませんでした。長押ししてコピーしてください。"
      );
    }
  }

  return (
    <main
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1>VAPIDキー生成</h1>

      <p
        style={{
          lineHeight: 1.7,
        }}
      >
        美咲のWeb Push通知専用の鍵を、
        この端末内で生成します。
      </p>

      <button
        onClick={generateKeys}
        style={{
          border: "none",
          borderRadius: "12px",
          padding: "14px 20px",
          fontSize: "16px",
          fontWeight: 700,
          background: "#ff6b81",
          color: "#fff",
        }}
      >
        新しいVAPIDキーを生成
      </button>

      {error && (
        <p
          style={{
            marginTop: "20px",
            color: "red",
          }}
        >
          {error}
        </p>
      )}

      {publicKey && (
        <section
          style={{
            marginTop: "28px",
          }}
        >
          <h2>公開鍵</h2>

          <p>
            Vercelの
            <strong>
              {" "}
              NEXT_PUBLIC_VAPID_PUBLIC_KEY
            </strong>
            に入れます。
          </p>

          <textarea
            readOnly
            value={publicKey}
            style={{
              width: "100%",
              minHeight: "110px",
              padding: "12px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={() =>
              copyText(
                publicKey,
                "公開鍵"
              )
            }
            style={{
              marginTop: "8px",
              padding: "10px 14px",
            }}
          >
            公開鍵をコピー
          </button>
        </section>
      )}

      {privateKey && (
        <section
          style={{
            marginTop: "28px",
          }}
        >
          <h2>秘密鍵</h2>

          <p>
            Vercelの
            <strong>
              {" "}
              VAPID_PRIVATE_KEY
            </strong>
            に入れます。
          </p>

          <textarea
            readOnly
            value={privateKey}
            style={{
              width: "100%",
              minHeight: "110px",
              padding: "12px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={() =>
              copyText(
                privateKey,
                "秘密鍵"
              )
            }
            style={{
              marginTop: "8px",
              padding: "10px 14px",
            }}
          >
            秘密鍵をコピー
          </button>
        </section>
      )}

      {privateKey && (
        <div
          style={{
            marginTop: "30px",
            padding: "14px",
            borderRadius: "12px",
            background: "#fff3f5",
            lineHeight: 1.7,
          }}
        >
          <strong>重要</strong>
          <br />
          秘密鍵はこのチャットやGitHubには貼らないでください。
          Vercelの環境変数にだけ保存します。
        </div>
      )}
    </main>
  );
}
