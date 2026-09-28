document.addEventListener("DOMContentLoaded", function() {
    
    const listeMots = document.getElementById("liste-mots");
    const compteur = document.getElementById("compteur-mots");
    const champRecherche = document.getElementById("recherche");
    const boutonsFiltre = document.querySelectorAll(".btn-filtre");
        const boutonsNiveau = document.querySelectorAll(".btn-niveau");
    const btnFavoris = document.getElementById("btn-favoris");
    const compteurFavoris = document.getElementById("compteur-favoris");
    
    let tousLesMots = [];
    let filtreActif = "tous";
    let filtreNiveauActif = "tous";
       let filtreFavorisActif = false;
    let motsFavoris = [];
    let texteRecherche = "";
    
        // ===== GESTION DES FAVORIS =====
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
    // Charger les données
        // Charger les favoris
    chargerFavoris();
    majCompteurFavoris();
    
           fetch(`${API_URL}/mots`)
        .then(response => response.json())
        .then(reponse => {
            // L'API renvoie { success, count, data }
            tousLesMots = reponse.data;
            console.log(`${tousLesMots.length} mots chargés depuis l'API`);
            afficherMotsFiltres();
        })
        .catch(erreur => console.error("Erreur :", erreur));
    // Recherche
    champRecherche.addEventListener("input", function() {
        texteRecherche = champRecherche.value.toLowerCase();
        afficherMotsFiltres();
    });
    
    // Filtres
    boutonsFiltre.forEach(function(bouton) {
        bouton.addEventListener("click", function() {
            boutonsFiltre.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            filtreActif = bouton.dataset.domaine;
            afficherMotsFiltres();
        });
    });

        // Filtres par niveau
    boutonsNiveau.forEach(function(bouton) {
        bouton.addEventListener("click", function() {
            boutonsNiveau.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            filtreNiveauActif = bouton.dataset.niveau;
            afficherMotsFiltres();
        });
    });
        // Filtre favoris
    btnFavoris.addEventListener("click", function() {
        filtreFavorisActif = !filtreFavorisActif;
        btnFavoris.classList.toggle("actif", filtreFavorisActif);
        btnFavoris.textContent = filtreFavorisActif 
            ? "⭐ Afficher tout" 
            : "☆ Afficher mes favoris";
        afficherMotsFiltres();
    });
    
          function afficherMotsFiltres() {
        const resultats = tousLesMots.filter(function(unMot) {
            const correspondDomaine = 
                filtreActif === "tous" || unMot.domaine === filtreActif;
            
            const correspondNiveau = 
                filtreNiveauActif === "tous" || unMot.niveau === filtreNiveauActif;
            
            const correspondTexte = 
                unMot.mot.toLowerCase().includes(texteRecherche) ||
                unMot.definition.toLowerCase().includes(texteRecherche);
            
            const correspondFavoris = 
                !filtreFavorisActif || estFavori(unMot.mot);
            
            return correspondDomaine && correspondNiveau && 
                   correspondTexte && correspondFavoris;
        });
        
        afficherMots(resultats);
    }

    function afficherMots(mots) {
        listeMots.innerHTML = "";
        
        if (compteur) {
            compteur.textContent = `${mots.length} mot(s) affiché(s)`;
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
                        // Ajouter l'écouteur sur le bouton favori
            const btnFav = carte.querySelector(".btn-favori-carte");
            btnFav.addEventListener("click", function(e) {
                e.stopPropagation();
                toggleFavori(unMot.mot);
                afficherMotsFiltres();
            });
            
            // Ajouter l'écouteur sur le bouton "Réviser"
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