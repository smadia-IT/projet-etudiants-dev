// ============================================
// SERVICE WORKER — Notifications Push
// ============================================

self.addEventListener("install", (event) => {
    console.log("Service Worker installé");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("Service Worker activé");
    event.waitUntil(clients.claim());
});

// ============================================
// RÉCEPTION D'UN PUSH
// ============================================
self.addEventListener("push", (event) => {
    console.log("Push reçu :", event);

    let data = {
        title: "Étudiants IT",
        body: "Nouvelle notification",
        url: "/",
        icon: "/icon-192.png",
        badge: "/icon-192.png"
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [200, 100, 200],
        data: { url: data.url },
        actions: [
            { action: "open", title: "Ouvrir" },
            { action: "close", title: "Fermer" }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ============================================
// CLIC SUR UNE NOTIFICATION
// ============================================
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.action === "close") return;

    const urlToOpen = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                // Si une fenêtre est déjà ouverte, on la focus
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && "focus" in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // Sinon on ouvre une nouvelle fenêtre
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});