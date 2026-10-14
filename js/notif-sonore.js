// ============================================
// SON + VIBRATION SUR LA LISTE DES CONVERSATIONS
// Quand le nombre de messages non lus augmente
// ============================================
(function () {
    const token = localStorage.getItem("token");
    if (!token || typeof API_URL === "undefined" || typeof signalerNouveauMessage !== "function") return;

    const CLE = "dernierNbNonLus";
    const headers = { "Authorization": `Bearer ${token}` };

    async function verifier() {
        // Si une conversation est ouverte, le signal vient déjà de messages.js
        const conv = document.getElementById("conversation-active");
        const conversationOuverte = conv && !conv.classList.contains("cache");

        try {
            const reponse = await fetch(`${API_URL}/messages/non-lus/count`, { headers });
            const data = await reponse.json();
            if (!data.success) return;

            const precedent = parseInt(sessionStorage.getItem(CLE));
            if (!conversationOuverte && !isNaN(precedent) && data.count > precedent) {
                signalerNouveauMessage();
            }
            // On mémorise toujours la valeur, même conversation ouverte
            sessionStorage.setItem(CLE, data.count);
        } catch (erreur) {
            // Pas grave : on réessaie au prochain tour
        }
    }

    verifier();
    setInterval(verifier, 10000);
})();