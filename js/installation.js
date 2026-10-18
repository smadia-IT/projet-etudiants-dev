// ============================================
// BANNIÈRE D'INSTALLATION (Android et iPhone)
// ============================================
(function () {
    const estInstallee = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

    // Déjà installée : on le mémorise et on ne montre rien
    if (estInstallee) {
        localStorage.setItem("appInstallee", "1");
        return;
    }
    if (localStorage.getItem("appInstallee") === "1") return;

    const estIphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    let invitationInstall = null;
    let bandeau = null;

    // Installation terminée : confirmation puis disparition
    window.addEventListener("appinstalled", function () {
        localStorage.setItem("appInstallee", "1");
        if (bandeau) {
            bandeau.innerHTML = `<div class="banniere-texte">✅ <strong>C'est installé !</strong> Retrouve Étudiants IT sur ton écran d'accueil.</div>`;
            setTimeout(() => bandeau.remove(), 4000);
        }
    });

    // Android : Chrome propose l'installation directe
    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        invitationInstall = e;
        if (!bandeau) afficher();
        else reafficherAvecInstaller();
    });

    // iPhone : pas d'événement, on affiche les instructions après 3 secondes
    // Android sans installation directe : instructions manuelles après 8 secondes
    if (estIphone) {
        setTimeout(function () { if (!bandeau) afficher(); }, 3000);
    } else {
        setTimeout(function () { if (!bandeau) afficher(); }, 8000);
    }

    function construireBandeau() {
        const el = document.createElement("div");
        el.id = "banniere-installation";
        return el;
    }

    function texteInstruction() {
        if (estIphone) {
            return `📲 <strong>Installe Étudiants IT</strong> sur ton écran d'accueil.<br>
                <span class="banniere-aide">Touche <strong>Partager</strong> ⬆️ puis <strong>Sur l'écran d'accueil</strong>.</span>`;
        }
        return `📲 <strong>Installe Étudiants IT</strong> sur ton écran d'accueil.<br>
            <span class="banniere-aide">Menu ⋮ de Chrome → <strong>Installer l'application</strong>.</span>`;
    }

    function afficher() {
        bandeau = construireBandeau();
        bandeau.innerHTML = `
            <div class="banniere-texte">${texteInstruction()}</div>
            <div class="banniere-actions">
                ${invitationInstall
                    ? `<button id="btn-install-oui" class="btn-primaire">Installer</button>`
                    : `<button id="btn-install-fermer" class="btn-secondaire">Compris</button>`}
            </div>
        `;
        document.body.appendChild(bandeau);
        brancherBoutons();
    }

    // Si Chrome propose l'installation après l'affichage manuel, on met à jour le bandeau
    function reafficherAvecInstaller() {
        const actions = bandeau.querySelector(".banniere-actions");
        actions.innerHTML = `<button id="btn-install-oui" class="btn-primaire">Installer</button>`;
        brancherBoutons();
    }

    function brancherBoutons() {
        const btnOui = document.getElementById("btn-install-oui");
        if (btnOui) {
            btnOui.addEventListener("click", async function () {
                btnOui.disabled = true;
                btnOui.textContent = "⏳ Installation...";
                invitationInstall.prompt();
                const choix = await invitationInstall.userChoice;
                invitationInstall = null;
                if (choix.outcome === "accepted") {
                    btnOui.textContent = "⏳ Ajout en cours...";
                } else {
                    btnOui.disabled = false;
                    btnOui.textContent = "Installer";
                }
            });
        }

        const btnCompris = document.getElementById("btn-install-fermer");
        if (btnCompris) {
            btnCompris.addEventListener("click", function () {
                bandeau.remove();
            });
        }
    }
})();