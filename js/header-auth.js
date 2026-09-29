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