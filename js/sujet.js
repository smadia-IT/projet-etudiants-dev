// ============================================
// PAGE SUJET (détail du forum)
// ============================================



document.addEventListener("DOMContentLoaded", function() {
    
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    
    // ===== RÉCUPÉRER L'ID DU SUJET =====
    const params = new URLSearchParams(window.location.search);
    const postId = parseInt(params.get("id"));
    
    if (!postId) {
        window.location.href = "forum.html";
        return;
    }
    
    // ===== RÉFÉRENCES DOM =====
    const ecranChargement = document.getElementById("ecran-chargement");
    const ecranErreur = document.getElementById("ecran-erreur");
    const ecranSujet = document.getElementById("ecran-sujet");
    const erreurMessage = document.getElementById("erreur-message");
    
    const sujetDomaine = document.getElementById("sujet-domaine");
    const sujetTitre = document.getElementById("sujet-titre");
    const sujetAvatar = document.getElementById("sujet-avatar");
    const sujetAuteurLien = document.getElementById("sujet-auteur-lien");
    const sujetAuteur = document.getElementById("sujet-auteur");
    const sujetDate = document.getElementById("sujet-date");
    const sujetContenu = document.getElementById("sujet-contenu");
    const btnSupprimerSujet = document.getElementById("btn-supprimer-sujet");
    
    const nbCommentaires = document.getElementById("nb-commentaires");
    const listeCommentaires = document.getElementById("liste-commentaires");
    const formCommentaire = document.getElementById("form-commentaire");
    const commentaireContenu = document.getElementById("commentaire-contenu");
    const messageNonConnecte = document.getElementById("message-non-connecte");
    
    // ===== CHARGER LE SUJET =====
    async function chargerSujet() {
        try {
            const reponse = await fetch(`${API_URL}/forum/posts/${postId}`);
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            afficherSujet(data.data.post, data.data.commentaires);
        } catch (erreur) {
            ecranChargement.classList.add("cache");
            ecranErreur.classList.remove("cache");
            erreurMessage.textContent = erreur.message;
        }
    }
    
    // ===== AFFICHER LE SUJET =====
    function afficherSujet(post, commentaires) {
        // Titre et domaine
        sujetDomaine.textContent = post.domaine;
        sujetTitre.textContent = post.titre;
        
        // Auteur
        const initiale = post.username.charAt(0).toUpperCase();
        sujetAvatar.textContent = initiale;
        sujetAuteur.textContent = post.username;
        sujetAuteurLien.href = `profil-public.html?id=${post.user_id}`;
        
        // Date
        const date = new Date(post.date);
        sujetDate.textContent = date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
        
        // Contenu
        sujetContenu.textContent = post.contenu;
        
        // Bouton supprimer (si je suis l'auteur)
        if (user && post.user_id === user.id) {
            btnSupprimerSujet.classList.remove("cache");
            btnSupprimerSujet.addEventListener("click", supprimerSujet);
        }
        
        // Commentaires
        afficherCommentaires(commentaires);
        
        // Formulaire de commentaire (si connecté)
        if (token && user) {
            formCommentaire.classList.remove("cache");
        } else {
            messageNonConnecte.classList.remove("cache");
        }
        
        // Afficher l'écran
        ecranChargement.classList.add("cache");
        ecranSujet.classList.remove("cache");
    }
    
    // ===== AFFICHER LES COMMENTAIRES =====
    function afficherCommentaires(commentaires) {
        nbCommentaires.textContent = commentaires.length;
        
        if (commentaires.length === 0) {
            listeCommentaires.innerHTML = `
                <div class="aucun-commentaire">
                    Aucune réponse pour l'instant. Sois le premier à aider ! 💬
                </div>
            `;
            return;
        }
        
        listeCommentaires.innerHTML = "";
        commentaires.forEach(com => {
            listeCommentaires.appendChild(creerCarteCommentaire(com));
        });
    }
    
    // ===== CRÉER UNE CARTE DE COMMENTAIRE =====
    function creerCarteCommentaire(com) {
        const carte = document.createElement("div");
        carte.className = "carte-commentaire";
        
        const initiale = com.username.charAt(0).toUpperCase();
        const date = new Date(com.date);
        const dateStr = date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
        
        const peutSupprimer = user && com.user_id === user.id;
        
        carte.innerHTML = `
            <div class="commentaire-entete">
                <a href="profil-public.html?id=${com.user_id}" class="commentaire-auteur">
                    <div class="avatar-utilisateur">${initiale}</div>
                    <div>
                        <div class="commentaire-auteur-nom">${escapeHtml(com.username)}</div>
                        <div class="commentaire-date">${dateStr}</div>
                    </div>
                </a>
                ${peutSupprimer ? `<button class="btn-supprimer" data-id="${com.id}">🗑️</button>` : ""}
            </div>
            <div class="commentaire-contenu">${escapeHtml(com.contenu)}</div>
        `;
        
        // Écouteur supprimer
        const btnSuppr = carte.querySelector(".btn-supprimer");
        if (btnSuppr) {
            btnSuppr.addEventListener("click", () => supprimerCommentaire(com.id));
        }
        
        return carte;
    }
    
    // ===== AJOUTER UN COMMENTAIRE =====
    formCommentaire.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const contenu = commentaireContenu.value.trim();
        if (!contenu) return;
        
        const btnSubmit = formCommentaire.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "⏳ Publication...";
        
        try {
            const reponse = await fetch(`${API_URL}/forum/posts/${postId}/commentaires`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ contenu })
            });
            
            const data = await reponse.json();
            if (!data.success) throw new Error(data.error);
            
            // Vider le formulaire
            commentaireContenu.value = "";
            
            // Recharger les commentaires
            chargerSujet();
            
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "💬 Publier";
        }
    });
    
    // ===== SUPPRIMER LE SUJET =====
    async function supprimerSujet() {
        if (!confirm("Supprimer ce sujet et TOUS ses commentaires ?")) return;
        
        try {
            const reponse = await fetch(`${API_URL}/forum/posts/${postId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await reponse.json();
            if (!data.success) throw new Error(data.error);
            
            alert("✅ Sujet supprimé");
            window.location.href = "forum.html";
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        }
    }
    
    // ===== SUPPRIMER UN COMMENTAIRE =====
    async function supprimerCommentaire(commentaireId) {
        if (!confirm("Supprimer ce commentaire ?")) return;
        
        try {
            const reponse = await fetch(`${API_URL}/forum/commentaires/${commentaireId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await reponse.json();
            if (!data.success) throw new Error(data.error);
            
            chargerSujet();
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        }
    }
    
    // ===== UTILITAIRE : ESCAPER HTML =====
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ===== LANCEMENT =====
    chargerSujet();
});