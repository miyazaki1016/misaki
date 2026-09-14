"use client";

import {
  useEffect,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

type ProactiveDelivery = {
  id: string;
  message: string;
  photo_id: string | null;
  photo_src: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
};

const POLL_MS =
  5_000;

function getMisakiBubbles() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      ".chat .bubble:not(.user):not(.typingBubble)"
    )
  );
}

function createPhotoElement(
  delivery: ProactiveDelivery
) {
  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.setAttribute(
    "data-misaki-proactive-photo",
    "true"
  );

  wrapper.setAttribute(
    "data-delivery-id",
    delivery.id
  );

  if (
    delivery.photo_id
  ) {
    wrapper.setAttribute(
      "data-photo-id",
      delivery.photo_id
    );
  }

  Object.assign(
    wrapper.style,
    {
      width:
        "min(72%, 330px)",

      margin:
        "6px 0 14px 0",

      borderRadius:
        "18px",

      overflow:
        "hidden",

      boxShadow:
        "0 8px 24px rgba(73, 56, 62, 0.10)",
    }
  );

  const image =
    document.createElement(
      "img"
    );

  image.src =
    delivery.photo_src ?? "";

  image.alt =
    "美咲";

  image.loading =
    "lazy";

  Object.assign(
    image.style,
    {
      display:
        "block",

      width:
        "100%",

      height:
        "auto",
    }
  );

  wrapper.appendChild(
    image
  );

  return wrapper;
}

function renderDeliveries(
  deliveries:
    ProactiveDelivery[]
) {
  document
    .querySelectorAll(
      '[data-misaki-proactive-photo="true"]'
    )
    .forEach(
      (node) =>
        node.remove()
    );

  const bubbles =
    getMisakiBubbles();

  if (
    bubbles.length ===
    0
  ) {
    return;
  }

  const used =
    new Set<number>();

  const newestFirst =
    [...deliveries]
      .filter(
        (delivery) =>
          typeof delivery
            .photo_src ===
            "string" &&
          delivery
            .photo_src
            .trim()
            .length >
            0
      )
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            b.created_at
          ).getTime() -
          new Date(
            a.created_at
          ).getTime()
      );

  for (
    const delivery
    of newestFirst
  ) {
    let matchedIndex =
      -1;

    for (
      let index =
        bubbles.length -
        1;
      index >= 0;
      index -=
        1
    ) {
      if (
        used.has(
          index
        )
      ) {
        continue;
      }

      const text =
        bubbles[
          index
        ]
          .textContent
          ?.trim() ??
        "";

      if (
        text ===
        delivery.message
          .trim()
      ) {
        matchedIndex =
          index;

        break;
      }
    }

    if (
      matchedIndex <
      0
    ) {
      continue;
    }

    used.add(
      matchedIndex
    );

    const bubble =
      bubbles[
        matchedIndex
      ];

    const photo =
      createPhotoElement(
        delivery
      );

    bubble
      .insertAdjacentElement(
        "afterend",
        photo
      );
  }
}

async function loadDeliveries() {
  const {
    data:
      sessionData,
  } =
    await supabase
      .auth
      .getSession();

  if (
    !sessionData
      .session
  ) {
    return [];
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "misaki_proactive_deliveries"
      )
      .select(
        "id,message,photo_id,photo_src,status,created_at,delivered_at"
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .limit(
        20
      );

  if (
    error
  ) {
    console.error(
      "PROACTIVE DELIVERY LOAD ERROR:",
      error
    );

    return [];
  }

  return (
    Array.isArray(
      data
    )
      ? data
      : []
  ) as
    ProactiveDelivery[];
}

export default function ProactivePhotoDisplay() {
  useEffect(
    () => {
      let active =
        true;

      let renderTimer =
        0;

      const refresh =
        async () => {
          const deliveries =
            await loadDeliveries();

          if (
            !active
          ) {
            return;
          }

          renderDeliveries(
            deliveries
          );
        };

      const scheduleRender =
        () => {
          window.clearTimeout(
            renderTimer
          );

          renderTimer =
            window.setTimeout(
              () => {
                void refresh();
              },
              150
            );
        };

      void refresh();

      const observer =
        new MutationObserver(
          scheduleRender
        );

      observer.observe(
        document.body,
        {
          childList:
            true,

          subtree:
            true,
        }
      );

      const interval =
        window.setInterval(
          () => {
            void refresh();
          },
          POLL_MS
        );

      const onFocus =
        () => {
          void refresh();
        };

      const onVisibility =
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            void refresh();
          }
        };

      window.addEventListener(
        "focus",
        onFocus
      );

      document.addEventListener(
        "visibilitychange",
        onVisibility
      );

      const {
        data:
          authListener,
      } =
        supabase
          .auth
          .onAuthStateChange(
            () => {
              window.setTimeout(
                () => {
                  void refresh();
                },
                0
              );
            }
          );

      return () => {
        active =
          false;

        observer.disconnect();

        window.clearInterval(
          interval
        );

        window.clearTimeout(
          renderTimer
        );

        window.removeEventListener(
          "focus",
          onFocus
        );

        document.removeEventListener(
          "visibilitychange",
          onVisibility
        );

        authListener
          .subscription
          .unsubscribe();
      };
    },
    []
  );

  return null;
}
