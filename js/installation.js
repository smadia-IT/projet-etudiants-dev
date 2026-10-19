// ============================================
// INSTALLATION DE L'APPLI (PC, Android, iPhone)
// ============================================
(function () {
    // Déjà ouverte depuis son icône : aucun bandeau
    const estInstallee = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (estInstallee) return;

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

    // Une fois installée, le bandeau disparaît
    window.addEventListener("appinstalled", masquer);

    // Sur iPhone, il n'y a pas d'événement : on affiche le bandeau directement
    if (estIphone) setTimeout(afficher, 2500);

    function afficher() {
        if (bandeau) return;
        if (!invitation && !estIphone) return; // rien à proposer

        bandeau = document.createElement("div");
        bandeau.id = "banniere-installation";
        bandeau.innerHTML = `
            <div class="banniere-texte"></div>
            <div class="banniere-actions">
                <button id="btn-install" class="btn-primaire">Installer</button>
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
    }

    async function onInstaller() {
        if (invitation) {
            const evenement = invitation;
            invitation = null; // Chrome n'accepte cet événement qu'une fois
            evenement.prompt(); // doit être appelé directement depuis le clic
            const choix = await evenement.userChoice;
            if (choix.outcome === "accepted") {
                masquer(); // l'événement appinstalled le fait aussi
            } else {
                masquer(); // refusé : on cache le bandeau pour cette visite
            }
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