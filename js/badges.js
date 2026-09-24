document.addEventListener("DOMContentLoaded", function() {
    
    const listeBadges = document.getElementById("liste-badges");
    const compteurBadges = document.getElementById("compteur-badges");
    
    const badgesDebloques = getBadgesDebloques();
    
    // Afficher le compteur
    compteurBadges.textContent = `${badgesDebloques.length} / ${BADGES.length} badges débloqués`;
    
    // Afficher tous les badges
    BADGES.forEach(badge => {
        const estDebloque = badgesDebloques.includes(badge.id);
        
        const carte = document.createElement("div");
        carte.className = "badge-carte " + (estDebloque ? "debloque" : "verrouille");
        carte.innerHTML = `
            <div class="badge-icone">${badge.icone}</div>
            <div class="badge-nom">${badge.nom}</div>
            <div class="badge-description">${badge.description}</div>
            <span class="badge-statut">${estDebloque ? "✅ Débloqué" : "🔒 Verrouillé"}</span>
        `;
        listeBadges.appendChild(carte);
    });
    
});