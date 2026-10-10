// ============================================
// GESTION DES NOTIFICATIONS PUSH (FRONTEND)
// ============================================

const PushManager = {
    
    // ============================================
    // ENREGISTRER LE SERVICE WORKER
    // ============================================
    async init() {
        if (!("serviceWorker" in navigator)) {
            console.warn("Service Worker non supporté");
            return false;
        }

        if (!("PushManager" in window)) {
            console.warn("Push non supporté");
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.register("/service-worker.js");
            console.log("✅ Service Worker enregistré :", registration.scope);
            this.registration = registration;
            return true;
        } catch (erreur) {
            console.error("❌ Erreur Service Worker :", erreur);
            return false;
        }
    },

    // ============================================
    // DEMANDER LA PERMISSION
    // ============================================
    async demanderPermission() {
        const permission = await Notification.requestPermission();
        console.log("Permission :", permission);
        return permission === "granted";
    },

    // ============================================
    // S'ABONNER AUX NOTIFICATIONS
    // ============================================
    async subscribe() {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("Utilisateur non connecté");
            return false;
        }

        try {
            // Récupérer la clé publique VAPID
            const reponse = await fetch(`${API_URL}/push/public-key`);
            const data = await reponse.json();
            if (!data.success) throw new Error("Clé publique introuvable");

            const publicKey = data.publicKey;

            // Convertir la clé en Uint8Array
            const applicationServerKey = this.urlBase64ToUint8Array(publicKey);

            // Créer l'abonnement
            const subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });

            console.log("✅ Abonnement créé :", subscription);

            // Envoyer au backend
            const subReponse = await fetch(`${API_URL}/push/subscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(subscription.toJSON())
            });

            const subData = await subReponse.json();
            if (!subData.success) throw new Error(subData.error);

            console.log("✅ Abonnement envoyé au serveur");
            return true;

        } catch (erreur) {
            console.error("❌ Erreur abonnement :", erreur);
            return false;
        }
    },

    // ============================================
    // SE DÉSABONNER
    // ============================================
    async unsubscribe() {
        const token = localStorage.getItem("token");
        if (!token) return false;

        try {
            const subscription = await this.registration.pushManager.getSubscription();
            if (!subscription) return true;

            // Supprimer côté serveur
            await fetch(`${API_URL}/push/unsubscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });

            // Supprimer côté navigateur
            await subscription.unsubscribe();
            console.log("✅ Désabonné");
            return true;
        } catch (erreur) {
            console.error("❌ Erreur désabonnement :", erreur);
            return false;
        }
    },

    // ============================================
    // VÉRIFIER SI DÉJÀ ABONNÉ
    // ============================================
    async estAbonne() {
        if (!this.registration) return false;
        const subscription = await this.registration.pushManager.getSubscription();
        return !!subscription;
    },

    // ============================================
    // UTILITAIRE : Convertir la clé base64
    // ============================================
    urlBase64ToUint8Array(base64String) {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
};

// Initialiser au chargement
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => PushManager.init());
} else {
    PushManager.init();
}