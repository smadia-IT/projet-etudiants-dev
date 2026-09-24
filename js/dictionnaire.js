document.addEventListener("DOMContentLoaded", function() {
    
    const listeMots = document.getElementById("liste-mots");
    const compteur = document.getElementById("compteur-mots");
    const champRecherche = document.getElementById("recherche");
    const boutonsFiltre = document.querySelectorAll(".btn-filtre");
    
    let tousLesMots = [];
    let filtreActif = "tous";
    let filtreNiveauActif = "tous";
    const boutonsNiveau = document.querySelectorAll(".btn-niveau");
    let texteRecherche = "";
    
    // Charger les données
    fetch("data/dictionnaire.json")
        .then(response => response.json())
            .then(donnees => {
            // Trier par ordre alphabétique
            tousLesMots = donnees.sort((a, b) => 
                a.mot.localeCompare(b.mot)
            );
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
    
       function afficherMotsFiltres() {
        const resultats = tousLesMots.filter(function(unMot) {
            const correspondDomaine = 
                filtreActif === "tous" || unMot.domaine === filtreActif;
            
            const correspondNiveau = 
                filtreNiveauActif === "tous" || unMot.niveau === filtreNiveauActif;
            
            const correspondTexte = 
                unMot.mot.toLowerCase().includes(texteRecherche) ||
                unMot.definition.toLowerCase().includes(texteRecherche);
            
            return correspondDomaine && correspondNiveau && correspondTexte;
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
                        carte.innerHTML = `
                <h3>${unMot.mot}</h3>
                <p>${unMot.definition}</p>
                <div class="carte-footer">
                    <span class="domaine">${unMot.domaine}</span>
                    <span class="niveau niveau-${(unMot.niveau || 'Débutant').toLowerCase()}">${unMot.niveau || 'Débutant'}</span>
                </div>
            `;
            listeMots.appendChild(carte);
        });
    }
    
});