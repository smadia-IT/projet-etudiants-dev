document.addEventListener("DOMContentLoaded", function() {
    
    // ===== RÉFÉRENCES DOM =====
    const listeDocuments = document.getElementById("liste-documents");
    const compteurDoc = document.getElementById("compteur-doc");
    const champRecherche = document.getElementById("recherche-doc");
    const btnFiltresType = document.querySelectorAll(".btn-filtre-type");
    const btnFiltresDoc = document.querySelectorAll(".btn-filtre-doc");
    const selectTri = document.getElementById("tri-doc");
    const sectionTelechargements = document.getElementById("mes-telechargements");
    const listeTelechargements = document.getElementById("liste-telechargements");
    
    // ===== ÉTAT =====
    let tousLesDocuments = [];
    let filtreDomaineActif = "tous";
    let filtreTypeActif = "tous";
    let texteRecherche = "";
    let triActif = "nom";
    
    // ===== CHARGEMENT =====
    fetch("data/documents.json")
        .then(response => response.json())
        .then(docs => {
            tousLesDocuments = docs;
            afficherDocuments();
            afficherTelechargements();
        })
        .catch(erreur => console.error("Erreur :", erreur));
    
    // ===== ÉCOUTEURS =====
    champRecherche.addEventListener("input", function() {
        texteRecherche = champRecherche.value.toLowerCase();
        afficherDocuments();
    });
    
    btnFiltresType.forEach(function(bouton) {
        bouton.addEventListener("click", function() {
            btnFiltresType.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            filtreTypeActif = bouton.dataset.type;
            afficherDocuments();
        });
    });
    
    btnFiltresDoc.forEach(function(bouton) {
        bouton.addEventListener("click", function() {
            btnFiltresDoc.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            filtreDomaineActif = bouton.dataset.domaine;
            afficherDocuments();
        });
    });
    
    selectTri.addEventListener("change", function() {
        triActif = selectTri.value;
        afficherDocuments();
    });
    
    // ===== GESTION DES TÉLÉCHARGEMENTS =====
    function chargerTelechargements() {
        const stockes = localStorage.getItem("telechargements");
        return stockes ? JSON.parse(stockes) : [];
    }
    
    function ajouterTelechargement(titre) {
        const telechargements = chargerTelechargements();
        // Retirer si déjà présent
        const filtre = telechargements.filter(t => t.titre !== titre);
        // Ajouter en premier
        filtre.unshift({ titre: titre, date: new Date().toISOString() });
        // Garder seulement les 5 derniers
        const limite = filtre.slice(0, 5);
        localStorage.setItem("telechargements", JSON.stringify(limite));
        afficherTelechargements();
    }
    
    function afficherTelechargements() {
        const telechargements = chargerTelechargements();
        
        if (telechargements.length === 0) {
            sectionTelechargements.classList.add("cache");
            return;
        }
        
        sectionTelechargements.classList.remove("cache");
        listeTelechargements.innerHTML = "";
        
        telechargements.forEach(t => {
            const date = new Date(t.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
            
            const item = document.createElement("div");
            item.className = "telechargement-item";
            item.innerHTML = `
                <span class="telechargement-nom">📄 ${t.titre}</span>
                <span class="telechargement-date">${date}</span>
            `;
            listeTelechargements.appendChild(item);
        });
    }
    
    // ===== AFFICHAGE DES DOCUMENTS =====
    function afficherDocuments() {
        // Filtrer
        let resultats = tousLesDocuments.filter(function(doc) {
            const correspondDomaine = 
                filtreDomaineActif === "tous" || doc.domaine === filtreDomaineActif;
            
            const correspondType = 
                filtreTypeActif === "tous" || doc.type === filtreTypeActif;
            
            const correspondTexte = 
                doc.titre.toLowerCase().includes(texteRecherche) ||
                doc.description.toLowerCase().includes(texteRecherche);
            
            return correspondDomaine && correspondType && correspondTexte;
        });
        
        // Trier
        resultats.sort(function(a, b) {
            if (triActif === "nom") {
                return a.titre.localeCompare(b.titre);
            }
            if (triActif === "popularite") {
                const popA = getNbTelechargements(a.titre);
                const popB = getNbTelechargements(b.titre);
                return popB - popA;
            }
            if (triActif === "date") {
                return new Date(b.date) - new Date(a.date);
            }
            return 0;
        });
        
        // Mettre à jour le compteur
        compteurDoc.textContent = `${resultats.length} document(s) affiché(s)`;
        
        // Vider
        listeDocuments.innerHTML = "";
        
        if (resultats.length === 0) {
            listeDocuments.innerHTML = "<p class='etat-vide'>Aucun document trouvé 😕</p>";
            return;
        }
        
        // Afficher chaque document
        resultats.forEach(function(doc) {
            const carte = document.createElement("div");
            carte.className = "carte-doc";
            
            const typeClass = doc.type.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");  // Enlever les accents
            
            carte.innerHTML = `
                <div class="carte-doc-entete">
                    <span class="type-badge ${typeClass}">${doc.type}</span>
                </div>
                <h3>📄 ${doc.titre}</h3>
                <p>${doc.description}</p>
                <div class="info-doc">
                    <span>${doc.domaine}</span>
                    <span>${doc.taille}</span>
                </div>
                <div class="info-doc">
                    <span class="nb-telechargements">📥 ${getNbTelechargements(doc.titre)} téléchargement(s)</span>
                </div>
                <a href="${doc.fichier}" download class="btn-telecharger" data-titre="${doc.titre}">
                    ⬇️ Télécharger
                </a>
            `;
            
            // Écouter le clic sur "Télécharger"
            const btn = carte.querySelector(".btn-telecharger");
            btn.addEventListener("click", function() {
                ajouterTelechargement(doc.titre);
                incrementerCompteur(doc.titre);
                setTimeout(() => afficherDocuments(), 100);
            });
            
            listeDocuments.appendChild(carte);
        });
    }
    
    // ===== COMPTEUR DE TÉLÉCHARGEMENTS =====
    function getNbTelechargements(titre) {
        const stockes = localStorage.getItem("compteursTelechargements");
        const compteurs = stockes ? JSON.parse(stockes) : {};
        return compteurs[titre] || 0;
    }
    
    function incrementerCompteur(titre) {
        const stockes = localStorage.getItem("compteursTelechargements");
        const compteurs = stockes ? JSON.parse(stockes) : {};
        compteurs[titre] = (compteurs[titre] || 0) + 1;
        localStorage.setItem("compteursTelechargements", JSON.stringify(compteurs));
    }
    
});