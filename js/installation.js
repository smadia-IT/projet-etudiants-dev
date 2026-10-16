// ============================================
// BANNIÈRE D'INSTALLATION (Android et iPhone)
// ============================================
(function () {
    // Déjà installée : rien à faire
    const estInstallee = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (estInstallee) return;

    // Refus récent : on ne redérange pas pendant 7 jours
    const CLE_REFUS = "installationRefus";
    const dernierRefus = parseInt(localStorage.getItem(CLE_REFUS) || "0", 10);
    if (dernierRefus && Date.now() - dernierRefus < 7 * 24 * 60 * 60 * 1000) return;

    const estIphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    let invitationInstall = null;

    // Android / Chrome : on garde l'événement pour déclencher l'installation au clic
    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        invitationInstall = e;
        afficher();
    });

    // iPhone : pas d'événement, on affiche les instructions après un délai
    if (estIphone) {
        setTimeout(afficher, 3000);
    }

    // Si Chrome Android ne propose rien après quelques secondes, on affiche les étapes manuelles
    if (!estIphone) {
        setTimeout(function () {
            if (!invitationInstall) afficher();
        }, 5000);
    }

    let bandeauAffiche = false;

    function afficher() {
        if (bandeauAffiche) return;
        bandeauAffiche = true;

        const bandeau = document.createElement("div");
        bandeau.id = "banniere-installation";

        if (estIphone) {
            bandeau.innerHTML = `
                <div class="banniere-texte">
                    📲 <strong>Installe Étudiants IT</strong> sur ton écran d'accueil.<br>
                    <span class="banniere-aide">Touche <strong>Partager</strong> ⬆️ puis <strong>Sur l'écran d'accueil</strong>.</span>
                </div>
                <div class="banniere-actions">
                    <button id="btn-install-fermer" class="btn-secondaire">OK</button>
                </div>
            `;
        } else if (invitationInstall) {
            bandeau.innerHTML = `
                <div class="banniere-texte">
                    📲 <strong>Installe Étudiants IT</strong> pour un accès rapide, comme une vraie appli.
                </div>
                <div class="banniere-actions">
                    <button id="btn-install-oui" class="btn-primaire">Installer</button>
                    <button id="btn-install-non" class="btn-secondaire">Plus tard</button>
                </div>
            `;
        } else {
            bandeau.innerHTML = `
                <div class="banniere-texte">
                    📲 <strong>Installe Étudiants IT</strong> depuis le menu ⋮ de Chrome, puis <strong>Installer l'application</strong>.
                </div>
                <div class="banniere-actions">
                    <button id="btn-install-non" class="btn-secondaire">Plus tard</button>
                </div>
            `;
        }

        document.body.appendChild(bandeau);

        const btnOui = document.getElementById("btn-install-oui");
        if (btnOui) {
            btnOui.addEventListener("click", async function () {
                invitationInstall.prompt();
                await invitationInstall.userChoice;
                invitationInstall = null;
                bandeau.remove();
            });
        }

        const btnNon = document.getElementById("btn-install-non");
        if (btnNon) {
            btnNon.addEventListener("click", function () {
                localStorage.setItem(CLE_REFUS, String(Date.now()));
                bandeau.remove();
            });
        }

        const btnFermer = document.getElementById("btn-install-fermer");
        if (btnFermer) {
            btnFermer.addEventListener("click", function () {
                localStorage.setItem(CLE_REFUS, String(Date.now()));
                bandeau.remove();
            });
        }
    }
})();