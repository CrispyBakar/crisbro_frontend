self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Crisbro", {
      body: data.body || "",
      icon: "/icons/crisbar-icon.png",
      badge: "/icons/crisbar-icon.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  );

  // Hanya buka halaman milik Crisbro sendiri
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = windows.find((client) => "focus" in client);

      if (existing) {
        await existing.focus();
        try {
          await existing.navigate(target.href);
          return;
        } catch {}
      }

      await self.clients.openWindow(target.href);
    })(),
  );
});
