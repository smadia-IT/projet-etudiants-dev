document.addEventListener("DOMContentLoaded", function () {

    // ===== NOM DE L'UTILISATEUR =====
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const paramNom = document.getElementById("param-nom");
    if (paramNom) {
        paramNom.textContent = user
            ? `Connecté en tant que ${user.prenom && user.nom ? user.prenom + " " + user.nom : user.username}`
            : "Tu n'es pas connecté.";
    }

    // ===== THÈME =====
    const btnTheme = document.getElementById("param-theme");
    if (btnTheme) {
        btnTheme.addEventListener("click", function () {
            const btnHeader = document.getElementById("btn-theme");
            if (btnHeader) btnHeader.click();
        });
    }

    // ===== INSTALLATION DE L'APPLI =====
    const btnInstaller = document.getElementById("param-installer");
    const aideInstall = document.getElementById("param-install-aide");
    let invitationInstall = null;

    // Chrome/Android propose l'installation : on garde l'événement pour l'utiliser au clic
    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        invitationInstall = e;
        if (btnInstaller) btnInstaller.classList.remove("cache");
    });

    if (btnInstaller) {
        btnInstaller.addEventListener("click", async function () {
            if (!invitationInstall) return;
            invitationInstall.prompt();
            await invitationInstall.userChoice;
            invitationInstall = null;
            btnInstaller.classList.add("cache");
        });
    }

    // Si l'appli est déjà installée
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
        const texte = document.getElementById("param-install-texte");
        if (texte) texte.textContent = "✅ L'application est installée sur cet appareil.";
    }

    // Instructions manuelles (iPhone, ou navigateur qui ne propose pas l'installation)
    if (aideInstall && !invitationInstall) {
        setTimeout(function () {
            if (!invitationInstall && !window.matchMedia("(display-mode: standalone)").matches) {
                aideInstall.classList.remove("cache");
                aideInstall.innerHTML = `
                    <strong>Sur Android (Chrome) :</strong> menu ⋮ → <em>Installer l'application</em>.<br>
                    <strong>Sur iPhone (Safari) :</strong> bouton Partager <span>⬆️</span> → <em>Sur l'écran d'accueil</em>.
                `;
            }
        }, 1500);
    }

    // ===== DÉCONNEXION =====
    const btnDeconnexion = document.getElementById("param-deconnexion");
    if (btnDeconnexion) {
        btnDeconnexion.addEventListener("click", function () {
            if (!confirm("Te déconnecter ?")) return;
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "auth.html";
        });
    }

        // ===== NOTIFICATIONS =====
    const btnActiverNotifs = document.getElementById("btn-activer-notifs");
    const btnDesactiverNotifs = document.getElementById("btn-desactiver-notifs");
    const statutNotifs = document.getElementById("statut-notifs");

    async function majStatutNotifs() {
        if (!statutNotifs) return;

        if (!("Notification" in window)) {
            statutNotifs.textContent = "❌ Non supporté par ton navigateur";
            return;
        }

        if (Notification.permission === "denied") {
            statutNotifs.innerHTML = `
                <span>🔕 Les notifications sont désactivées pour Étudiants IT sur ce téléphone.</span><br>
                <button id="btn-aide-notifs" class="btn-secondaire" style="margin-top:10px;">Comment les activer ?</button>
                <div id="aide-notifs" class="cache" style="text-align:left;margin-top:12px;font-size:14px;line-height:1.7;">
                    <strong>Sur Chrome (Android) :</strong><br>
                    1. Appuie sur le cadenas 🔒 à gauche de l'adresse, ou sur ⋮ → Paramètres.<br>
                    2. Ouvre <em>Notifications</em> (ou Paramètres des sites → Notifications).<br>
                    3. Choisis <strong>Autoriser</strong> pour projet-etudiants-it.vercel.app.<br>
                    4. Reviens sur cette page et recharge-la.<br><br>
                    <strong>Si tu as installé l'appli :</strong><br>
                    Paramètres du téléphone → Applications → Étudiants IT (ou Chrome) → Notifications → Activer.
                </div>
            `;
            btnActiverNotifs.classList.add("cache");
            btnDesactiverNotifs.classList.add("cache");

            document.getElementById("btn-aide-notifs").addEventListener("click", function () {
                document.getElementById("aide-notifs").classList.toggle("cache");
            });
            return;
        }

        const abonne = await PushManager.estAbonne();

        if (abonne) {
            statutNotifs.textContent = "✅ Notifications activées";
            btnActiverNotifs.classList.add("cache");
            btnDesactiverNotifs.classList.remove("cache");
        } else {
            statutNotifs.textContent = "";
            btnActiverNotifs.classList.remove("cache");
            btnDesactiverNotifs.classList.add("cache");
        }
    }

    if (btnActiverNotifs) {
        btnActiverNotifs.addEventListener("click", async () => {
            btnActiverNotifs.disabled = true;
            btnActiverNotifs.textContent = "⏳ Activation...";

            const autorise = await PushManager.demanderPermission();
            if (!autorise) {
                alert("❌ Tu as refusé les notifications. Autorise-les dans les paramètres du navigateur.");
                btnActiverNotifs.disabled = false;
                btnActiverNotifs.textContent = "🔔 Activer les notifications";
                majStatutNotifs();
                return;
            }

            const ok = await PushManager.subscribe();
            btnActiverNotifs.disabled = false;
            btnActiverNotifs.textContent = "🔔 Activer les notifications";

            if (ok) {
                alert("✅ Notifications activées !");
                majStatutNotifs();
            } else {
                alert("❌ Erreur lors de l'activation");
            }
        });
    }

    if (btnDesactiverNotifs) {
        btnDesactiverNotifs.addEventListener("click", async () => {
            if (!confirm("Désactiver les notifications ?")) return;
            const ok = await PushManager.unsubscribe();
            if (ok) {
                alert("✅ Notifications désactivées");
                setTimeout(majStatutNotifs, 1000);
            }
        });
    }

    majStatutNotifs();
        // ===== SUPPRESSION DU COMPTE =====
    const btnSupprimerCompte = document.getElementById("param-supprimer-compte");
    if (btnSupprimerCompte) {
        btnSupprimerCompte.addEventListener("click", async function () {
            if (!confirm("Supprimer définitivement ton compte et toutes tes données ? Cette action est irréversible.")) return;

            const motDePasse = prompt("Pour confirmer, saisis ton mot de passe :");
            if (!motDePasse) return;

            try {
                const reponse = await fetch(`${API_URL}/auth/compte`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({ password: motDePasse })
                });
                const data = await reponse.json();
                if (!data.success) throw new Error(data.error);

                localStorage.clear();
                alert("Ton compte a été supprimé. À bientôt !");
                window.location.href = "index.html";
            } catch (erreur) {
                alert("❌ " + erreur.message);
            }
        });
    }

});