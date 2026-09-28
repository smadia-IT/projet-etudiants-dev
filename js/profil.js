document.addEventListener("DOMContentLoaded", function() {
    
    // ===== STATS QUIZ =====
    const partiesJouees = parseInt(localStorage.getItem("partiesJouees")) || 0;
    const meilleurScore = parseInt(localStorage.getItem("meilleurScore")) || 0;
    const meilleurStreak = parseInt(localStorage.getItem("meilleurStreak")) || 0;
    
    document.getElementById("stat-parties").textContent = partiesJouees;
    document.getElementById("stat-meilleur-score").textContent = meilleurScore;
    document.getElementById("stat-meilleur-streak").textContent = meilleurStreak;
    
    // ===== STATS DICTIONNAIRE =====
    // Favoris
    const favoris = JSON.parse(localStorage.getItem("motsFavoris") || "[]");
    document.getElementById("stat-favoris").textContent = favoris.length;
    
    // Révision
    const listeRevision = JSON.parse(localStorage.getItem("motsAReviser") || "[]");
    const maitrises = listeRevision.filter(item => item.maitrise >= 3).length;
    
    document.getElementById("stat-revision").textContent = listeRevision.length;
    document.getElementById("stat-maitrises").textContent = maitrises;
    
    // ===== STATS BADGES =====
    const badgesDebloques = JSON.parse(localStorage.getItem("badgesDebloques") || "[]");
    const totalBadges = (typeof BADGES !== "undefined") ? BADGES.length : 12;
    
    document.getElementById("stat-badges").textContent = badgesDebloques.length;
    document.getElementById("stat-badges-total").textContent = totalBadges;
    
    const pourcentage = totalBadges > 0 
        ? (badgesDebloques.length / totalBadges) * 100 
        : 0;
    document.getElementById("barre-badges").style.width = pourcentage + "%";
    
    // ===== BOUTON RESET =====
    const btnReset = document.getElementById("btn-reset");
    
    btnReset.addEventListener("click", function() {
        // Double confirmation (car c'est destructif)
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
        
        // Supprimer les données
        localStorage.removeItem("partiesJouees");
        localStorage.removeItem("meilleurScore");
        localStorage.removeItem("meilleurStreak");
        localStorage.removeItem("motsFavoris");
        localStorage.removeItem("motsAReviser");
        localStorage.removeItem("badgesDebloques");
        
        // Message de succès
        alert("✅ Tes données ont été réinitialisées.");
        
        // Recharger la page pour mettre à jour l'affichage
        location.reload();
    });
    
});