// ============================================
// UTILITAIRE : GÉNÉRATION D'AVATAR
// ============================================

// Protège le texte avant de l'insérer dans du HTML
function echapperAvatar(texte) {
    const div = document.createElement("div");
    div.textContent = texte ?? "";
    return div.innerHTML;
}

// Vérifie que l'URL est bien une adresse web (http ou https)
function urlAvatarSure(url) {
    try {
        const adresse = new URL(url);
        return adresse.protocol === "https:" || adresse.protocol === "http:" ? adresse.href : null;
    } catch (erreur) {
        return null;
    }
}

/**
 * Génère le HTML d'un avatar (photo ou initiale)
 * @param {Object} utilisateur - Objet avec {avatar_url, prenom, nom, username}
 * @param {string} taille - "petit" (32px) | "moyen" (44px) | "grand" (120px)
 * @returns {string} HTML de l'avatar
 */
function genererAvatarHTML(utilisateur, taille = "moyen") {
    const nomComplet = getNomComplet(utilisateur);
    const initiale = echapperAvatar(
        (utilisateur.prenom || utilisateur.username || "?").charAt(0).toUpperCase()
    );

    const classes = {
        petit: "avatar-petit",
        moyen: "avatar-moyen",
        grand: "avatar-grand"
    };
    const classe = classes[taille] || classes.moyen;

    const urlSure = urlAvatarSure(utilisateur.avatar_url);

    if (urlSure) {
        return `<div class="avatar-utilisateur-photo ${classe}">
            <img src="${echapperAvatar(urlSure)}" alt="${echapperAvatar(nomComplet)}">
        </div>`;
    }

    return `<div class="avatar-utilisateur-initiale ${classe}">${initiale}</div>`;
}

/**
 * Renvoie le nom complet (prenom nom ou username)
 */
function getNomComplet(utilisateur) {
    if (utilisateur.prenom && utilisateur.nom) {
        return `${utilisateur.prenom} ${utilisateur.nom}`;
    }
    return utilisateur.username || "";
}