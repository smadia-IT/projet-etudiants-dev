// ============================================
// INSTALLATION DE L'APPLI (PC, Android, iPhone)
// ============================================
(function () {
    const CLE_REFUS = "installRefusLe";
    const DELAI_REFUS = 7 * 24 * 60 * 60 * 1000; // une semaine

    // Déjà ouverte depuis son icône : rien à proposer
    const estInstallee = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (estInstallee) return;

    // L'utilisateur a cliqué « Plus tard » il y a moins d'une semaine
    const refusRecent = Date.now() - Number(localStorage.getItem(CLE_REFUS) || 0) < DELAI_REFUS;
    if (refusRecent) return;

    const ua = navigator.userAgent;
    const estIphone = /iPhone|iPad|iPod/.test(ua);
    // Sur iPhone, seul Safari sait ajouter l'appli à l'écran d'accueil
    const estSafariIOS = estIphone && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

    let invitation = null; // événement d'installation (PC, Android)
    let bandeau = null;

    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        invitation = e;
        majBandeau();
    });

    window.addEventListener("appinstalled", function () {
        if (!bandeau) return;
        bandeau.innerHTML = `<div class="banniere-texte">✅ <strong>Étudiants IT est installée !</strong> Retrouve-la dans ton tiroir d'applications ou sur ton écran d'accueil.</div>`;
        setTimeout(() => { if (bandeau) { bandeau.remove(); bandeau = null; } }, 6000);
    });

    setTimeout(afficher, 2500);

    function afficher() {
        if (bandeau) return;
        bandeau = document.createElement("div");
        bandeau.id = "banniere-installation";
        bandeau.innerHTML = `
            <div class="banniere-texte"></div>
            <div class="banniere-actions">
                <button id="btn-install" class="btn-primaire">Installer</button>
                <button id="btn-plus-tard" class="btn-secondaire">Plus tard</button>
            </div>
        `;
        document.body.appendChild(bandeau);
        bandeau.querySelector("#btn-install").addEventListener("click", onInstaller);
        bandeau.querySelector("#btn-plus-tard").addEventListener("click", function () {
            localStorage.setItem(CLE_REFUS, String(Date.now()));
            bandeau.remove();
            bandeau = null;
        });
        majBandeau();
    }

    function majBandeau() {
        if (!bandeau) return;
        const texte = bandeau.querySelector(".banniere-texte");
        const bouton = bandeau.querySelector("#btn-install");

        if (estIphone && !estSafariIOS) {
            texte.innerHTML = `📲 Pour installer l'appli sur iPhone, ouvre ce site dans <strong>Safari</strong>.`;
            bouton.style.display = "none";
        } else if (estIphone) {
            texte.innerHTML = `📲 <strong>Installe Étudiants IT</strong> sur ton écran d'accueil.`;
            bouton.style.display = "";
            bouton.textContent = "Comment ?";
        } else if (invitation) {
            texte.innerHTML = `📲 <strong>Installe Étudiants IT</strong> pour un accès rapide, comme une vraie appli.`;
            bouton.style.display = "";
            bouton.textContent = "Installer";
        } else {
            texte.innerHTML = `📲 <strong>Installe Étudiants IT</strong> depuis le menu (les 3 points) de Chrome.`;
            bouton.style.display = "";
            bouton.textContent = "Comment ?";
        }
    }

    async function onInstaller() {
        const bouton = bandeau.querySelector("#btn-install");

        if (invitation) {
            const evenement = invitation;
            invitation = null;
            bouton.disabled = true;
            bouton.textContent = "⏳ En cours...";
            evenement.prompt(); // doit être appelé directement depuis le clic
            const choix = await evenement.userChoice;
            bouton.disabled = false;
            if (choix.outcome !== "accepted") {
                bouton.textContent = "Comment ?";
                alert("Pas de souci. Tu pourras l'installer plus tard depuis le menu (les 3 points) de Chrome → « Installer l'application ».");
            }
            return;
        }

        if (estSafariIOS) {
            alert("Touche le bouton Partager ⬆️ en bas de Safari, puis « Sur l'écran d'accueil », puis « Ajouter ».");
        } else if (estIphone) {
            alert("Ouvre ce site dans Safari, puis touche Partager ⬆️ et « Sur l'écran d'accueil ».");
        } else {
            alert("Ouvre le menu (les 3 points) de Chrome, puis touche « Installer l'application ».");
        }
    }
})();