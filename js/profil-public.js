// ============================================
// PROFIL PUBLIC D'UN UTILISATEUR
// ============================================


document.addEventListener("DOMContentLoaded", function() {
    
    // ===== VÉRIFIER CONNEXION =====
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    
    if (!token || !user) {
        window.location.href = "auth.html";
        return;
    }
    
    // ===== RÉCUPÉRER L'ID DEPUIS L'URL =====
    const params = new URLSearchParams(window.location.search);
    const userId = parseInt(params.get("id"));
    
    if (!userId || userId === user.id) {
        // Si pas d'ID ou si c'est moi, rediriger vers mon profil
        window.location.href = "profil.html";
        return;
    }
    
    // ===== RÉFÉRENCES DOM =====
    const ecranChargement = document.getElementById("ecran-chargement");
    const ecranErreur = document.getElementById("ecran-erreur");
    const ecranProfil = document.getElementById("ecran-profil");
    const erreurMessage = document.getElementById("erreur-message");
    
    const profilAvatar = document.getElementById("profil-avatar");
    const profilUsername = document.getElementById("profil-username");
    const profilDateInscription = document.getElementById("profil-date-inscription");
    const profilActions = document.getElementById("profil-actions");
    
    const statAmis = document.getElementById("stat-amis");
    const statMessages = document.getElementById("stat-messages");
    const statPosts = document.getElementById("stat-posts");
    
    const listeAmisProfil = document.getElementById("liste-amis-profil");
    
    // ===== HEADERS =====
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
    
    // ===== CHARGER LE PROFIL =====
    async function chargerProfil() {
        try {
            const reponse = await fetch(`${API_URL}/utilisateurs/${userId}`, { headers });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            afficherProfil(data.data);
        } catch (erreur) {
            ecranChargement.classList.add("cache");
            ecranErreur.classList.remove("cache");
            erreurMessage.textContent = erreur.message;
        }
    }
    
    // ===== AFFICHER LE PROFIL =====
    function afficherProfil(data) {
        const u = data.utilisateur;
        const stats = data.stats;
        const amitie = data.statut_amitie;
        const amis = data.amis;
        
        // En-tête
        profilAvatar.textContent = u.username.charAt(0).toUpperCase();
        profilUsername.textContent = u.username;
        
        // Date d'inscription
        const date = new Date(u.created_at);
        profilDateInscription.textContent = date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
        
        // Stats
        statAmis.textContent = stats.nb_amis;
        statMessages.textContent = stats.nb_messages;
        statPosts.textContent = stats.nb_posts;
        
        // Actions
        afficherActions(u, amitie);
        
        // Amis
        if (amis.length === 0) {
            listeAmisProfil.innerHTML = `
                <div class="etat-vide" style="grid-column: 1 / -1;">
                    <span class="etat-vide-icone">👥</span>
                    Aucun ami pour l'instant
                </div>
            `;
        } else {
            listeAmisProfil.innerHTML = "";
            amis.forEach(ami => {
                const carte = document.createElement("a");
                carte.className = "carte-ami-public";
                carte.href = `profil-public.html?id=${ami.id}`;
                carte.innerHTML = `
                    <div class="conv-avatar">${ami.username.charAt(0).toUpperCase()}</div>
                    <div class="ami-nom">${ami.username}</div>
                `;
                listeAmisProfil.appendChild(carte);
            });
        }
        
        // Afficher
        ecranChargement.classList.add("cache");
        ecranProfil.classList.remove("cache");
    }
    
    // ===== AFFICHER LES ACTIONS =====
    function afficherActions(u, amitie) {
        profilActions.innerHTML = "";
        
        // Bouton Message (toujours présent)
        const btnMessage = document.createElement("button");
        btnMessage.className = "btn-primaire";
        btnMessage.textContent = "💬 Envoyer un message";
        btnMessage.addEventListener("click", () => {
            window.location.href = `messages.html?user=${u.id}&username=${encodeURIComponent(u.username)}`;
        });
        profilActions.appendChild(btnMessage);
        
        // Bouton selon le statut d'amitié
        if (amitie.statut === "acceptee") {
            const btnAmi = document.createElement("button");
            btnAmi.className = "btn-secondaire";
            btnAmi.textContent = "✅ Déjà amis";
            btnAmi.disabled = true;
            profilActions.appendChild(btnAmi);
        } else if (amitie.statut === "en_attente") {
            if (amitie.envoye_par_moi) {
                const btnAmi = document.createElement("button");
                btnAmi.className = "btn-secondaire";
                btnAmi.textContent = "⏳ Demande en attente";
                btnAmi.disabled = true;
                profilActions.appendChild(btnAmi);
            } else {
                // Demande reçue → boutons Accepter/Refuser
                const btnAccepter = document.createElement("button");
                btnAccepter.className = "btn-primaire";
                btnAccepter.textContent = "✅ Accepter";
                btnAccepter.addEventListener("click", () => accepterDemande(amitie.amitie_id));
                profilActions.appendChild(btnAccepter);
                
                const btnRefuser = document.createElement("button");
                btnRefuser.className = "btn-secondaire";
                btnRefuser.textContent = "❌ Refuser";
                btnRefuser.addEventListener("click", () => refuserDemande(amitie.amitie_id));
                profilActions.appendChild(btnRefuser);
            }
        } else {
            // Aucune relation → bouton Ajouter
            const btnAjouter = document.createElement("button");
            btnAjouter.className = "btn-secondaire";
            btnAjouter.textContent = "➕ Ajouter en ami";
            btnAjouter.addEventListener("click", () => envoyerDemande(u.id));
            profilActions.appendChild(btnAjouter);
        }
    }
    
    // ===== ACTIONS =====
    async function envoyerDemande(userId) {
        try {
            const reponse = await fetch(`${API_URL}/amis/demande/${userId}`, {
                method: "POST",
                headers
            });
            const data = await reponse.json();
            if (!data.success) throw new Error(data.error);
            
            alert("✅ Demande envoyée !");
            chargerProfil();  // Recharger
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        }
    }
    
    async function accepterDemande(amitieId) {
        try {
            const reponse = await fetch(`${API_URL}/amis/accepter/${amitieId}`, {
                method: "POST",
                headers
            });
            const data = await reponse.json();
            if (!data.success) throw new Error(data.error);
            
            alert("✅ Demande acceptée !");
            chargerProfil();
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        }
    }
    
    async function refuserDemande(amitieId) {
        try {
            const reponse = await fetch(`${API_URL}/amis/refuser/${amitieId}`, {
                method: "POST",
                headers
            });
            const data = await reponse.json();
            if (!data.success) throw new Error(data.error);
            
            chargerProfil();
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        }
    }
    
    // ===== LANCEMENT =====
    chargerProfil();
});