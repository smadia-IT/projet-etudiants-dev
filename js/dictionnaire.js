// ============================================
// PAGE DICTIONNAIRE - VERSION PROPRE
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    
    // ===== RÉFÉRENCES DOM =====
    const listeMots = document.getElementById("liste-mots");
    const compteur = document.getElementById("compteur-mots");
    const champRecherche = document.getElementById("recherche");
    const boutonsNiveau = document.querySelectorAll(".btn-niveau");
    const btnFavoris = document.getElementById("btn-favoris");
    const compteurFavoris = document.getElementById("compteur-favoris");
    const menuFiltres = document.getElementById("menu-filtres");
    const btnPrincipal = document.getElementById("btn-filtre-principal");
    const labelActuel = document.getElementById("filtre-actuel-label");
    
    // ===== ÉTAT =====
    let tousLesMots = [];
    let filtreActif = "tous";
    let filtreNiveauActif = "tous";
    let filtreFavorisActif = false;
    let motsFavoris = [];
    let texteRecherche = "";
    
    // ============================================
    // GESTION DES FAVORIS
    // ============================================
    function chargerFavoris() {
        const stockes = localStorage.getItem("motsFavoris");
        motsFavoris = stockes ? JSON.parse(stockes) : [];
    }
    
    function sauvegarderFavoris() {
        localStorage.setItem("motsFavoris", JSON.stringify(motsFavoris));
    }
    
    function estFavori(mot) {
        return motsFavoris.includes(mot);
    }
    
    function toggleFavori(mot) {
        if (estFavori(mot)) {
            motsFavoris = motsFavoris.filter(m => m !== mot);
        } else {
            motsFavoris.push(mot);
        }
        sauvegarderFavoris();
        majCompteurFavoris();
    }
    
    function majCompteurFavoris() {
        const nb = motsFavoris.length;
        compteurFavoris.textContent = `${nb} favori${nb > 1 ? "s" : ""}`;
    }
    
    // ============================================
    // CHARGEMENT DES DONNÉES
    // ============================================
    chargerFavoris();
    majCompteurFavoris();
    
       fetch("data/dictionnaire.json")
        .then(response => response.json())
        .then(mots => {
            tousLesMots = mots;
            console.log(`${tousLesMots.length} mots chargés depuis le JSON`);
            
            genererFiltresDomaines();
            afficherMotsFiltres();
        })
        .catch(erreur => console.error("Erreur chargement dictionnaire :", erreur));
    
    // ============================================
    // RECHERCHE
    // ============================================
    champRecherche.addEventListener("input", function() {
        texteRecherche = champRecherche.value.toLowerCase();
        afficherMotsFiltres();
    });
    
    // ============================================
    // FILTRES PAR NIVEAU
    // ============================================
    boutonsNiveau.forEach(function(bouton) {
        bouton.addEventListener("click", function() {
            boutonsNiveau.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            filtreNiveauActif = bouton.dataset.niveau;
            afficherMotsFiltres();
        });
    });
    
    // ============================================
    // FILTRE FAVORIS
    // ============================================
    btnFavoris.addEventListener("click", function() {
        filtreFavorisActif = !filtreFavorisActif;
        btnFavoris.classList.toggle("actif", filtreFavorisActif);
        btnFavoris.textContent = filtreFavorisActif 
            ? "⭐ Afficher tout" 
            : "☆ Afficher mes favoris";
        afficherMotsFiltres();
    });
    
    // ============================================
    // GÉNÉRATION DES FILTRES DE DOMAINE (MENU DÉROULANT)
    // ============================================
    function genererFiltresDomaines() {
        if (!menuFiltres || !btnPrincipal || !labelActuel) return;
        
        menuFiltres.innerHTML = "";
        
        // Compter les mots par domaine
        const compteurDomaines = {};
        tousLesMots.forEach(function(mot) {
            compteurDomaines[mot.domaine] = (compteurDomaines[mot.domaine] || 0) + 1;
        });
        
        // Bouton "Tous"
        const itemTous = creerItemDomaine("tous", "Tous les domaines", tousLesMots.length);
        menuFiltres.appendChild(itemTous);
        
        // Séparateur
        const sep = document.createElement("div");
        sep.className = "separateur-menu";
        menuFiltres.appendChild(sep);
        
        // Récupérer tous les domaines uniques triés
        const domainesUniques = [...new Set(tousLesMots.map(m => m.domaine))];
        domainesUniques.sort((a, b) => a.localeCompare(b));
        
        // Créer un item par domaine
        domainesUniques.forEach(function(domaine) {
            const item = creerItemDomaine(domaine, domaine, compteurDomaines[domaine]);
            menuFiltres.appendChild(item);
        });
        
        console.log(`${domainesUniques.length} domaines trouvés`);
    }
    
    // Créer un item de domaine
    function creerItemDomaine(valeur, label, compteur) {
        const item = document.createElement("button");
        item.className = "item-domaine";
        item.dataset.domaine = valeur;
        
        if (valeur === filtreActif) item.classList.add("actif");
        
        item.innerHTML = `
            <span>${escapeHtml(label)}</span>
            <span class="compteur-domaine">${compteur}</span>
        `;
        
        item.addEventListener("click", function(e) {
            e.stopPropagation();
            
            filtreActif = valeur;
            
            // Mettre à jour le label du bouton principal
            labelActuel.textContent = valeur === "tous" ? "(Tous)" : `(${label})`;
            
            // Mettre à jour les classes actives
            menuFiltres.querySelectorAll(".item-domaine").forEach(function(i) {
                i.classList.remove("actif");
            });
            item.classList.add("actif");
            
            // Fermer le menu
            menuFiltres.classList.add("cache");
            
            // Rafraîchir l'affichage
            afficherMotsFiltres();
        });
        
        return item;
    }
    
    // ============================================
    // OUVERTURE / FERMETURE DU MENU
    // ============================================
    if (btnPrincipal && menuFiltres) {
        btnPrincipal.addEventListener("click", function(e) {
            e.stopPropagation();
            menuFiltres.classList.toggle("cache");
        });
        
        // Fermer le menu en cliquant ailleurs
        document.addEventListener("click", function() {
            menuFiltres.classList.add("cache");
        });
        
        // Empêcher la fermeture quand on clique DANS le menu
        menuFiltres.addEventListener("click", function(e) {
            e.stopPropagation();
        });
    }
    
    // ============================================
    // FILTRAGE ET AFFICHAGE
    // ============================================
   function afficherMotsFiltres() {
    const resultats = tousLesMots.filter(function(unMot) {
        // ... (ne touche pas à ce bloc)
    });
    
    // ✅ AJOUT : tri alphabétique (insensible à la casse et aux accents)
    resultats.sort(function(a, b) {
        return a.mot.localeCompare(b.mot, "fr", { sensitivity: "base" });
    });
    
    afficherMots(resultats);
}
    
    function afficherMots(mots) {
        listeMots.innerHTML = "";
        
           if (compteur) {
        compteur.classList.add("cache");
    }
        
        if (mots.length === 0) {
            listeMots.innerHTML = "<p>Aucun mot trouvé 😕</p>";
            return;
        }
        
        mots.forEach(function(unMot) {
            const carte = document.createElement("div");
            carte.className = "carte-mot";
            
            const favori = estFavori(unMot.mot);
            const dansRevision = estDansListeRevision(unMot.mot);
            
            carte.innerHTML = `
                <div class="carte-entete">
                    <h3>${unMot.mot}</h3>
                    <button class="btn-favori-carte ${favori ? 'est-favori' : ''}" 
                            title="${favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                        ${favori ? '⭐' : '☆'}
                    </button>
                </div>
                <p>${unMot.definition}</p>
                <div class="carte-footer">
                    <span class="domaine">${unMot.domaine}</span>
                    <span class="niveau niveau-${(unMot.niveau || 'Débutant').toLowerCase()}">${unMot.niveau || 'Débutant'}</span>
                </div>
                <button class="btn-reviser ${dansRevision ? 'est-dans-liste' : ''}">
                    📖 ${dansRevision ? 'Dans ma révision' : 'Réviser ce mot'}
                </button>
            `;
            
            // Écouteur sur le bouton favori
            const btnFav = carte.querySelector(".btn-favori-carte");
            btnFav.addEventListener("click", function(e) {
                e.stopPropagation();
                toggleFavori(unMot.mot);
                afficherMotsFiltres();
            });
            
            // Écouteur sur le bouton "Réviser"
            const btnReviser = carte.querySelector(".btn-reviser");
            btnReviser.addEventListener("click", function(e) {
                e.stopPropagation();
                if (estDansListeRevision(unMot.mot)) {
                    retirerMotRevision(unMot.mot);
                } else {
                    ajouterMotRevision(unMot.mot);
                }
                afficherMotsFiltres();
            });
            
            listeMots.appendChild(carte);
        });
    }
    
});

// ============================================
// UTILITAIRE : ÉCHAPPER LE HTML
// ============================================
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}