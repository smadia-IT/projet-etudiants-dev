// ============================================
// BANNIÈRE D'INSTALLATION (Android et iPhone)
// Un seul bouton : Installer
// ============================================
(function () {
    const estInstallee = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

    // Mémorise l'installation avant tout arrêt du script
    if (estInstallee) {
        localStorage.setItem("appInstallee", "1");
        return;
    }
    if (localStorage.getItem("appInstallee") === "1") return;

    window.addEventListener("appinstalled", function () {
        localStorage.setItem("appInstallee", "1");
        const bandeau = document.getElementById("banniere-installation");
        if (bandeau) bandeau.remove();
    });

    const estIphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    let invitationInstall = null;
    let bandeauAffiche = false;

    // Chrome Android : l'installation directe est possible
    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        invitationInstall = e;
        afficher();
    });

    // iPhone : pas d'événement, on affiche après 3 secondes
    // Autres navigateurs : si Chrome ne propose rien, on affiche après 5 secondes
    if (estIphone) {
        setTimeout(afficher, 3000);
    } else {
        setTimeout(function () {
            if (!invitationInstall) afficher();
        }, 5000);
    }

    function afficher() {
        if (bandeauAffiche) return;
        bandeauAffiche = true;

        const bandeau = document.createElement("div");
        bandeau.id = "banniere-installation";

        let texte;
        if (estIphone) {
            texte = `📲 <strong>Installe Étudiants IT</strong> sur ton écran d'accueil.<br>
                <span class="banniere-aide">Touche <strong>Partager</strong> ⬆️ puis <strong>Sur l'écran d'accueil</strong>.</span>`;
        } else {
            texte = `📲 <strong>Installe Étudiants IT</strong> sur ton écran d'accueil.<br>
                <span class="banniere-aide">Menu ⋮ de Chrome → <strong>Installer l'application</strong>.</span>`;
        }

        bandeau.innerHTML = `
            <div class="banniere-texte">${texte}</div>
            <div class="banniere-actions">
                <button id="btn-install-oui" class="btn-primaire">Installer</button>
            </div>
        `;
        document.body.appendChild(bandeau);

        document.getElementById("btn-install-oui").addEventListener("click", async function () {
            if (invitationInstall) {
                // Installation directe proposée par Chrome
                invitationInstall.prompt();
                await invitationInstall.userChoice;
                invitationInstall = null;
                bandeau.remove();
            } else {
                // Pas d'installation directe : on explique où trouver le bouton
                alert(estIphone
                    ? "Touche le bouton Partager ⬆️ en bas de Safari, puis « Sur l'écran d'accueil »."
                    : "Ouvre le menu ⋮ de Chrome (en haut à droite), puis touche « Installer l'application ».");
            }
        });
    }
})();