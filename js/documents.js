document.addEventListener("DOMContentLoaded", function() {
    
    const listeDocuments = document.getElementById("liste-documents");
    const boutonsFiltre = document.querySelectorAll(".btn-filtre-doc");
    
    let tousLesDocuments = [];
    let filtreActif = "tous";
    
    // Charger les documents
    fetch("data/documents.json")
        .then(response => response.json())
        .then(docs => {
            tousLesDocuments = docs;
            afficherDocuments();
        })
        .catch(erreur => console.error("Erreur :", erreur));
    
    // Filtres
    boutonsFiltre.forEach(function(bouton) {
        bouton.addEventListener("click", function() {
            boutonsFiltre.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            filtreActif = bouton.dataset.domaine;
            afficherDocuments();
        });
    });
    
    function afficherDocuments() {
        const resultats = tousLesDocuments.filter(function(doc) {
            return filtreActif === "tous" || doc.domaine === filtreActif;
        });
        
        listeDocuments.innerHTML = "";
        
        if (resultats.length === 0) {
            listeDocuments.innerHTML = "<p>Aucun document disponible 😕</p>";
            return;
        }
        
        resultats.forEach(function(doc) {
            const carte = document.createElement("div");
            carte.className = "carte-doc";
            carte.innerHTML = `
                <h3>📄 ${doc.titre}</h3>
                <p>${doc.description}</p>
                <div class="info-doc">
                    <span>${doc.domaine}</span>
                    <span>${doc.taille}</span>
                </div>
                <a href="${doc.fichier}" download class="btn-telecharger">
                    ⬇️ Télécharger
                </a>
            `;
            listeDocuments.appendChild(carte);
        });
    }
    
});