const CACHE_PAGES = "etudiants-it-v5";
const CACHE_API = "etudiants-it-api-v1";

const API_ORIGINE = "https://projet-etudiants-it-backend.onrender.com";
const SUPABASE_ORIGINE = "https://vkgicastbfhgkemffbpw.supabase.co";
const ORIGINES_CACHEES = [API_ORIGINE, SUPABASE_ORIGINE];

// Tout ce dont le site a besoin pour fonctionner hors ligne
const FICHIERS_ESSENTIELS = [
    "/", "/index.html", "/dictionnaire.html", "/revision.html", "/quiz.html",
    "/documents.html", "/messages.html", "/amis.html", "/chat.html",
    "/forum.html", "/profil.html", "/offline.html",
    "/css/style.css",
    "/js/config.js","/js/app-nav.js", "/js/chargement.js", "/js/theme.js", "/js/nav-dropdown.js",
    "/js/header-auth.js", "/js/avatar-utils.js", "/js/push.js", "/js/chatbot.js",
    "/js/accueil.js", "/js/accueil-dynamique.js", "/js/badges.js", "/js/badges-data.js",
    "/js/revision-data.js", "/js/revision.js", "/js/dictionnaire.js", "/js/quiz.js",
    "/js/sons.js", "/js/documents.js", "/js/chat.js", "/js/hors-ligne.js",
    "/js/messages.js", "/js/messages-mobile.js", "/js/notif-sonore.js",
    "/js/amis.js", "/js/forum.js", "/js/sujet.js", "/js/profil.js", "/js/profil-public.js",
    "/data/dictionnaire.json", "/data/documents.json",
    "/icon-192.png", "/icon-512.png"
];

// Met en cache chaque fichier séparément : un fichier absent ne bloque pas les autres
async function precharger(liste) {
    const cache = await caches.open(CACHE_PAGES);
    await Promise.all(liste.map(async (url) => {
        try {
            const reponse = await fetch(url, { cache: "no-cache" });
            if (reponse.ok) await cache.put(url, reponse);
        } catch (erreur) {
            console.warn("Non mis en cache :", url);
        }
    }));
}

self.addEventListener("install", (event) => {
    console.log("Service Worker installé");
    event.waitUntil(precharger(FICHIERS_ESSENTIELS));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("Service Worker activé");
    event.waitUntil(
        caches.keys()
            .then((noms) => Promise.all(
                noms
                    .filter((nom) => nom !== CACHE_PAGES && nom !== CACHE_API)
                    .map((nom) => caches.delete(nom))
            ))
            .then(() => clients.claim())
    );
});
// ============================================
// RÉPONSE DE SECOURS QUAND ON EST HORS LIGNE
// ============================================
function reponseHorsLigne(requete) {
    if (new URL(requete.url).origin === API_ORIGINE) {
        return new Response(
            JSON.stringify({ success: false, error: "Hors connexion" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
        );
    }
    return Response.error();
}

// ============================================
// GESTION DES REQUÊTES
// Réseau d'abord : quand on est en ligne, on a toujours la version la plus récente.
// Hors ligne : on prend la copie gardée dans le cache.
// ============================================
self.addEventListener("fetch", (event) => {
    const requete = event.request;

    if (requete.method !== "GET") return;

    const url = new URL(requete.url);

    // 1. API et images Supabase : données mises en cache séparément
    if (ORIGINES_CACHEES.includes(url.origin)) {
        event.respondWith(
            fetch(requete)
                .then((reponse) => {
                    if (reponse.status === 200) {
                        const copie = reponse.clone();
                        caches.open(CACHE_API).then((cache) => cache.put(requete, copie));
                    }
                    return reponse;
                })
                .catch(() =>
                    caches.match(requete).then((enCache) => enCache || reponseHorsLigne(requete))
                )
        );
        return;
    }

    // 2. Autres sites (Gemini, etc.) : on ne touche pas
    if (url.origin !== self.location.origin) return;

    // 3. Pages et fichiers du site
    event.respondWith(
        fetch(requete)
            .then((reponse) => {
                if (reponse.ok) {
                    const copie = reponse.clone();
                    caches.open(CACHE_PAGES).then((cache) => cache.put(requete, copie));
                }
                return reponse;
            })
            .catch(() =>
                // ignoreSearch : messages.html?user=8 utilise la page messages.html en cache
                caches.match(requete, { ignoreSearch: true }).then((enCache) => {
                    if (enCache) return enCache;
                    if (requete.mode === "navigate") return caches.match("/offline.html");
                    return Response.error();
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
        tag: data.tag || "etudiants-it",
        renotify: true,
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