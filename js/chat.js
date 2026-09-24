// ⚠️ ATTENTION : À déplacer côté serveur plus tard !
const GEMINI_API_KEY = "CLÉ_DANS_LE_FICHIER_.ENV";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";
document.addEventListener("DOMContentLoaded", function() {
    
    const historiqueChat = document.getElementById("historique-chat");
    const champQuestion = document.getElementById("question");
    const btnEnvoyer = document.getElementById("btn-envoyer");
    const btnEffacer = document.getElementById("btn-effacer");
    
    // Envoyer un message
    btnEnvoyer.addEventListener("click", envoyerMessage);
    champQuestion.addEventListener("keypress", function(e) {
        if (e.key === "Enter") envoyerMessage();
    });
    
    // Effacer la conversation
    btnEffacer.addEventListener("click", function() {
        historiqueChat.innerHTML = "";
    });
    
    async function envoyerMessage() {
        const question = champQuestion.value.trim();
        if (question === "") return;
        
        ajouterMessage(question, "user");
        champQuestion.value = "";
        
        btnEnvoyer.disabled = true;
        btnEnvoyer.textContent = "⏳";
        const messageAttente = ajouterMessage("Je réfléchis...", "ia");
        
        try {
            const reponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: question }]
                    }]
                })
            });
            
            const donnees = await reponse.json();
            console.log("Réponse Gemini :", JSON.stringify(donnees, null, 2));
            
            if (donnees.error) {
                messageAttente.textContent = "❌ Erreur API : " + donnees.error.message;
                return;
            }
            
            if (!donnees.candidates || !donnees.candidates[0]) {
                messageAttente.textContent = "❌ Réponse inattendue.";
                return;
            }
            
            const texteIA = donnees.candidates[0].content.parts[0].text;
            messageAttente.textContent = texteIA;
            
        } catch (erreur) {
            messageAttente.textContent = "❌ Erreur : " + erreur.message;
            console.error(erreur);
        } finally {
            btnEnvoyer.disabled = false;
            btnEnvoyer.textContent = "Envoyer";
            historiqueChat.scrollTop = historiqueChat.scrollHeight;
        }
    }
    
    function ajouterMessage(texte, type) {
        const div = document.createElement("div");
        div.className = type === "user" ? "message-user" : "message-ia";
        div.textContent = texte;
        historiqueChat.appendChild(div);
        historiqueChat.scrollTop = historiqueChat.scrollHeight;
        return div;
    }
    
});