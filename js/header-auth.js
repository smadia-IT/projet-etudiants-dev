// ============================================
// AFFICHAGE CONDITIONNEL DANS LE HEADER
// ============================================



document.addEventListener("DOMContentLoaded", function() {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    
    const nav = document.querySelector(".nav-principale");
    if (!nav) return;
    
    let lienAuth = document.getElementById("lien-auth");
    
    if (!lienAuth) {
        lienAuth = document.createElement("a");
        lienAuth.id = "lien-auth";
        lienAuth.href = "auth.html";
        
        const btnTheme = document.getElementById("btn-theme");
        if (btnTheme) {
            nav.insertBefore(lienAuth, btnTheme);
        } else {
            nav.appendChild(lienAuth);
        }
    }
    
    if (user && token) {
        // ===== CONNECTÉ =====
        lienAuth.textContent = `👤 ${user.username} ▼`;
        lienAuth.href = "#";
        lienAuth.classList.add("connecte");
        
              // Charger le nombre de messages non lus (avec rafraîchissement auto)
        demarrerRafraichissementBadge(token);
        // Créer le menu déroulant
        let menuUser = document.getElementById("menu-user");
        if (!menuUser) {
            menuUser = document.createElement("div");
            menuUser.id = "menu-user";
            menuUser.className = "menu-user";
            menuUser.innerHTML = `
                <a href="profil.html">📊 Mon profil</a>
                <a href="amis.html">👥 Mes amis</a>
                <a href="messages.html">💬 Messages</a>
                <a href="badges.html">🏆 Mes badges</a>
                <button id="btn-deconnexion-header">🚪 Se déconnecter</button>
            `;
            lienAuth.parentElement.style.position = "relative";
            lienAuth.parentElement.appendChild(menuUser);
        }
        
        lienAuth.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            menuUser.classList.toggle("ouvert");
        });
        
        document.addEventListener("click", function() {
            menuUser.classList.remove("ouvert");
        });
        
        document.getElementById("btn-deconnexion-header").addEventListener("click", function(e) {
            e.stopPropagation();
            if (confirm("Veux-tu vraiment te déconnecter ?")) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "index.html";
            }
        });
        
                // ✅ AJOUT : Cloche de notifications
        creerClocheNotifications(nav, user, token);
        
    } else {
    
        // ===== NON CONNECTÉ =====
        lienAuth.textContent = "Connexion";
        lienAuth.href = "auth.html";
        lienAuth.classList.remove("connecte");
    }
});

// ===== BADGE DE MESSAGES NON LUS =====
async function chargerBadgeMessages(token) {
    try {
        const reponse = await fetch(`${API_URL}/messages/non-lus/count`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await reponse.json();
        
        if (!data.success) return;
        
        // Trouver ou créer le badge sur le lien Messages
       // On cherche UNIQUEMENT dans la nav principale
const navPrincipale = document.querySelector(".nav-principale");
const lienMessages = navPrincipale ? navPrincipale.querySelector('a[href="messages.html"]') : null;
        if (!lienMessages) return;
        
        // Supprimer l'ancien badge s'il existe
        const ancienBadge = lienMessages.querySelector(".badge-notif");
        if (ancienBadge) ancienBadge.remove();
        
        if (data.count > 0) {
            const badge = document.createElement("span");
            badge.className = "badge-notif";
            badge.textContent = data.count > 99 ? "99+" : data.count;
            lienMessages.appendChild(badge);
        }
    } catch (erreur) {
        console.error("Erreur badge messages:", erreur);
    }
}
// Rafraîchir le badge toutes les 30 secondes
function demarrerRafraichissementBadge(token) {
    // Rafraîchir immédiatement
    chargerBadgeMessages(token);
    
    // Puis toutes les 30 secondes
    setInterval(() => {
        chargerBadgeMessages(token);
    }, 30000); // 30000 ms = 30 secondes
}

// ============================================
// CLOCHE DE NOTIFICATIONS
// ============================================
function creerClocheNotifications(nav, user, token) {
    // Ne pas créer si déjà là
    if (document.getElementById("cloche-notifs")) return;
    
    const btnTheme = document.getElementById("btn-theme");
    
    // Conteneur de la cloche
    const cloche = document.createElement("div");
    cloche.id = "cloche-notifs";
    cloche.className = "cloche-notifs";
    cloche.innerHTML = `
        <button class="cloche-btn" id="cloche-btn" title="Notifications">
            🔔
            <span class="cloche-badge cache" id="cloche-badge">0</span>
        </button>
        <div class="cloche-panneau cache" id="cloche-panneau">
            <div class="cloche-entete">
                <h3>🔔 Notifications</h3>
                <button class="cloche-tout-lu" id="cloche-tout-lu" title="Tout marquer comme lu">
                    ✓ Tout lire
                </button>
            </div>
            <div class="cloche-liste" id="cloche-liste">
                <p class="cloche-vide">Chargement...</p>
            </div>
        </div>
    `;
    
    // Insérer avant le bouton thème
    if (btnTheme) {
        nav.insertBefore(cloche, btnTheme);
    } else {
        nav.appendChild(cloche);
    }
    
    // Événements
    const btn = document.getElementById("cloche-btn");
    const panneau = document.getElementById("cloche-panneau");
    const btnToutLu = document.getElementById("cloche-tout-lu");
    
    btn.addEventListener("click", function(e) {
        e.stopPropagation();
        panneau.classList.toggle("cache");
        if (!panneau.classList.contains("cache")) {
            chargerNotifications(token);
        }
    });
    
    // Empêcher fermeture quand on clique dans le panneau
    panneau.addEventListener("click", function(e) {
        e.stopPropagation();
    });
    
    // Fermer en cliquant ailleurs
    document.addEventListener("click", function() {
        panneau.classList.add("cache");
    });
    
    // Tout marquer comme lu
    btnToutLu.addEventListener("click", async function(e) {
        e.stopPropagation();
        try {
            await fetch(`${API_URL}/notifications/tout-lu`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            chargerNotifications(token);
        } catch (erreur) {
            console.error("Erreur tout-lu:", erreur);
        }
    });
    
    // Démarrer le refresh
    chargerCompteurNotifs(token);
    setInterval(() => chargerCompteurNotifs(token), 30000); // toutes les 30s
}

// ============================================
// Charger le compteur de notifs
// ============================================
async function chargerCompteurNotifs(token) {
    try {
        const reponse = await fetch(`${API_URL}/notifications/non-lus/count`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await reponse.json();
        
        if (!data.success) return;
        
        const badge = document.getElementById("cloche-badge");
        if (!badge) return;
        
        if (data.count > 0) {
            badge.textContent = data.count > 99 ? "99+" : data.count;
            badge.classList.remove("cache");
        } else {
            badge.classList.add("cache");
        }
    } catch (erreur) {
        console.error("Erreur compteur notifs:", erreur);
    }
}

// ============================================
// Charger la liste des notifs dans le panneau
// ============================================
async function chargerNotifications(token) {
    const liste = document.getElementById("cloche-liste");
    if (!liste) return;
    
    try {
        const reponse = await fetch(`${API_URL}/notifications?limit=10`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await reponse.json();
        
        if (!data.success) throw new Error(data.error);
        
        if (data.count === 0) {
            liste.innerHTML = `<p class="cloche-vide">Aucune notification</p>`;
            return;
        }
        
        liste.innerHTML = "";
        data.data.forEach(notif => {
            liste.appendChild(creerItemNotif(notif, token));
        });
    } catch (erreur) {
        console.error("Erreur chargement notifs:", erreur);
        liste.innerHTML = `<p class="cloche-vide">Erreur de chargement</p>`;
    }
}

// ============================================
// Créer un item de notif
// ============================================
function creerItemNotif(notif, token) {
    const item = document.createElement("div");
    item.className = "cloche-item" + (notif.lu ? "" : " non-lu");
    
    // Formater la date
    const date = new Date(notif.date);
    const maintenant = new Date();
    const diffMin = Math.floor((maintenant - date) / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffJ = Math.floor(diffH / 24);
    
    let dateAffichage;
    if (diffMin < 1) dateAffichage = "à l'instant";
    else if (diffMin < 60) dateAffichage = `il y a ${diffMin} min`;
    else if (diffH < 24) dateAffichage = `il y a ${diffH}h`;
    else if (diffJ < 7) dateAffichage = `il y a ${diffJ}j`;
    else dateAffichage = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    
    // Icône selon le type
    const icones = {
        message: "💬",
        ami: "👥",
        forum: "📝",
        rappel: "⏰",
        badge: "🏆"
    };
    const icone = icones[notif.type] || "🔔";
    
    item.innerHTML = `
        <div class="cloche-item-icone">${icone}</div>
        <div class="cloche-item-contenu">
            <div class="cloche-item-titre">${escapeHtmlNotif(notif.titre)}</div>
            ${notif.message ? `<div class="cloche-item-message">${escapeHtmlNotif(notif.message)}</div>` : ""}
            <div class="cloche-item-date">${dateAffichage}</div>
        </div>
    `;
    
    item.addEventListener("click", async function() {
        // Marquer comme lue
        if (!notif.lu) {
            try {
                await fetch(`${API_URL}/notifications/${notif.id}/lu`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
            } catch (erreur) {
                console.error("Erreur marquer lu:", erreur);
            }
        }
        
        // Rediriger si lien
        if (notif.lien) {
            window.location.href = notif.lien;
        } else {
            // Sinon, juste rafraîchir la liste
            chargerNotifications(token);
            chargerCompteurNotifs(token);
        }
    });
    
    return item;
}

// ============================================
// Sécuriser le HTML
// ============================================
function escapeHtmlNotif(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}