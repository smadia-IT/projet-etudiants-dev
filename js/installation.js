// ============================================
// INSTALLATION DE L'APPLI (PC, Android, iPhone)
// ============================================
(function () {
    const CLE_REFUS = "installRefusLe";
    const DELAI_REFUS = 7 * 24 * 60 * 60 * 1000; // une semaine

    // Déjà ouverte depuis son icône : aucun bandeau
    const estInstallee = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (estInstallee) return;

    // L'utilisateur a fermé le bandeau il y a moins d'une semaine
    if (Date.now() - Number(localStorage.getItem(CLE_REFUS) || 0) < DELAI_REFUS) return;

    const ua = navigator.userAgent;
    const estIphone = /iPhone|iPad|iPod/.test(ua);
    const estSafariIOS = estIphone && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

    let invitation = null; // événement d'installation (PC, Android)
    let bandeau = null;

    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        invitation = e;
        setTimeout(afficher, 2500);
    });

    window.addEventListener("appinstalled", masquer);

    // Sur iPhone, il n'y a pas d'événement : on affiche directement
    if (estIphone) setTimeout(afficher, 2500);

    function afficher() {
        if (bandeau) return;
        if (!invitation && !estIphone) return;

        bandeau = document.createElement("div");
        bandeau.id = "banniere-installation";
        bandeau.innerHTML = `
            <div class="banniere-texte"></div>
            <div class="banniere-actions">
                <button id="btn-install" class="btn-primaire">Installer</button>
                <button id="btn-fermer-install" class="btn-secondaire" title="Fermer" aria-label="Fermer">✕</button>
            </div>
        `;
        document.body.appendChild(bandeau);

        const texte = bandeau.querySelector(".banniere-texte");
        if (estIphone && !estSafariIOS) {
            texte.innerHTML = `📲 Pour installer l'appli sur iPhone, ouvre ce site dans <strong>Safari</strong>.`;
        } else if (estIphone) {
            texte.innerHTML = `📲 <strong>Installe Étudiants IT</strong> sur ton écran d'accueil.`;
        } else {
            texte.innerHTML = `📲 <strong>Installe Étudiants IT</strong> pour un accès rapide, comme une vraie appli.`;
        }

        bandeau.querySelector("#btn-install").addEventListener("click", onInstaller);
        bandeau.querySelector("#btn-fermer-install").addEventListener("click", function () {
            localStorage.setItem(CLE_REFUS, String(Date.now()));
            masquer();
        });
    }

    async function onInstaller() {
        if (invitation) {
            const evenement = invitation;
            invitation = null; // Chrome n'accepte cet événement qu'une fois
            evenement.prompt(); // doit être appelé directement depuis le clic
            await evenement.userChoice;
            masquer();
            return;
        }

        if (estSafariIOS) {
            alert("Touche le bouton Partager ⬆️ en bas de Safari, puis « Sur l'écran d'accueil », puis « Ajouter ».");
        } else if (estIphone) {
            alert("Ouvre ce site dans Safari, puis touche Partager ⬆️ et « Sur l'écran d'accueil ».");
        }
    }

    function masquer() {
        if (bandeau) {
            bandeau.remove();
            bandeau = null;
        }
    }
})();