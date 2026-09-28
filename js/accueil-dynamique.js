document.addEventListener("DOMContentLoaded", function() {
    
    // ===== LIRE LES DONNÉES =====
    const partiesJouees = parseInt(localStorage.getItem("partiesJouees")) || 0;
    const meilleurScore = parseInt(localStorage.getItem("meilleurScore")) || 0;
    const favoris = JSON.parse(localStorage.getItem("motsFavoris") || "[]");
    const listeRevision = JSON.parse(localStorage.getItem("motsAReviser") || "[]");
    const badgesDebloques = JSON.parse(localStorage.getItem("badgesDebloques") || "[]");
    
    // ===== SECTION MA PROGRESSION =====
    // Afficher seulement si le joueur a déjà joué
    if (partiesJouees > 0 || badgesDebloques.length > 0 || favoris.length > 0) {
        document.getElementById("ma-progression").classList.remove("cache");
        document.getElementById("accueil-parties").textContent = partiesJouees;
        document.getElementById("accueil-score").textContent = meilleurScore;
        document.getElementById("accueil-badges").textContent = badgesDebloques.length;
        document.getElementById("accueil-favoris").textContent = favoris.length;
    }
    
    // ===== SECTION DERNIERS BADGES =====
    if (badgesDebloques.length > 0 && typeof BADGES !== "undefined") {
        // Prendre les 3 derniers badges
        const derniers = badgesDebloques.slice(-3).reverse();
        
        document.getElementById("derniers-badges").classList.remove("cache");
        const liste = document.getElementById("liste-derniers-badges");
        
        derniers.forEach(id => {
            const badge = BADGES.find(b => b.id === id);
            if (!badge) return;
            
            const carte = document.createElement("div");
            carte.className = "badge-accueil";
            carte.innerHTML = `
                <div class="badge-accueil-icone">${badge.icone}</div>
                <div class="badge-accueil-nom">${badge.nom}</div>
                <div class="badge-accueil-desc">${badge.description}</div>
            `;
            liste.appendChild(carte);
        });
    }
    
    // ===== SECTION CONTINUER OÙ J'EN ÉTAIS =====
    const contenu = document.getElementById("contenu-continuer");
    const cartes = [];
    
    // Carte 1 : Mots en révision
    if (listeRevision.length > 0) {
        cartes.push(`
            <a href="revision.html" class="carte-continuer">
                <div class="continuer-entete">
                    <span class="continuer-icone">📚</span>
                    <span class="continuer-titre">Révision</span>
                </div>
                <div class="continuer-texte">
                    Tu as <strong>${listeRevision.length} mot${listeRevision.length > 1 ? "s" : ""}</strong> 
                    dans ta liste de révision.
                </div>
                <div class="continuer-action">Continuer la révision →</div>
            </a>
        `);
    }
    
    // Carte 2 : Quiz
    if (partiesJouees > 0) {
        cartes.push(`
            <a href="quiz.html" class="carte-continuer">
                <div class="continuer-entete">
                    <span class="continuer-icone">🎮</span>
                    <span class="continuer-titre">Quiz</span>
                </div>
                <div class="continuer-texte">
                    Ton meilleur score : <strong>${meilleurScore} points</strong>.<br>
                    Prêt à battre ton record ?
                </div>
                <div class="continuer-action">Rejouer au quiz →</div>
            </a>
        `);
    }
    
    // Carte 3 : Favoris (si pas de révision en cours)
    if (favoris.length > 0 && listeRevision.length === 0) {
        cartes.push(`
            <a href="dictionnaire.html" class="carte-continuer">
                <div class="continuer-entete">
                    <span class="continuer-icone">⭐</span>
                    <span class="continuer-titre">Mes favoris</span>
                </div>
                <div class="continuer-texte">
                    Tu as <strong>${favoris.length} mot${favoris.length > 1 ? "s" : ""}</strong> 
                    dans tes favoris.
                </div>
                <div class="continuer-action">Voir mes favoris →</div>
            </a>
        `);
    }
    
    // Carte 4 : Message d'encouragement si rien
    if (cartes.length === 0) {
        cartes.push(`
            <a href="quiz.html" class="carte-continuer">
                <div class="continuer-entete">
                    <span class="continuer-icone">🚀</span>
                    <span class="continuer-titre">Commencer</span>
                </div>
                <div class="continuer-texte">
                    Tu n'as pas encore commencé. Lance-toi dans le quiz pour tester tes connaissances !
                </div>
                <div class="continuer-action">Démarrer le quiz →</div>
            </a>
        `);
    }
    
    contenu.innerHTML = cartes.join("");
    document.getElementById("continuer").classList.remove("cache");
    

});