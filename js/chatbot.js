// ============================================
// CHATBOT D'AIDE — Bouton flottant + panneau
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    
    // ============================================
    // CRÉATION DU BOUTON FLOTTANT
    // ============================================
    const btnChatbot = document.createElement("button");
    btnChatbot.id = "btn-chatbot";
    btnChatbot.className = "btn-chatbot";
    btnChatbot.innerHTML = `
        💬
        <span class="chatbot-badge cache" id="chatbot-badge">1</span>
    `;
    btnChatbot.title = "Besoin d'aide ?";
    document.body.appendChild(btnChatbot);
    
    // ============================================
    // CRÉATION DU PANNEAU
    // ============================================
    const panneau = document.createElement("div");
    panneau.id = "chatbot-panneau";
    panneau.className = "chatbot-panneau cache";
    panneau.innerHTML = `
        <div class="chatbot-entete">
            <div class="chatbot-titre">
                <span>💬 Aide Étudiants IT</span>
            </div>
            <button class="chatbot-fermer" id="chatbot-fermer">✕</button>
        </div>
        <div class="chatbot-messages" id="chatbot-messages">
            <!-- Rempli par JS -->
        </div>
        <div class="chatbot-suggestions" id="chatbot-suggestions">
            <!-- Boutons rapides -->
        </div>
        <form class="chatbot-saisie" id="chatbot-form">
            <input 
                type="text" 
                id="chatbot-input" 
                placeholder="Pose ta question..." 
                autocomplete="off"
            >
            <button type="submit" class="chatbot-envoyer">➤</button>
        </form>
    `;
    document.body.appendChild(panneau);
    
    // ============================================
    // RÉFÉRENCES
    // ============================================
    const badge = document.getElementById("chatbot-badge");
    const messages = document.getElementById("chatbot-messages");
    const suggestions = document.getElementById("chatbot-suggestions");
    const form = document.getElementById("chatbot-form");
    const input = document.getElementById("chatbot-input");
    const btnFermer = document.getElementById("chatbot-fermer");
    
    // Historique de la conversation
    let historique = [];
    let enCours = false;
    
    // Suggestions rapides
    const SUGGESTIONS = [
        { label: "Comment réviser ?", question: "Comment réviser ?" },
        { label: "Gagner des points", question: "Comment gagner des points ?" },
        { label: "Ajouter un ami", question: "Comment ajouter un ami ?" },
        { label: "À quoi sert le dictionnaire ?", question: "À quoi sert le dictionnaire ?" }
    ];
    
    // ============================================
    // OUVERTURE / FERMETURE
    // ============================================
    btnChatbot.addEventListener("click", () => {
        panneau.classList.toggle("cache");
        if (!panneau.classList.contains("cache")) {
            // Cacher le badge
            if (badge) badge.classList.add("cache");
            // Charger l'astuce du jour
            chargerAstuce();
            input.focus();
        }
    });
    
    btnFermer.addEventListener("click", () => {
        panneau.classList.add("cache");
    });
    
    // ============================================
    // ASTUCE DU JOUR (au premier message)
    // ============================================
    async function chargerAstuce() {
        // Ne charger qu'une fois
        if (messages.dataset.astuceChargee) return;
        messages.dataset.astuceChargee = "true";
        
        try {
            const reponse = await fetch(`${API_URL}/chatbot/astuce`);
            const data = await reponse.json();
            
            if (data.success) {
                afficherMessage("bot", `Salut ! 👋 Je suis là pour t'aider à utiliser Étudiants IT.\n\n${data.astuce}`);
            } else {
                afficherMessage("bot", "Salut ! 👋 Je suis là pour t'aider à utiliser Étudiants IT. Pose-moi une question !");
            }
        } catch (e) {
            afficherMessage("bot", "Salut ! 👋 Je suis là pour t'aider. Pose-moi une question !");
        }
        
        afficherSuggestions();
    }
    
    function afficherSuggestions() {
        suggestions.innerHTML = "";
        SUGGESTIONS.forEach(s => {
            const btn = document.createElement("button");
            btn.className = "chatbot-suggestion";
            btn.textContent = s.label;
            btn.addEventListener("click", () => {
                envoyerQuestion(s.question);
            });
            suggestions.appendChild(btn);
        });
    }
    
    // ============================================
    // AFFICHER UN MESSAGE
    // ============================================
    function afficherMessage(type, texte) {
        const msg = document.createElement("div");
        msg.className = `chatbot-message ${type}`;
        
        // Convertir les sauts de ligne en <br>
        const texteHTML = escapeHtml(texte).replace(/\n/g, "<br>");
        msg.innerHTML = texteHTML;
        
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        
        // Sauvegarder dans l'historique
        historique.push({
            role: type === "bot" ? "model" : "user",
            contenu: texte
        });
    }
    
    // ============================================
    // ENVOYER UNE QUESTION
    // ============================================
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const question = input.value.trim();
        if (question) envoyerQuestion(question);
    });
    
    async function envoyerQuestion(question) {
        if (enCours) return;
        enCours = true;
        
        // Afficher la question
        afficherMessage("user", question);
        input.value = "";
        
        // Cacher les suggestions
        suggestions.classList.add("cache");
        
        // Message de chargement
        const chargement = document.createElement("div");
        chargement.className = "chatbot-message bot chargement";
        chargement.textContent = "⏳ Réfléchit...";
        messages.appendChild(chargement);
        messages.scrollTop = messages.scrollHeight;
        
        try {
            const reponse = await fetch(`${API_URL}/chatbot/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: question,
                    historique: historique.slice(-4)
                })
            });
            
            const data = await reponse.json();
            chargement.remove();
            
            if (data.success) {
                afficherMessage("bot", data.reponse);
            } else {
                afficherMessage("bot", "❌ Désolé, je n'arrive pas à répondre. Réessaie !");
            }
        } catch (erreur) {
            chargement.remove();
            afficherMessage("bot", "❌ Erreur de connexion. Vérifie ton internet.");
        } finally {
            enCours = false;
            input.focus();
        }
    }
    
    // ============================================
    // UTILITAIRE
    // ============================================
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
    
});