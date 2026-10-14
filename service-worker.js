// ============================================
// SERVICE WORKER — Notifications Push + Cache hors ligne
// ============================================

// Change ce numéro à chaque modification importante du fichier
const CACHE_NAME = "etudiants-it-v2";

const PAGES_ESSENTIELLES = [
    "/",
    "/index.html",
    "/dictionnaire.html",
    "/revision.html",
    "/quiz.html",
    "/documents.html",
    "/offline.html",
    "/css/style.css",
    "/data/dictionnaire.json",
    "/data/documents.json",
    "/icon-192.png",
    "/icon-512.png"
];

self.addEventListener("install", (event) => {
    console.log("Service Worker installé");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PAGES_ESSENTIELLES))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("Service Worker activé");
    event.waitUntil(
        caches.keys()
            .then((noms) => Promise.all(
                noms.filter((nom) => nom !== CACHE_NAME).map((nom) => caches.delete(nom))
            ))
            .then(() => clients.claim())
    );
});

// ============================================
// CACHE HORS LIGNE
// Réseau d'abord (toujours la version la plus récente),
// cache en secours si on est hors ligne.
// ============================================
self.addEventListener("fetch", (event) => {
    const requete = event.request;

    if (requete.method !== "GET") return;

    // On ne touche jamais aux autres sites (API Render, Supabase, Gemini)
    const url = new URL(requete.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(requete)
            .then((reponse) => {
                if (reponse.ok) {
                    const copie = reponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(requete, copie));
                }
                return reponse;
            })
            .catch(() =>
                caches.match(requete).then((enCache) => {
                    if (enCache) return enCache;
                    if (requete.mode === "navigate") return caches.match("/offline.html");
                })
            )
    );
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
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && "focus" in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});