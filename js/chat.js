// ============================================
// CHAT IA - Frontend (via proxy backend)
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    
    const historiqueChat = document.getElementById("historique-chat");
    const champQuestion = document.getElementById("question");
    const btnEnvoyer = document.getElementById("btn-envoyer");
    const btnNouvelleConv = document.getElementById("btn-nouvelle-conv");
    const listeConversations = document.getElementById("liste-conversations");
    
    // ===== ÉTAT =====
    let conversations = [];
    let conversationActive = null;
    
    // ===== CHARGEMENT =====
    chargerConversations();
    
    if (conversations.length === 0) {
        creerNouvelleConversation();
    } else {
        chargerConversation(conversations[conversations.length - 1].id);
    }
    
    afficherListeConversations();
    
    // ===== ÉCOUTEURS =====
    btnEnvoyer.addEventListener("click", envoyerMessage);
    champQuestion.addEventListener("keypress", function(e) {
        if (e.key === "Enter") envoyerMessage();
    });
    
    btnNouvelleConv.addEventListener("click", creerNouvelleConversation);
    
    // ===== FONCTIONS =====
    function chargerConversations() {
        const stockees = localStorage.getItem("conversationsChat");
        conversations = stockees ? JSON.parse(stockees) : [];
    }
    
    function sauvegarderConversations() {
        localStorage.setItem("conversationsChat", JSON.stringify(conversations));
    }
    
    function creerNouvelleConversation() {
        const nouvelleConv = {
            id: Date.now(),
            titre: "Nouvelle conversation",
            messages: [],
            dateCreation: new Date().toISOString()
        };
        
        conversations.push(nouvelleConv);
        conversationActive = nouvelleConv.id;
        
        sauvegarderConversations();
        afficherListeConversations();
        afficherConversation();
        
        champQuestion.focus();
    }
    
    function chargerConversation(id) {
        conversationActive = id;
        afficherListeConversations();
        afficherConversation();
    }
    
    function getConversationActive() {
        return conversations.find(c => c.id === conversationActive);
    }
    
    function afficherConversation() {
        historiqueChat.innerHTML = "";
        const conv = getConversationActive();
        
        if (!conv) return;
        
        if (conv.messages.length === 0) {
            historiqueChat.innerHTML = `
                <div style="text-align: center; color: var(--couleur-texte-clair); padding: 40px 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🤖</div>
                    <p>Pose ta première question !</p>
                </div>
            `;
            return;
        }
        
        conv.messages.forEach(msg => {
            ajouterMessageDOM(msg.texte, msg.role, false);
        });
        
        historiqueChat.scrollTop = historiqueChat.scrollHeight;
    }
    
    function afficherListeConversations() {
        listeConversations.innerHTML = "";
        
        const listeInverse = [...conversations].reverse();
        
        listeInverse.forEach(conv => {
            const item = document.createElement("div");
            item.className = "conv-item" + (conv.id === conversationActive ? " active" : "");
            item.innerHTML = `
                <span class="conv-titre">💬 ${conv.titre}</span>
                <button class="conv-suppr" title="Supprimer">✕</button>
            `;
            
            item.addEventListener("click", () => chargerConversation(conv.id));
            item.querySelector(".conv-suppr").addEventListener("click", (e) => {
                supprimerConversation(conv.id, e);
            });
            
            listeConversations.appendChild(item);
        });
    }
    
    function supprimerConversation(id, event) {
        event.stopPropagation();
        
        if (!confirm("Supprimer cette conversation ?")) return;
        
        conversations = conversations.filter(c => c.id !== id);
        sauvegarderConversations();
        
        if (conversationActive === id) {
            if (conversations.length > 0) {
                chargerConversation(conversations[conversations.length - 1].id);
            } else {
                creerNouvelleConversation();
            }
        } else {
            afficherListeConversations();
        }
    }
    
    // ===== ENVOI DE MESSAGE =====
    async function envoyerMessage() {
        const question = champQuestion.value.trim();
        if (question === "") return;
        
        const conv = getConversationActive();
        if (!conv) return;
        
        // Récupérer le token
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Tu dois être connecté pour utiliser le chat IA.");
            window.location.href = "auth.html";
            return;
        }
        
        // 1. Ajouter le message de l'utilisateur
        conv.messages.push({ role: "user", texte: question });
        ajouterMessageDOM(question, "user");
        champQuestion.value = "";
        
        // 2. Renommer la conversation si c'est la première question
        if (conv.messages.length === 1) {
            conv.titre = question.substring(0, 30) + (question.length > 30 ? "..." : "");
            afficherListeConversations();
        }
        
        sauvegarderConversations();
        
        // 3. Désactiver le bouton + message d'attente
        btnEnvoyer.disabled = true;
        btnEnvoyer.textContent = "⏳";
        const messageAttente = ajouterMessageDOM("Je réfléchis...", "ia");
        
        try {
            // 4. Appeler le backend
            const reponse = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ message: question })
            });
            
            const data = await reponse.json();
            
            if (!data.success) {
                throw new Error(data.error || "Erreur inconnue");
            }
            
            // 5. Afficher la réponse
            messageAttente.textContent = data.data.reponse;
            
            // Sauvegarder
            conv.messages.push({ role: "ia", texte: data.data.reponse });
            sauvegarderConversations();
            
        } catch (erreur) {
            messageAttente.textContent = "❌ Erreur : " + erreur.message;
            console.error(erreur);
        } finally {
            btnEnvoyer.disabled = false;
            btnEnvoyer.textContent = "Envoyer";
            historiqueChat.scrollTop = historiqueChat.scrollHeight;
        }
    }
    
    function ajouterMessageDOM(texte, type, scroll = true) {
        const div = document.createElement("div");
        div.className = type === "user" ? "message-user" : "message-ia";
        div.textContent = texte;
        historiqueChat.appendChild(div);
        if (scroll) {
            historiqueChat.scrollTop = historiqueChat.scrollHeight;
        }
        return div;
    }
    
});