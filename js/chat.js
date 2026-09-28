// ⚠️ ATTENTION : À déplacer côté serveur plus tard !
const GEMINI_API_KEY = "CLÉ_DANS_LE_FICHIER_.ENV";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse";
document.addEventListener("DOMContentLoaded", function() {
    
    // ===== RÉFÉRENCES DOM =====
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
        // Charger la plus récente
        chargerConversation(conversations[conversations.length - 1].id);
    }
    
    afficherListeConversations();
    
    // ===== ÉCOUTEURS =====
    btnEnvoyer.addEventListener("click", envoyerMessage);
    champQuestion.addEventListener("keypress", function(e) {
        if (e.key === "Enter") envoyerMessage();
    });
    
    btnNouvelleConv.addEventListener("click", creerNouvelleConversation);
    
    // ===== FONCTIONS CONVERSATIONS =====
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
    
    function afficherListeConversations() {
        listeConversations.innerHTML = "";
        
        // Afficher de la plus récente à la plus ancienne
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
    
        // Variable pour mémoriser la dernière question (pour "Réessayer")
        let derniereQuestion = "";
    window.derniereQuestionChat = "";  // Exposé globalement
    
    // ===== ENVOI DE MESSAGE =====
        async function envoyerMessage() {
               const question = champQuestion.value.trim();
        if (question === "") return;
        
               derniereQuestion = question;
        window.derniereQuestionChat = question;  // ← Mémoriser globalement
        const conv = getConversationActive();
        if (!conv) return;
        
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
        
        // 3. Désactiver le bouton
        btnEnvoyer.disabled = true;
        btnEnvoyer.textContent = "⏳";
        
        // 4. Créer un élément pour la réponse de l'IA
                const messageIA = document.createElement("div");
        messageIA.className = "message-ia chargement";
        messageIA.textContent = "";// Vide au départ
        historiqueChat.appendChild(messageIA);
        historiqueChat.scrollTop = historiqueChat.scrollHeight;
        
        let texteComplet = "";
        
        try {
            const reponse = await fetch(`${GEMINI_URL}&key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: question }] }]
                })
            });
            
            if (!reponse.ok) {
                throw new Error(`Erreur HTTP : ${reponse.status}`);
            }
            
            // Lire le flux en streaming
            const reader = reponse.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // Décoder le morceau reçu
                                buffer += decoder.decode(value, { stream: true });
                
                // DEBUG (à retirer plus tard)
                console.log("Buffer:", JSON.stringify(buffer));
                
                // Le format SSE : les données sont séparées par "\n\n" ou "\r\n\r\n"
                const lignes = buffer.split(/\r?\n\r?\n/);
                buffer = lignes.pop() || "";  // Garder le dernier morceau incomplet
                
                for (const ligne of lignes) {
                    if (!ligne.startsWith("data: ")) continue;
                    
                    const jsonStr = ligne.substring(6);  // Enlever "data: "
                    if (jsonStr.trim() === "[DONE]") continue;
                    
                    try {
                        const data = JSON.parse(jsonStr);
                        
                        if (data.candidates && data.candidates[0] && 
                            data.candidates[0].content && 
                            data.candidates[0].content.parts && 
                            data.candidates[0].content.parts[0]) {
                            
                                                        const morceau = data.candidates[0].content.parts[0].text;
                            if (morceau) {
                                // Retirer la classe "chargement" au premier morceau
                                messageIA.classList.remove("chargement");
                                texteComplet += morceau;
                                messageIA.textContent = texteComplet;
                                historiqueChat.scrollTop = historiqueChat.scrollHeight;
                            }
                        }
                    } catch (e) {
                        // Ignorer les erreurs de parsing JSON individuelles
                        console.warn("Erreur parsing chunk:", e);
                    }
                }
            }
            
            // Sauvegarder la réponse complète
            conv.messages.push({ role: "ia", texte: texteComplet });
            sauvegarderConversations();
            
                } catch (erreur) {
            const msg = erreur.message || "";
            
                       if (msg.includes("503")) {
                messageIA.innerHTML = `
                    😅 <strong>L'assistant est surchargé</strong><br>
                    <span style="font-size: 14px;">
                        Google a temporairement trop de demandes. Réessaie dans quelques secondes.
                    </span>
                    <button class="btn-reessayer" onclick="reessayerQuestion()">🔄 Réessayer</button>
                `;
            } else if (msg.includes("429")) {
                messageIA.innerHTML = `
                    ⏳ <strong>Trop de questions d'un coup</strong><br>
                    <span style="font-size: 14px;">
                        Attends une minute avant de poser une nouvelle question.
                    </span>
                `;
            } else if (msg.includes("403") || msg.includes("401")) {
                messageIA.innerHTML = `
                    🔑 <strong>Problème d'authentification</strong><br>
                    <span style="font-size: 14px;">
                        Vérifie que ta clé API est valide dans le fichier <code>.env</code>.
                    </span>
                `;
            } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
                messageIA.innerHTML = `
                    🌐 <strong>Problème de connexion</strong><br>
                    <span style="font-size: 14px;">
                        Vérifie ta connexion internet et réessaie.
                    </span>
                `;
            } else {
                messageIA.innerHTML = `
                    ❌ <strong>Erreur :</strong> ${msg}<br>
                    <span style="font-size: 14px;">
                        Réessaie dans quelques instants.
                    </span>
                `;
            }
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
// ===== FONCTION GLOBALE POUR "RÉESSAYER" =====
function reessayerQuestion() {
    // On retrouve le champ de saisie
    const champ = document.getElementById("question");
    const btn = document.getElementById("btn-envoyer");
    
    // On remplit le champ avec la dernière question et on relance
    // ⚠️ Cette fonction utilise une variable globale
    if (window.derniereQuestionChat) {
        champ.value = window.derniereQuestionChat;
        btn.click();
    }
}