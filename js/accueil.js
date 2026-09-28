document.addEventListener("DOMContentLoaded", function() {
    
    const contenuMotJour = document.getElementById("contenu-mot-jour");
    
    fetch("data/dictionnaire.json")
        .then(response => response.json())
        .then(donnees => {
            afficherMotDuJour(donnees);
        })
        .catch(erreur => console.error("Erreur :", erreur));
    
    function afficherMotDuJour(mots) {
        const aujourdhui = new Date();
        const debutAnnee = new Date(aujourdhui.getFullYear(), 0, 0);
        const difference = aujourdhui - debutAnnee;
        const unJourEnMs = 1000 * 60 * 60 * 24;
        const numeroJour = Math.floor(difference / unJourEnMs);
        
        const index = numeroJour % mots.length;
        const motDuJour = mots[index];
        
        contenuMotJour.innerHTML = `
            <div class="carte-jour">
                <h3>${motDuJour.mot}</h3>
                <p>${motDuJour.definition}</p>
                <span class="domaine">${motDuJour.domaine}</span>
            </div>
        `;
    }
    
});