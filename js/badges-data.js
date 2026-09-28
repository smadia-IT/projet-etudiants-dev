// ============================================
// DÉFINITION DES BADGES
// ============================================
const BADGES = [
    {
        id: "premier-pas",
        nom: "Premier pas",
        icone: "🥇",
        description: "Jouer ta première partie",
        condition: (stats) => stats.partiesJouees >= 1
    },
    {
        id: "en-feu",
        nom: "En feu",
        icone: "🔥",
        description: "Réaliser une série de 5 bonnes réponses",
        condition: (stats) => stats.meilleurStreak >= 5
    },
        {
        id: "precis",
        nom: "Précis",
        icone: "🎯",
        description: "Répondre à 20 questions dans une partie avec 1 vie perdue maximum",
        condition: (stats) => stats.questionsRepondues >= 20 && stats.viesPerdues <= 1
    },
    {
        id: "apprenti",
        nom: "Apprenti",
        icone: "🎓",
        description: "Jouer 10 parties",
        condition: (stats) => stats.partiesJouees >= 10
    },
    {
        id: "cent-points",
        nom: "Cent points",
        icone: "💯",
        description: "Atteindre 100 points en une partie",
        condition: (stats) => stats.meilleurScore >= 100
    },
    {
        id: "sur-une-lancee",
        nom: "Sur une lancée",
        icone: "🚀",
        description: "Réaliser une série de 10 bonnes réponses",
        condition: (stats) => stats.meilleurStreak >= 10
    },
    {
        id: "accro",
        nom: "Accro",
        icone: "🎮",
        description: "Jouer 25 parties",
        condition: (stats) => stats.partiesJouees >= 25
    },
    {
        id: "savant",
        nom: "Savant",
        icone: "🧠",
        description: "Atteindre 500 points en une partie",
        condition: (stats) => stats.meilleurScore >= 500
    },
        {
        id: "invincible",
        nom: "Invincible",
        icone: "🛡️",
        description: "Répondre à 20 questions dans une partie sans perdre une seule vie",
        condition: (stats) => stats.questionsRepondues >= 20 && stats.viesPerdues === 0
    },
    {
        id: "legende",
        nom: "Légende",
        icone: "💎",
        description: "Atteindre 1000 points en une partie",
        condition: (stats) => stats.meilleurScore >= 1000
    },
    {
        id: "marathonien",
        nom: "Marathonien",
        icone: "🏃",
        description: "Jouer 50 parties",
        condition: (stats) => stats.partiesJouees >= 50
    },
    {
        id: "maitre",
        nom: "Maître",
        icone: "👑",
        description: "Atteindre 2000 points en une partie",
        condition: (stats) => stats.meilleurScore >= 2000
    }
];

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

// Récupérer les badges débloqués depuis le localStorage
function getBadgesDebloques() {
    const stockes = localStorage.getItem("badgesDebloques");
    return stockes ? JSON.parse(stockes) : [];
}

// Sauvegarder les badges débloqués
function sauvegarderBadgesDebloques(badges) {
    localStorage.setItem("badgesDebloques", JSON.stringify(badges));
}

// Vérifier quels badges sont débloqués selon les stats
function verifierBadges(stats) {
    const debloques = getBadgesDebloques();
    const nouveaux = [];
    
    BADGES.forEach(badge => {
        // Si déjà débloqué, on skip
        if (debloques.includes(badge.id)) return;
        
        // Vérifier la condition
        if (badge.condition(stats)) {
            debloques.push(badge.id);
            nouveaux.push(badge);
        }
    });
    
    if (nouveaux.length > 0) {
        sauvegarderBadgesDebloques(debloques);
    }
    
    return nouveaux;
}

// Afficher une notification pour un badge débloqué
function afficherNotificationBadge(badge) {
    // Son de badge
    if (typeof sonBadge === "function") {
        sonBadge();
    }
    
    const notif = document.createElement("div");
    notif.className = "notification-badge";
    notif.innerHTML = `
        <span class="notif-icone">${badge.icone}</span>
        <div class="notif-texte">
            <span class="notif-titre">🎉 Badge débloqué !</span>
            <span class="notif-nom">${badge.nom}</span>
        </div>
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = "slide-out 0.5s ease forwards";
        setTimeout(() => notif.remove(), 500);
    }, 3000);
}
// Débloquer un badge spécifique (utilisé pendant le quiz)
function deverrouillerBadge(id) {
    const debloques = getBadgesDebloques();
    
    if (debloques.includes(id)) return false;  // Déjà débloqué
    
    const badge = BADGES.find(b => b.id === id);
    if (!badge) return false;
    
    debloques.push(id);
    sauvegarderBadgesDebloques(debloques);
    afficherNotificationBadge(badge);
    
    return true;  // Nouveau badge débloqué
}

// Vérifier les badges qui se débloquent PENDANT la partie
function verifierBadgesEnPartie(questionsRepondues, viesPerdues) {
    const stats = {
        questionsRepondues: questionsRepondues,
        viesPerdues: viesPerdues
    };
    
    // On vérifie seulement les badges "Précis" et "Invincible"
    BADGES.forEach(badge => {
        if (badge.id === "precis" || badge.id === "invincible") {
            if (badge.condition(stats)) {
                deverrouillerBadge(badge.id);
            }
        }
    });
}