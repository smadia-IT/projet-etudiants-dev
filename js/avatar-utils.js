// ============================================
// UTILITAIRE : GÉNÉRATION D'AVATAR
// ============================================

/**
 * Génère le HTML d'un avatar (photo ou initiale)
 * @param {Object} utilisateur - Objet avec {avatar_url, prenom, nom, username}
 * @param {string} taille - "petit" (32px) | "moyen" (44px) | "grand" (120px)
 * @returns {string} HTML de l'avatar
 */
function genererAvatarHTML(utilisateur, taille = "moyen") {
    const nomComplet = (utilisateur.prenom && utilisateur.nom)
        ? `${utilisateur.prenom} ${utilisateur.nom}`
        : utilisateur.username;
    
    const initiale = (utilisateur.prenom || utilisateur.username || "?").charAt(0).toUpperCase();
    
    const classes = {
        petit: "avatar-petit",
        moyen: "avatar-moyen",
        grand: "avatar-grand"
    };
    
    const classe = classes[taille] || classes.moyen;
    
    if (utilisateur.avatar_url) {
        return `<div class="avatar-utilisateur-photo ${classe}">
            <img src="${utilisateur.avatar_url}" alt="${escapeHtmlAvatar(nomComplet)}">
        </div>`;
    } else {
        return `<div class="avatar-utilisateur-initiale ${classe}">${initiale}</div>`;
    }
}

/**
 * Renvoie le nom complet (prenom nom ou username)
 */
function getNomComplet(utilisateur) {
    if (utilisateur.prenom && utilisateur.nom) {
        return `${utilisateur.prenom} ${utilisateur.nom}`;
    }
    return utilisateur.username;
}

function escapeHtmlAvatar(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}