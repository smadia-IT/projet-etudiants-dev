document.addEventListener("DOMContentLoaded", function() {
    
    // ============================================
    // AFFICHAGE DE L'AVATAR ET DU NOM
    // ============================================
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    
    const profilAvatar = document.getElementById("profil-avatar");
    const profilNom = document.getElementById("profil-nom");
    const profilEmail = document.getElementById("profil-email");
    
    if (user && profilAvatar && profilNom) {
        // Nom complet (prenom nom ou username)
        const nomComplet = (user.prenom && user.nom) 
            ? `${user.prenom} ${user.nom}` 
            : user.username;
        profilNom.textContent = nomComplet;
        
        if (profilEmail && user.email) {
            profilEmail.textContent = user.email;
        }
        
        // Avatar : image si dispo, sinon initiale
        afficherAvatar(user.avatar_url, user.prenom || user.username);
    }
    
    // Vérifier le token auprès du serveur (au cas où le profil a été mis à jour)
    if (token) {
        fetch(`${API_URL}/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                // Mettre à jour les infos locales
                localStorage.setItem("user", JSON.stringify(data.data));
                
                const nomComplet = (data.data.prenom && data.data.nom) 
                    ? `${data.data.prenom} ${data.data.nom}` 
                    : data.data.username;
                
                if (profilNom) profilNom.textContent = nomComplet;
                if (profilEmail) profilEmail.textContent = data.data.email || "";
                
                afficherAvatar(data.data.avatar_url, data.data.prenom || data.data.username);
            }
        })
        .catch(err => console.error("Erreur récupération profil:", err));
    }
    
    function afficherAvatar(avatarUrl, fallbackText) {
        if (!profilAvatar) return;
        
        if (avatarUrl) {
            // Photo disponible
            profilAvatar.innerHTML = `<img src="${avatarUrl}" alt="Photo de profil">`;
        } else {
            // Initiale
            const initiale = (fallbackText || "?").charAt(0).toUpperCase();
            profilAvatar.innerHTML = `<span>${initiale}</span>`;
        }
    }
    
    // ============================================
    // UPLOAD DE LA PHOTO DE PROFIL
    // ============================================
    const formAvatar = document.getElementById("form-avatar");
    const inputAvatar = document.getElementById("avatar-input");
    
    if (formAvatar && inputAvatar) {
        // Déclencher l'upload dès qu'un fichier est choisi
        inputAvatar.addEventListener("change", function() {
            if (inputAvatar.files[0]) {
                formAvatar.dispatchEvent(new Event("submit"));
            }
        });
        
        formAvatar.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            if (!inputAvatar.files[0]) return;
            
            // Vérifier la taille (5 Mo max)
            if (inputAvatar.files[0].size > 5 * 1024 * 1024) {
                alert("❌ L'image est trop lourde (5 Mo maximum)");
                return;
            }
            
            // Aperçu immédiat
            const reader = new FileReader();
            reader.onload = function(event) {
                profilAvatar.innerHTML = `<img src="${event.target.result}" alt="Aperçu">`;
            };
            reader.readAsDataURL(inputAvatar.files[0]);
            
            // Envoi au serveur
            const formData = new FormData();
            formData.append("fileUpload", inputAvatar.files[0]);
            
            try {
                const reponse = await fetch(`${API_URL}/utilisateurs/avatar`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                });
                
                const data = await reponse.json();
                if (!data.success) throw new Error(data.error || "Erreur");
                
                // Mettre à jour le user en localStorage
                const userMaj = { ...user, avatar_url: data.avatar_url };
                localStorage.setItem("user", JSON.stringify(userMaj));
                
                alert("✅ Photo mise à jour !");
                
            } catch (erreur) {
                alert("❌ " + erreur.message);
                // En cas d'erreur, remettre l'ancien avatar
                const userActuel = JSON.parse(localStorage.getItem("user") || "null");
                if (userActuel) {
                    afficherAvatar(userActuel.avatar_url, userActuel.prenom || userActuel.username);
                }
            }
        });
    }
    
    // ============================================
    // STATS QUIZ
    // ============================================
    const partiesJouees = parseInt(localStorage.getItem("partiesJouees")) || 0;
    const meilleurScore = parseInt(localStorage.getItem("meilleurScore")) || 0;
    const meilleurStreak = parseInt(localStorage.getItem("meilleurStreak")) || 0;
    
    document.getElementById("stat-parties").textContent = partiesJouees;
    document.getElementById("stat-meilleur-score").textContent = meilleurScore;
    document.getElementById("stat-meilleur-streak").textContent = meilleurStreak;
    
    // ============================================
    // STATS DICTIONNAIRE
    // ============================================
    const favoris = JSON.parse(localStorage.getItem("motsFavoris") || "[]");
    document.getElementById("stat-favoris").textContent = favoris.length;
    
    const listeRevision = JSON.parse(localStorage.getItem("motsAReviser") || "[]");
    const maitrises = listeRevision.filter(item => item.maitrise >= 3).length;
    
    document.getElementById("stat-revision").textContent = listeRevision.length;
    document.getElementById("stat-maitrises").textContent = maitrises;
    
    // ============================================
    // STATS BADGES
    // ============================================
    const badgesDebloques = JSON.parse(localStorage.getItem("badgesDebloques") || "[]");
    const totalBadges = (typeof BADGES !== "undefined") ? BADGES.length : 12;
    
    document.getElementById("stat-badges").textContent = badgesDebloques.length;
    document.getElementById("stat-badges-total").textContent = totalBadges;
    
    const pourcentage = totalBadges > 0 
        ? (badgesDebloques.length / totalBadges) * 100 
        : 0;
    document.getElementById("barre-badges").style.width = pourcentage + "%";
    
    // ============================================
    // BOUTON RESET
    // ============================================
    const btnReset = document.getElementById("btn-reset");
    
    btnReset.addEventListener("click", function() {
        const confirmation1 = confirm(
            "⚠️ ATTENTION ⚠️\n\n" +
            "Tu vas effacer TOUTES tes données :\n" +
            "- Scores et parties jouées\n" +
            "- Badges débloqués\n" +
            "- Favoris\n" +
            "- Mots en révision\n\n" +
            "Cette action est IRRÉVERSIBLE.\n\n" +
            "Es-tu sûr ?"
        );
        
        if (!confirmation1) return;
        
        const confirmation2 = confirm(
            "🔴 DERNIÈRE CONFIRMATION 🔴\n\n" +
            "Toutes tes données seront perdues.\n" +
            "Confirmer la suppression ?"
        );
        
        if (!confirmation2) return;
        
        localStorage.removeItem("partiesJouees");
        localStorage.removeItem("meilleurScore");
        localStorage.removeItem("meilleurStreak");
        localStorage.removeItem("motsFavoris");
        localStorage.removeItem("motsAReviser");
        localStorage.removeItem("badgesDebloques");
        
        alert("✅ Tes données ont été réinitialisées.");
        location.reload();
    });
    
});