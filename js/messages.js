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
    const btnChargerPlus = document.getElementById("btn-charger-plus");
    const chargerPlusContainer = document.getElementById("charger-plus-container");
    
    // ===== ÉTAT =====
    let conversationActuelleId = null;
    let conversationActuelleUser = null;
    let intervalRefresh = null;
    let dernierMessageId = 0;       // ID du dernier message affiché (pour l'auto-refresh)
    let plusAncienMessageId = null; // ID du plus ancien message chargé (pour la pagination)
    let aPlusDeMessages = false;    // Y a-t-il des messages plus anciens à charger ?
    
    // ============================================
    // CHARGER LES CONVERSATIONS
    // ============================================
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
    
    // ============================================
    // CRÉER UN ITEM DE CONVERSATION
    // ============================================
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
                <button class="conv-supprimer" title="Masquer la conversation" data-user-id="${conv.user_id}">🗑️</button>
            </div>
        `;
        
        // Clic sur l'item → ouvrir
        item.addEventListener("click", (e) => {
            if (e.target.closest(".conv-supprimer")) return; // ne pas ouvrir si on clique sur supprimer
            ouvrirConversation(conv.user_id, conv.username);
        });
        
        // Clic sur le bouton supprimer
        const btnSupprimer = item.querySelector(".conv-supprimer");
        btnSupprimer.addEventListener("click", async (e) => {
            e.stopPropagation();
            await masquerConversation(conv.user_id, conv.username);
        });
        
        return item;
    }
    
    // ===== MASQUER UNE CONVERSATION =====
    async function masquerConversation(userId, username) {
        if (!confirm(`Masquer la conversation avec ${username} ?\n\nElle réapparaîtra si ${username} t'envoie un nouveau message.`)) {
            return;
        }
        
        try {
            const reponse = await fetch(`${API_URL}/messages/conversations/${userId}`, {
                method: "DELETE",
                headers
            });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            // Si la conv était ouverte, on la ferme
            if (conversationActuelleId === userId) {
                conversationActuelleId = null;
                conversationActuelleUser = null;
                messagesVide.classList.remove("cache");
                conversationActive.classList.add("cache");
            }
            
            // Rafraîchir la liste
            chargerConversations();
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        }
    }
    // ============================================
    // OUVRIR UNE CONVERSATION
    // ============================================
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
    
    // ============================================
    // CHARGER LES MESSAGES (avec pagination)
    // ============================================
    async function chargerMessages(userId) {
        try {
            const reponse = await fetch(`${API_URL}/messages/${userId}?limit=30`, { headers });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            historiqueMessages.innerHTML = "";
            
            // Reset des flags de pagination
            aPlusDeMessages = data.has_more;
            plusAncienMessageId = data.plus_ancien_id;
            dernierMessageId = data.data.length > 0 ? data.data[data.data.length - 1].id : 0;
            
            if (data.count === 0) {
                historiqueMessages.innerHTML = `
                    <div class="messages-vide" style="flex: 1;">
                        <p>Aucun message pour l'instant.<br>Envoie le premier ! 👋</p>
                    </div>
                `;
                if (chargerPlusContainer) chargerPlusContainer.classList.add("cache");
                return;
            }
            
            // Afficher ou cacher le bouton "Charger plus"
            if (chargerPlusContainer) {
                if (aPlusDeMessages) {
                    chargerPlusContainer.classList.remove("cache");
                } else {
                    chargerPlusContainer.classList.add("cache");
                }
            }
            
            // Insérer les messages groupés par date
            insererMessagesGroupes(data.data, false);
            
            // Scroller vers le bas
            historiqueMessages.scrollTop = historiqueMessages.scrollHeight;
        } catch (erreur) {
            console.error("Erreur chargement messages:", erreur);
        }
    }
    
    // ============================================
    // CHARGER PLUS DE MESSAGES (scroll infini)
    // ============================================
    async function chargerPlusAnciens() {
        if (!aPlusDeMessages || !plusAncienMessageId || !conversationActuelleId) return;
        
        if (btnChargerPlus) {
            btnChargerPlus.disabled = true;
            btnChargerPlus.textContent = "⏳ Chargement...";
        }
        
        try {
            const reponse = await fetch(
                `${API_URL}/messages/${conversationActuelleId}?limit=30&before=${plusAncienMessageId}`,
                { headers }
            );
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            aPlusDeMessages = data.has_more;
            plusAncienMessageId = data.plus_ancien_id;
            
            // Mémoriser la position de scroll pour ne pas sauter
            const ancienScrollHeight = historiqueMessages.scrollHeight;
            
            // Insérer les messages en haut
            insererMessagesGroupes(data.data, true);
            
            // Restaurer la position de scroll (rester sur le même message)
            const nouveauScrollHeight = historiqueMessages.scrollHeight;
            historiqueMessages.scrollTop = nouveauScrollHeight - ancienScrollHeight;
            
            // Cacher le bouton si plus de messages
            if (!aPlusDeMessages && chargerPlusContainer) {
                chargerPlusContainer.classList.add("cache");
            }
        } catch (erreur) {
            console.error("Erreur chargement plus anciens:", erreur);
        } finally {
            if (btnChargerPlus) {
                btnChargerPlus.disabled = false;
                btnChargerPlus.textContent = "⬆️ Charger les messages plus anciens";
            }
        }
    }
    
    // ============================================
    // INSÉRER DES MESSAGES GROUPÉS PAR DATE
    // ============================================
    function insererMessagesGroupes(messages, enHaut) {
        const fragment = document.createDocumentFragment();
        let derniereDateAffichee = null;
        
        // Récupérer la dernière date affichée si on insère en bas
        if (!enHaut) {
            const derniersSeps = historiqueMessages.querySelectorAll(".separateur-date span");
            if (derniersSeps.length > 0) {
                derniereDateAffichee = derniersSeps[derniersSeps.length - 1].textContent;
            }
        }
        
        messages.forEach(msg => {
            const dateJour = formaterDateJour(msg.date);
            if (dateJour !== derniereDateAffichee) {
                fragment.appendChild(creerSeparateurDate(dateJour));
                derniereDateAffichee = dateJour;
            }
            fragment.appendChild(creerMessageAvecAvatar(msg));
        });
        
        if (enHaut) {
            // Insérer après le conteneur "Charger plus"
            if (chargerPlusContainer) {
                chargerPlusContainer.after(fragment);
            } else {
                historiqueMessages.prepend(fragment);
            }
        } else {
            historiqueMessages.appendChild(fragment);
        }
    }
    
    // ============================================
    // CRÉER UN SÉPARATEUR DE DATE
    // ============================================
    function creerSeparateurDate(dateStr) {
        const sep = document.createElement("div");
        sep.className = "separateur-date";
        sep.innerHTML = `<span>${dateStr}</span>`;
        return sep;
    }
    
    // ============================================
    // FORMATER LA DATE DU JOUR
    // ============================================
    function formaterDateJour(dateISO) {
        const date = new Date(dateISO);
        const aujourdhui = new Date();
        const hier = new Date();
        hier.setDate(hier.getDate() - 1);
        
        const memeJour = (d1, d2) => 
            d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
        
        if (memeJour(date, aujourdhui)) return "Aujourd'hui";
        if (memeJour(date, hier)) return "Hier";
        
        return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: date.getFullYear() !== aujourdhui.getFullYear() ? "numeric" : undefined
        });
    }
    
    // ============================================
    // CRÉER UN MESSAGE AVEC AVATAR
    // ============================================
    function creerMessageAvecAvatar(msg) {
    // Structure ULTRA simple : une seule bulle, comme le chat IA
    const bulle = document.createElement("div");
    const estMoi = msg.expediteur_id === user.id;
    bulle.className = estMoi ? "message-bulle moi" : "message-bulle lui";
    
    const date = new Date(msg.date);
    const heureStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    
    bulle.innerHTML = `${escapeHtml(msg.contenu)}<span class="message-date">${heureStr}</span>`;
    
    return bulle;
}
    
    // ============================================
    // ENVOYER UN MESSAGE
    // ============================================
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
            historiqueMessages.appendChild(creerMessageAvecAvatar(data.data));
            historiqueMessages.scrollTop = historiqueMessages.scrollHeight;
            
            // Mettre à jour dernierMessageId
            if (data.data.id > dernierMessageId) {
                dernierMessageId = data.data.id;
            }
            
            // Vider l'input et réinitialiser sa hauteur
            inputMessage.value = "";
            inputMessage.style.height = "auto";
            
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
    
    // ============================================
    // MARQUER COMME LU
    // ============================================
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
    
    // ============================================
    // AUTO-REFRESH INTELLIGENT (ne charge que les nouveaux)
    // ============================================
    function demarrerAutoRefresh() {
        arreterAutoRefresh();
        intervalRefresh = setInterval(async () => {
            if (!conversationActuelleId || !dernierMessageId) return;
            
            try {
                const reponse = await fetch(
                    `${API_URL}/messages/${conversationActuelleId}/nouveaux?after=${dernierMessageId}`,
                    { headers }
                );
                const data = await reponse.json();
                
                if (data.success && data.count > 0) {
                    // Ajouter seulement les nouveaux
                    data.data.forEach(msg => {
                        historiqueMessages.appendChild(creerMessageAvecAvatar(msg));
                        dernierMessageId = Math.max(dernierMessageId, msg.id);
                    });
                    // Scroll en bas
                    historiqueMessages.scrollTop = historiqueMessages.scrollHeight;
                    
                    // Marquer comme lu
                    marquerCommeLu(conversationActuelleId);
                    
                    // Rafraîchir les conversations pour mettre à jour les aperçus
                    chargerConversations();
                }
            } catch (erreur) {
                console.error("Erreur auto-refresh:", erreur);
            }
        }, 3000);
    }
    
    function arreterAutoRefresh() {
        if (intervalRefresh) {
            clearInterval(intervalRefresh);
            intervalRefresh = null;
        }
    }
    
    // ============================================
    // UTILITAIRE : ÉCHAPPER LE HTML
    // ============================================
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ============================================
    // MODALE NOUVEAU MESSAGE
    // ============================================
    btnNouveauMessage.addEventListener("click", ouvrirModale);
    btnFermerModale.addEventListener("click", fermerModale);
    
    modaleNouveauMessage.addEventListener("click", function(e) {
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
    
    // ============================================
    // GESTION DES PARAMÈTRES D'URL
    // ============================================
    function lireParametresURL() {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get("user");
        const username = params.get("username");
        
        if (userId && username) {
            ouvrirConversation(parseInt(userId), decodeURIComponent(username));
        }
    }
    
    // ============================================
    // BOUTON CHARGER PLUS + SCROLL INFINI
    // ============================================
    if (btnChargerPlus) {
        btnChargerPlus.addEventListener("click", chargerPlusAnciens);
    }
    
    // Scroll infini : charger quand on remonte tout en haut
    historiqueMessages.addEventListener("scroll", function() {
        if (historiqueMessages.scrollTop < 50 && aPlusDeMessages && conversationActuelleId) {
            chargerPlusAnciens();
        }
    });
    
    // ============================================
    // TEXTAREA : MAJ+ENTRÉE = SAUT DE LIGNE, ENTRÉE = ENVOYER
    // ============================================
    inputMessage.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            formEnvoi.dispatchEvent(new Event("submit"));
        }
    });
    
    // Auto-resize du textarea selon le contenu
    inputMessage.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 120) + "px";
    });
    
    // ============================================
    // CHARGEMENT INITIAL
    // ============================================
    chargerConversations().then(() => {
        lireParametresURL();
    });
    
    console.log("✅ Page messages initialisée pour", user.username);
});