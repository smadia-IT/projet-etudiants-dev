// ============================================
// CHATBOT D'AIDE — Bouton flottant + panneau
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    // ============================================
    // CRÉATION DU BOUTON FLOTTANT
    // ============================================
    const btnChatbot = document.createElement("button");
    btnChatbot.id = "btn-chatbot";
    btnChatbot.className = "btn-chatbot";
    btnChatbot.innerHTML = `💬`;
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
        <div class="chatbot-messages" id="chatbot-messages"></div>
        <div class="chatbot-suggestions" id="chatbot-suggestions"></div>
        <form class="chatbot-saisie" id="chatbot-form">
            <input type="text" id="chatbot-input" placeholder="Pose ta question..." autocomplete="off">
            <button type="submit" class="chatbot-envoyer">➤</button>
        </form>
    `;
    document.body.appendChild(panneau);

    // ============================================
    // RÉFÉRENCES
    // ============================================
    const messages = document.getElementById("chatbot-messages");
    const suggestions = document.getElementById("chatbot-suggestions");
    const form = document.getElementById("chatbot-form");
    const input = document.getElementById("chatbot-input");
    const btnFermer = document.getElementById("chatbot-fermer");

    let historique = [];
    let enCours = false;

    const SUGGESTIONS = [
        { label: "Comment réviser ?", question: "Comment réviser ?" },
        { label: "Gagner des points", question: "Comment gagner des points ?" },
        { label: "Ajouter un ami", question: "Comment ajouter un ami ?" },
        { label: "À quoi sert le dictionnaire ?", question: "À quoi sert le dictionnaire ?" }
    ];

    // ============================================
    // OUVERTURE / FERMETURE
    // ============================================
    btnChatbot.addEventListener("click", function () {
        panneau.classList.toggle("cache");
        if (!panneau.classList.contains("cache")) {
            chargerAstuce();
            input.focus();
        }
    });

    btnFermer.addEventListener("click", function () {
        panneau.classList.add("cache");
    });

    // ============================================
    // ASTUCE DU JOUR (une seule fois par ouverture)
    // ============================================
    async function chargerAstuce() {
        if (messages.dataset.astuceChargee) return;
        messages.dataset.astuceChargee = "true";

        let texteAstuce = "";
        try {
            const reponse = await fetch(`${API_URL}/chatbot/astuce`);
            const data = await reponse.json();
            if (data.success) texteAstuce = data.astuce;
        } catch (erreur) {
            // Pas grave : on affiche le message d'accueil seul
        }

        afficherMessage("bot", `Salut ! 👋 Je suis là pour t'aider à utiliser Étudiants IT.` +
            (texteAstuce ? `\n\n${texteAstuce}` : ""));
        afficherSuggestions();
    }

    function afficherSuggestions() {
        suggestions.innerHTML = "";
        suggestions.classList.remove("cache");
        SUGGESTIONS.forEach(function (s) {
            const btn = document.createElement("button");
            btn.className = "chatbot-suggestion";
            btn.textContent = s.label;
            btn.addEventListener("click", function () {
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
        msg.innerHTML = escapeHtml(texte).replace(/\n/g, "<br>");
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;

        historique.push({
            role: type === "bot" ? "model" : "user",
            contenu: texte
        });
    }

    // ============================================
    // ENVOYER UNE QUESTION
    // ============================================
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const question = input.value.trim();
        if (question) envoyerQuestion(question);
    });

    async function envoyerQuestion(question) {
        if (enCours) return;
        enCours = true;

        afficherMessage("user", question);
        input.value = "";
        suggestions.classList.add("cache");

        const chargement = document.createElement("div");
        chargement.className = "chatbot-message bot chargement";
        chargement.textContent = "⏳ Réfléchit...";
        messages.appendChild(chargement);
        messages.scrollTop = messages.scrollHeight;

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                chargement.remove();
                afficherMessage("bot", "🔒 Connecte-toi pour utiliser l'aide. Tu peux le faire depuis la page Connexion.");
                return;
            }

            const reponse = await fetch(`${API_URL}/chatbot/ask`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    question: question,
                    historique: historique.slice(-4),
                    contexte: {
                        connecte: true,
                        pageActuelle: window.location.pathname.split("/").pop() || "index.html",
                        notificationsActivees: ("Notification" in window) && Notification.permission === "granted"
                    }
                })
            });

            const data = await reponse.json();
            chargement.remove();

            if (data.success) {
                afficherMessage("bot", data.reponse);
            } else if (reponse.status === 401) {
                afficherMessage("bot", "🔒 Ta session a expiré. Reconnecte-toi, s'il te plaît.");
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
    function escapeHtml(texte) {
        const div = document.createElement("div");
        div.textContent = texte ?? "";
        return div.innerHTML;
    }

});