"use client";

import {
  useEffect,
} from "react";

import {
  supabase,
} from "../lib/supabase";

const HISTORY_KEY =
  "misaki-chat-history";

const MEMORY_KEY =
  "misaki-long-term-memory";

const RELATIONSHIP_KEY =
  "misaki-relationship-points";

const TODAY_MEMORY_KEY =
  "misaki-today-memory";

function safeParse<T>(
  value: string | null,
  fallback: T
): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(
      value
    ) as T;
  } catch {
    return fallback;
  }
}

function getRelationshipPoints() {
  const raw =
    window.localStorage
      .getItem(
        RELATIONSHIP_KEY
      );

  if (!raw) {
    return 0;
  }

  const directNumber =
    Number(raw);

  if (
    Number.isFinite(
      directNumber
    )
  ) {
    return Math.max(
      0,
      Math.floor(
        directNumber
      )
    );
  }

  const parsed =
    safeParse<unknown>(
      raw,
      0
    );

  if (
    typeof parsed ===
      "number" &&
    Number.isFinite(
      parsed
    )
  ) {
    return Math.max(
      0,
      Math.floor(
        parsed
      )
    );
  }

  return 0;
}

async function syncBackgroundPushState() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const {
    data,
    error,
  } =
    await supabase.auth
      .getSession();

  if (error) {
    console.error(
      "BACKGROUND STATE SESSION ERROR:",
      error
    );
    return;
  }

  const user =
    data.session?.user;

  if (!user) {
    return;
  }

  const history =
    safeParse<unknown[]>(
      window.localStorage
        .getItem(
          HISTORY_KEY
        ),
      []
    );

  const memory =
    safeParse<unknown[]>(
      window.localStorage
        .getItem(
          MEMORY_KEY
        ),
      []
    );

  const todayMemory =
    safeParse<
      Record<string, unknown>
    >(
      window.localStorage
        .getItem(
          TODAY_MEMORY_KEY
        ),
      {
        date: "",
        items: [],
      }
    );

  const relationshipPoints =
    getRelationshipPoints();

  const recentHistory =
    Array.isArray(
      history
    )
      ? history.slice(-60)
      : [];

  const longTermMemory =
    Array.isArray(
      memory
    )
      ? memory.slice(-30)
      : [];

  const {
    error:
      upsertError,
  } =
    await supabase
      .from(
        "background_push_state"
      )
      .upsert(
        {
          user_id:
            user.id,

          relationship_points:
            relationshipPoints,

          long_term_memory:
            longTermMemory,

          today_memory:
            todayMemory,

          recent_history:
            recentHistory,

          notifications_enabled:
            Notification.permission ===
            "granted",

          timezone:
            Intl.DateTimeFormat()
              .resolvedOptions()
              .timeZone ||
            "Asia/Tokyo",

          updated_at:
            new Date()
              .toISOString(),
        },
        {
          onConflict:
            "user_id",
        }
      );

  if (
    upsertError
  ) {
    console.error(
      "BACKGROUND STATE SYNC ERROR:",
      upsertError
    );
  }
}

export default function BackgroundPushSync() {
  useEffect(
    () => {
      let cancelled =
        false;

      const run =
        async () => {
          if (
            cancelled
          ) {
            return;
          }

          await syncBackgroundPushState();
        };

      void run();

      const interval =
        window.setInterval(
          () => {
            void run();
          },
          60 * 1000
        );

      const handleVisibility =
        () => {
          if (
            document.visibilityState ===
            "hidden"
          ) {
            void run();
          }
        };

      const handlePageHide =
        () => {
          void run();
        };

      document.addEventListener(
        "visibilitychange",
        handleVisibility
      );

      window.addEventListener(
        "pagehide",
        handlePageHide
      );

      return () => {
        cancelled =
          true;

        window.clearInterval(
          interval
        );

        document.removeEventListener(
          "visibilitychange",
          handleVisibility
        );

        window.removeEventListener(
          "pagehide",
          handlePageHide
        );
      };
    },
    []
  );

  return null;
}
