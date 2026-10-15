// ============================================
// BANNIÈRE D'ACTIVATION DES NOTIFICATIONS
// Affichée sur toutes les pages tant que l'utilisateur n'est pas abonné
// ============================================
(function () {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!("Notification" in window)) return;
    if (typeof PushManager === "undefined") return;
    if (Notification.permission === "denied") return;

    // Si l'utilisateur a dit « Plus tard » récemment, on ne le redérange pas (3 jours)
    const CLE_REFUS = "notifBanniereRefus";
    const dernierRefus = parseInt(localStorage.getItem(CLE_REFUS) || "0", 10);
    if (dernierRefus && Date.now() - dernierRefus < 3 * 24 * 60 * 60 * 1000) return;

    async function afficherBanniere() {
        const dejaAbonne = await PushManager.estAbonne();
        if (dejaAbonne) return;

        const bandeau = document.createElement("div");
        bandeau.id = "banniere-notifs";
        bandeau.innerHTML = `
            <div class="banniere-texte">
                🔔 <strong>Reçois une alerte</strong> pour tes messages, demandes d'amis et rappels.
            </div>
            <div class="banniere-actions">
                <button id="btn-notifs-oui" class="btn-primaire">Activer</button>
                <button id="btn-notifs-non" class="btn-secondaire">Plus tard</button>
            </div>
        `;
        document.body.appendChild(bandeau);

        // Le clic est nécessaire : Chrome refuse la demande de permission sinon
        document.getElementById("btn-notifs-oui").addEventListener("click", async () => {
            const autorise = await PushManager.demanderPermission();
            if (autorise) {
                await PushManager.subscribe();
            }
            bandeau.remove();
        });

        document.getElementById("btn-notifs-non").addEventListener("click", () => {
            localStorage.setItem(CLE_REFUS, String(Date.now()));
            bandeau.remove();
        });
    }

    // Petit délai pour ne pas gêner le chargement de la page
    setTimeout(afficherBanniere, 2000);
})();