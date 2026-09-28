// ============================================
// PAGE MESSAGES - GESTION DE LA MESSAGERIE
// ============================================



document.addEventListener("DOMContentLoaded", function() {
    
    // ===== VÉRIFIER CONNEXION =====
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    
    const ecranNonConnecte = document.getElementById("ecran-non-connecte");
    const ecranPrincipal = document.getElementById("ecran-principal");
    
    if (!token || !user) {
        ecranNonConnecte.classList.remove("cache");
        return;
    }
    
    ecranPrincipal.classList.remove("cache");
    
    // ===== HEADERS POUR L'API =====
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
    
    // ===== RÉFÉRENCES DOM =====
    const listeConversations = document.getElementById("liste-conversations");
    const messagesVide = document.getElementById("messages-vide");
    const conversationActive = document.getElementById("conversation-active");
    const historiqueMessages = document.getElementById("historique-messages");
    const avatarConversation = document.getElementById("avatar-conversation");
    const usernameConversation = document.getElementById("username-conversation");
    const formEnvoi = document.getElementById("form-envoi");
    const inputMessage = document.getElementById("input-message");
    const btnEnvoyer = document.getElementById("btn-envoyer-message");
        const btnNouveauMessage = document.getElementById("btn-nouveau-message");
    const modaleNouveauMessage = document.getElementById("modale-nouveau-message");
    const btnFermerModale = document.getElementById("btn-fermer-modale");
    const listeAmisModale = document.getElementById("liste-amis-modale");
    
    // ===== ÉTAT =====
    let conversationActuelleId = null;
    let conversationActuelleUser = null;
    let intervalRefresh = null;
    
    // ===== CHARGER LES CONVERSATIONS =====
    async function chargerConversations() {
        try {
            const reponse = await fetch(`${API_URL}/messages/conversations`, { headers });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            if (data.count === 0) {
                listeConversations.innerHTML = `
                    <div class="conversations-vide">
                        Aucune conversation.<br>
                        Va sur <a href="amis.html" style="color: var(--couleur-principale);">Mes amis</a> pour commencer !
                    </div>
                `;
                return;
            }
            
            listeConversations.innerHTML = "";
            data.data.forEach(conv => {
                listeConversations.appendChild(creerItemConversation(conv));
            });
        } catch (erreur) {
            console.error("Erreur chargement conversations:", erreur);
            listeConversations.innerHTML = `<div class="conversations-vide">Erreur de chargement</div>`;
        }
    }
    
    // ===== CRÉER UN ITEM DE CONVERSATION =====
    function creerItemConversation(conv) {
        const item = document.createElement("div");
        item.className = "conv-item";
        if (conv.user_id === conversationActuelleId) {
            item.classList.add("actif");
        }
        
        const initiale = conv.username.charAt(0).toUpperCase();
        const apercu = conv.dernier_message.length > 30 
            ? conv.dernier_message.substring(0, 30) + "..." 
            : conv.dernier_message;
        const prefixe = conv.dernier_expediteur === user.id ? "Toi : " : "";
        
        // Formater la date
        const date = new Date(conv.date_dernier);
        const maintenant = new Date();
        const diffHeures = (maintenant - date) / (1000 * 60 * 60);
        
        let dateAffichage;
        if (diffHeures < 24) {
            dateAffichage = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        } else if (diffHeures < 48) {
            dateAffichage = "Hier";
        } else {
            dateAffichage = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
        }
        
        item.innerHTML = `
            <div class="conv-avatar">${initiale}</div>
            <div class="conv-info">
                <div class="conv-username">${conv.username}</div>
                <div class="conv-apercu">${prefixe}${apercu}</div>
            </div>
            <div class="conv-meta">
                <span class="conv-date">${dateAffichage}</span>
                ${conv.nb_non_lus > 0 ? `<span class="conv-badge">${conv.nb_non_lus}</span>` : ""}
            </div>
        `;
        
        item.addEventListener("click", () => ouvrirConversation(conv.user_id, conv.username));
        
        return item;
    }
    
    // ===== OUVRIR UNE CONVERSATION =====
    async function ouvrirConversation(userId, username) {
        conversationActuelleId = userId;
        conversationActuelleUser = username;
        
        // Mettre à jour l'UI
        messagesVide.classList.add("cache");
        conversationActive.classList.remove("cache");
        
        usernameConversation.textContent = username;
        avatarConversation.textContent = username.charAt(0).toUpperCase();
        
        // Marquer les items actifs
        document.querySelectorAll(".conv-item").forEach(item => {
            item.classList.remove("actif");
        });
        chargerConversations();  // Recharger pour mettre à jour les actifs
        
        // Charger les messages
        await chargerMessages(userId);
        
        // Marquer comme lu
        await marquerCommeLu(userId);
        
        // Démarrer l'auto-refresh
        demarrerAutoRefresh();
        
        // Focus sur l'input
        inputMessage.focus();
    }
    
    // ===== CHARGER LES MESSAGES =====
    async function chargerMessages(userId) {
        try {
            const reponse = await fetch(`${API_URL}/messages/${userId}`, { headers });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            if (data.count === 0) {
                historiqueMessages.innerHTML = `
                    <div class="messages-vide" style="flex: 1;">
                        <p>Aucun message pour l'instant.<br>Envoie le premier ! 👋</p>
                    </div>
                `;
                return;
            }
            
            historiqueMessages.innerHTML = "";
            data.data.forEach(msg => {
                historiqueMessages.appendChild(creerMessageBulle(msg));
            });
            
            // Scroller vers le bas
            historiqueMessages.scrollTop = historiqueMessages.scrollHeight;
        } catch (erreur) {
            console.error("Erreur chargement messages:", erreur);
        }
    }
    
    // ===== CRÉER UNE BULLE DE MESSAGE =====
    function creerMessageBulle(msg) {
        const bulle = document.createElement("div");
        const estMoi = msg.expediteur_id === user.id;
        bulle.className = "message-bulle " + (estMoi ? "moi" : "lui");
        
        // Formater la date
        const date = new Date(msg.date);
        const dateStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        
        bulle.innerHTML = `
            ${escapeHtml(msg.contenu)}
            <span class="message-date">${dateStr}</span>
        `;
        
        return bulle;
    }
    
    // ===== ENVOYER UN MESSAGE =====
    formEnvoi.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const contenu = inputMessage.value.trim();
        if (!contenu || !conversationActuelleId) return;
        
        btnEnvoyer.disabled = true;
        inputMessage.disabled = true;
        
        try {
            const reponse = await fetch(`${API_URL}/messages/${conversationActuelleId}`, {
                method: "POST",
                headers,
                body: JSON.stringify({ contenu })
            });
            
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            // Ajouter le message à l'historique
            historiqueMessages.appendChild(creerMessageBulle(data.data));
            historiqueMessages.scrollTop = historiqueMessages.scrollHeight;
            
            // Vider l'input
            inputMessage.value = "";
            
            // Rafraîchir les conversations
            chargerConversations();
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        } finally {
            btnEnvoyer.disabled = false;
            inputMessage.disabled = false;
            inputMessage.focus();
        }
    });
    
    // ===== MARQUER COMME LU =====
    async function marquerCommeLu(userId) {
        try {
            await fetch(`${API_URL}/messages/${userId}/lu`, {
                method: "POST",
                headers
            });
            // Rafraîchir le badge dans le header
            if (typeof chargerBadgeMessages === "function") {
                chargerBadgeMessages(token);
            }
        } catch (erreur) {
            console.error("Erreur marquage lu:", erreur);
        }
    }
    
    // ===== AUTO-REFRESH =====
    function demarrerAutoRefresh() {
        arreterAutoRefresh();
        intervalRefresh = setInterval(() => {
            if (conversationActuelleId) {
                chargerMessages(conversationActuelleId);
            }
        }, 5000);  // Toutes les 5 sec
    }
    
    function arreterAutoRefresh() {
        if (intervalRefresh) {
            clearInterval(intervalRefresh);
            intervalRefresh = null;
        }
    }
    
    // ===== UTILITAIRE : ÉCHAPPER LE HTML =====
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
        // ===== MODALE NOUVEAU MESSAGE =====
    btnNouveauMessage.addEventListener("click", ouvrirModale);
    btnFermerModale.addEventListener("click", fermerModale);
    
    modaleNouveauMessage.addEventListener("click", function(e) {
        // Fermer si on clique sur l'overlay (pas sur la modale)
        if (e.target === modaleNouveauMessage) {
            fermerModale();
        }
    });
    
    // Fermer avec Échap
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && !modaleNouveauMessage.classList.contains("cache")) {
            fermerModale();
        }
    });
    
    async function ouvrirModale() {
        modaleNouveauMessage.classList.remove("cache");
        listeAmisModale.innerHTML = `<p style="text-align: center; padding: 20px; color: var(--couleur-texte-clair);">Chargement...</p>`;
        
        try {
            const reponse = await fetch(`${API_URL}/amis`, { headers });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            if (data.count === 0) {
                listeAmisModale.innerHTML = `
                    <div class="amis-modale-vide">
                        Tu n'as pas encore d'amis.<br>
                        Va sur <a href="amis.html">Mes amis</a> pour en ajouter !
                    </div>
                `;
                return;
            }
            
            listeAmisModale.innerHTML = "";
            data.data.forEach(ami => {
                listeAmisModale.appendChild(creerAmiModale(ami));
            });
        } catch (erreur) {
            listeAmisModale.innerHTML = `<div class="amis-modale-vide">Erreur de chargement</div>`;
        }
    }
    
    function creerAmiModale(ami) {
        const item = document.createElement("div");
        item.className = "ami-modale";
        
        const initiale = ami.username.charAt(0).toUpperCase();
        
        item.innerHTML = `
            <div class="conv-avatar">${initiale}</div>
            <div class="ami-modale-info">
                <div class="ami-modale-nom">${ami.username}</div>
                <div class="ami-modale-email">${ami.email}</div>
            </div>
        `;
        
        item.addEventListener("click", () => {
            fermerModale();
            ouvrirConversation(ami.id, ami.username);
        });
        
        return item;
    }
    
    function fermerModale() {
        modaleNouveauMessage.classList.add("cache");
    }
    
       // ===== GESTION DES PARAMÈTRES D'URL =====
    function lireParametresURL() {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get("user");
        const username = params.get("username");
        
        if (userId && username) {
            // Ouvrir automatiquement la conversation
            ouvrirConversation(parseInt(userId), decodeURIComponent(username));
        }
    }
    
    // ===== CHARGEMENT INITIAL =====
    chargerConversations().then(() => {
        // Après avoir chargé les conversations, vérifier s'il faut en ouvrir une
        lireParametresURL();
    });
    
    console.log("✅ Page messages initialisée pour", user.username);
});