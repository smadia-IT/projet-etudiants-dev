// ============================================
// INSTALLATION DE L'APPLI (PC, Android, iPhone)
// ============================================
(function () {
    const CLE_INSTALLEE = "appInstallee";

    // Déjà installée (ouverte depuis son icône) : on le retient et on ne montre rien
    const estInstallee = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (estInstallee) {
        localStorage.setItem(CLE_INSTALLEE, "1");
        return;
    }
    if (localStorage.getItem(CLE_INSTALLEE) === "1") return;

    const ua = navigator.userAgent;
    const estIphone = /iPhone|iPad|iPod/.test(ua);
    const estChromeIOS = estIphone && /CriOS/.test(ua); // Chrome sur iPhone ne peut pas installer l'appli

    // Événement d'installation (PC, Android). Il ne peut servir qu'une fois.
    let invitation = null;
    let bandeau = null;

    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        invitation = e;
        majBandeau();
    });

    window.addEventListener("appinstalled", function () {
        localStorage.setItem(CLE_INSTALLEE, "1");
        if (bandeau) {
            bandeau.innerHTML = `<div class="banniere-texte">✅ <strong>Étudiants IT est installée !</strong> Retrouve-la sur ton écran d'accueil.</div>`;
            setTimeout(() => bandeau.remove(), 5000);
        }
    });

    setTimeout(afficher, 2500);

    function afficher() {
        if (bandeau) return;
        bandeau = document.createElement("div");
        bandeau.id = "banniere-installation";
        bandeau.innerHTML = `
            <div class="banniere-texte" id="install-texte"></div>
            <div class="banniere-actions">
                <button id="btn-install" class="btn-primaire">Installer</button>
            </div>
        `;
        document.body.appendChild(bandeau);
        document.getElementById("btn-install").addEventListener("click", onInstaller);
        majBandeau();
    }

    function majBandeau() {
        if (!bandeau) return;
        const texte = document.getElementById("install-texte");
        const bouton = document.getElementById("btn-install");

        if (estChromeIOS) {
            texte.innerHTML = `📲 Pour installer l'appli sur iPhone, ouvre ce site dans <strong>Safari</strong>.`;
            bouton.style.display = "none";
        } else if (estIphone) {
            texte.innerHTML = `📲 <strong>Installe Étudiants IT</strong> sur ton écran d'accueil.`;
            bouton.textContent = "Comment ?";
        } else if (invitation) {
            texte.innerHTML = `📲 <strong>Installe Étudiants IT</strong> pour un accès rapide, comme une vraie appli.`;
            bouton.textContent = "Installer";
        } else {
            texte.innerHTML = `📲 <strong>Installe Étudiants IT</strong> depuis le menu (les 3 points) de Chrome.`;
            bouton.textContent = "Comment ?";
        }
    }

    async function onInstaller() {
        const bouton = document.getElementById("btn-install");

        if (invitation) {
            const evenement = invitation;
            invitation = null;
            bouton.disabled = true;
            bouton.textContent = "⏳ En cours...";
            evenement.prompt(); // doit être appelé directement depuis le clic
            const choix = await evenement.userChoice;
            bouton.disabled = false;
            if (choix.outcome === "accepted") {
                bouton.textContent = "⏳ Ajout en cours...";
            } else {
                bouton.textContent = "Comment ?";
                alert("Pas de souci. Tu pourras l'installer plus tard depuis le menu (les 3 points) de Chrome → « Installer l'application ».");
            }
            return;
        }

        if (estIphone) {
            alert("Touche le bouton Partager ⬆️ en bas de Safari, puis « Sur l'écran d'accueil », puis « Ajouter ».");
        } else {
            alert("Ouvre le menu (les 3 points) de Chrome, puis touche « Installer l'application ».");
        }
    }
})();