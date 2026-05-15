/**
 * Web Push Notifications — Service Worker Push Handler
 * Receives push events from server and shows notifications
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, icon, badge, tag, url, image, actions } = data;

    const options = {
      body: body || "Nova atualização no CineFlux",
      icon: icon || "/icon-192.png",
      badge: badge || "/icon-72.png",
      tag: tag || "cineflux-notification",
      requireInteraction: false,
      renotify: true,
      data: {
        url: url || "/",
      },
      actions: actions || [
        { action: "open", title: "Ver agora" },
        { action: "close", title: "Fechar" },
      ],
    };

    if (image) options.image = image;

    event.waitUntil(
      self.registration.showNotification(title || "CineFlux", options)
    );
  } catch (err) {
    console.error("Push notification error:", err);
  }
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  if (event.action === "close") return;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing tab if open
        for (const client of clientList) {
          if (client.url.includes(self.location.host) && "focus" in client) {
            client.focus();
            client.postMessage({ type: "navigate", url });
            return;
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Handle notification close (mark as read)
self.addEventListener("notificationclose", (event) => {
  const tag = event.notification.tag;
  if (tag) {
    console.log("Notification closed:", tag);
  }
});
