// ============================================
// AUTHENTIFICATION - FRONTEND
// ============================================



document.addEventListener("DOMContentLoaded", function() {
    
    // ===== RÉFÉRENCES =====
    const onglets = document.querySelectorAll(".auth-onglet");
    const formConnexion = document.getElementById("form-connexion");
    const formInscription = document.getElementById("form-inscription");
    const authMessage = document.getElementById("auth-message");
    const dejaConnecte = document.getElementById("deja-connecte");
    const usernameDejaConnecte = document.getElementById("username-deja-connecte");
    const btnDeconnexion = document.getElementById("btn-deconnexion");
    const lienAuth = document.getElementById("lien-auth");
    
    // ===== VÉRIFIER SI DÉJÀ CONNECTÉ =====
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    
    if (token && user) {
        // Vérifier que le token est encore valide
        fetch(`${API_URL}/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(r => {
            if (!r.ok) throw new Error("Token expiré");
            return r.json();
        })
        .then(data => {
            // Token valide → afficher l'écran "déjà connecté"
            afficherDejaConnecte(data.data.username);
        })
        .catch(() => {
            // Token invalide → nettoyer
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        });
    }
    
    // ===== ONGLETS =====
    onglets.forEach(onglet => {
        onglet.addEventListener("click", function() {
            const cible = onglet.dataset.onglet;
            
            onglets.forEach(o => o.classList.remove("actif"));
            onglet.classList.add("actif");
            
            if (cible === "connexion") {
                formConnexion.classList.remove("cache");
                formInscription.classList.add("cache");
            } else {
                formConnexion.classList.add("cache");
                formInscription.classList.remove("cache");
            }
            
            cacherMessage();
        });
    });
    
    // ===== FORMULAIRE CONNEXION =====
    formConnexion.addEventListener("submit", async function(e) {
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
            
            // Sauvegarder le token
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            
            afficherMessage("✅ Connexion réussie ! Redirection...", "succes");
            
            // Rediriger après 1 seconde
            setTimeout(() => {
                window.location.href = "profil.html";
            }, 1000);
            
        } catch (erreur) {
            afficherMessage("❌ " + erreur.message, "erreur");
        }
    });
    
    // ===== FORMULAIRE INSCRIPTION =====
    formInscription.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const username = document.getElementById("register-username").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value;
        
        try {
            const reponse = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await reponse.json();
            
            if (!reponse.ok) {
                throw new Error(data.error || "Erreur d'inscription");
            }
            
            // Sauvegarder le token
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
    
    // ===== DÉCONNEXION =====
    if (btnDeconnexion) {
        btnDeconnexion.addEventListener("click", function() {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "index.html";
        });
    }
    
    // ===== FONCTIONS UTILITAIRES =====
    function afficherDejaConnecte(username) {
        formConnexion.classList.add("cache");
        formInscription.classList.add("cache");
        document.querySelector(".auth-onglets").classList.add("cache");
        dejaConnecte.classList.remove("cache");
        usernameDejaConnecte.textContent = username;
        lienAuth.textContent = `👤 ${username}`;
        lienAuth.classList.add("connecte");
    }
    
    function afficherMessage(texte, type) {
        authMessage.textContent = texte;
        authMessage.className = "auth-message " + type;
    }
    
    function cacherMessage() {
        authMessage.className = "auth-message cache";
    }
    
});