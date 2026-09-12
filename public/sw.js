self.addEventListener(
  "push",
  (event) => {
    let data = {};

    try {
      data =
        event.data
          ? event.data.json()
          : {};
    } catch {
      data = {
        body:
          event.data
            ? event.data.text()
            : "",
      };
    }

    const title =
      data.title ||
      "美咲";

    const options = {
      body:
        data.body ||
        "美咲からメッセージが届いたよ",

      icon:
        "/icon-192.png",

      badge:
        "/icon-192.png",

      tag:
        "misaki-message",

      renotify:
        true,

      data: {
        url:
          data.url ||
          "/chat",
      },
    };

    event.waitUntil(
      self.registration
        .showNotification(
          title,
          options
        )
    );
  }
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetUrl =
      event.notification
        .data
        ?.url ||
      "/chat";

    event.waitUntil(
      clients
        .matchAll({
          type:
            "window",

          includeUncontrolled:
            true,
        })
        .then(
          async (
            windowClients
          ) => {
            for (
              const client
                of windowClients
            ) {
              const clientUrl =
                new URL(
                  client.url
                );

              if (
                clientUrl.origin ===
                self.location.origin
              ) {
                if (
                  "navigate" in
                  client
                ) {
                  await client
                    .navigate(
                      targetUrl
                    );
                }

                if (
                  "focus" in
                  client
                ) {
                  return client
                    .focus();
                }
              }
            }

            if (
              clients.openWindow
            ) {
              return clients
                .openWindow(
                  targetUrl
                );
            }

            return undefined;
          }
        )
    );
  }
);
