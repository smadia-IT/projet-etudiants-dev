// ============================================
// AUTHENTIFICATION - FRONTEND
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    // ===== RÉFÉRENCES =====
    const onglets = document.querySelectorAll(".auth-onglet");
    const formConnexion = document.getElementById("form-connexion");
    const formInscription = document.getElementById("form-inscription");
    const authMessage = document.getElementById("auth-message");
    const dejaConnecte = document.getElementById("deja-connecte");
    const usernameDejaConnecte = document.getElementById("username-deja-connecte");
    const btnDeconnexion = document.getElementById("btn-deconnexion");
    const lienAuth = document.getElementById("lien-auth");

    // Modale profil
    const modaleProfil = document.getElementById("modale-profil");
    const formCompleterProfil = document.getElementById("form-completer-profil");

    // ===== VÉRIFIER SI DÉJÀ CONNECTÉ =====
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user) {
        fetch(`${API_URL}/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(r => {
                if (!r.ok) throw new Error("Token expiré");
                return r.json();
            })
            .then(data => {
                localStorage.setItem("user", JSON.stringify(data.data));
                afficherDejaConnecte(data.data);

                if (!data.profil_complet) {
                    afficherModaleProfil();
                }
            })
            .catch(() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            });
    }

        // ===== BASCULE CONNEXION / INSCRIPTION =====
    function basculer(vers) {
        if (vers === "inscription") {
            formConnexion.classList.add("cache");
            formInscription.classList.remove("cache");
        } else {
            formInscription.classList.add("cache");
            formConnexion.classList.remove("cache");
        }
        cacherMessage();
    }
        if (new URLSearchParams(window.location.search).get("inscription") === "1") {
        basculer("inscription");
    }

    document.querySelectorAll(".auth-lien").forEach(function (lien) {
        lien.addEventListener("click", function () {
            basculer(lien.dataset.vers);
        });
    });

    // ===== FORMULAIRE CONNEXION =====
    formConnexion.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value;

        try {
            const reponse = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await reponse.json();

            if (!reponse.ok) {
                throw new Error(data.error || "Erreur de connexion");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            afficherMessage("✅ Connexion réussie ! Redirection...", "succes");

            if (!data.profil_complet) {
                setTimeout(() => window.location.reload(), 500);
                return;
            }

            setTimeout(() => {
                window.location.href = "profil.html";
            }, 1000);

        } catch (erreur) {
            afficherMessage("❌ " + erreur.message, "erreur");
        }
    });

    // ===== FORMULAIRE INSCRIPTION =====
    formInscription.addEventListener("submit", async function (e) {
        e.preventDefault();

        const prenom = document.getElementById("register-prenom").value.trim();
        const nom = document.getElementById("register-nom").value.trim();
        const username = document.getElementById("register-username").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value;

        // Indicatif du pays + numéro, au format +243-823456789
        const telephone = formaterTelephone();
        if (!telephone) {
            afficherMessage("❌ Choisis ton pays et tape ton numéro (au moins 6 chiffres).", "erreur");
            return;
        }

        try {
            const reponse = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, prenom, nom, telephone })
            });

            const data = await reponse.json();

            if (!reponse.ok) {
                throw new Error(data.error || "Erreur d'inscription");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            afficherMessage("🎉 Compte créé ! Redirection...", "succes");

            setTimeout(() => {
                window.location.href = "profil.html";
            }, 1000);

        } catch (erreur) {
            afficherMessage("❌ " + erreur.message, "erreur");
        }
    });

    // ===== FORMULAIRE COMPLÉTER PROFIL =====
    if (formCompleterProfil) {
        formCompleterProfil.addEventListener("submit", async function (e) {
            e.preventDefault();

            const prenom = document.getElementById("profil-prenom").value.trim();
            const nom = document.getElementById("profil-nom").value.trim();
            const telephone = document.getElementById("profil-telephone").value.trim();

            if (!/^\+\d{1,4}[\s-]+\d{6,15}$/.test(telephone)) {
                alert("Numéro invalide. Exemple : +243 823456789");
                return;
            }

            try {
                const reponse = await fetch(`${API_URL}/auth/completer-profil`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ prenom, nom, telephone })
                });

                const data = await reponse.json();

                if (!reponse.ok) {
                    throw new Error(data.error || "Erreur");
                }

                localStorage.setItem("user", JSON.stringify(data.user));
                alert("✅ Profil complété !");
                window.location.reload();

            } catch (erreur) {
                alert("❌ " + erreur.message);
            }
        });
    }

    // ===== DÉCONNEXION =====
    if (btnDeconnexion) {
        btnDeconnexion.addEventListener("click", function () {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "index.html";
        });
    }

    // ===== FONCTIONS UTILITAIRES =====
    function afficherDejaConnecte(user) {
        formConnexion.classList.add("cache");
        formInscription.classList.add("cache");
              const onglets = document.querySelector(".auth-onglets");
        if (onglets) onglets.classList.add("cache");
        dejaConnecte.classList.remove("cache");

        const nomComplet = user.prenom && user.nom
            ? `${user.prenom} ${user.nom}`
            : user.username;

        usernameDejaConnecte.textContent = nomComplet;
        lienAuth.textContent = `👤 ${nomComplet}`;
        lienAuth.classList.add("connecte");
    }

    function afficherModaleProfil() {
        if (modaleProfil) modaleProfil.classList.remove("cache");
    }

    function afficherMessage(texte, type) {
        authMessage.textContent = texte;
        authMessage.className = "auth-message " + type;
    }

    function cacherMessage() {
        authMessage.className = "auth-message cache";
    }

});