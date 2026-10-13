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
        // ============================================
    // COFFRE QUOTIDIEN
    // ============================================
    
    const sectionCoffre = document.getElementById("coffre-quotidien");
    const coffreEmoji = document.getElementById("coffre-emoji");
    const coffreTitre = document.getElementById("coffre-titre");
    const coffreDescription = document.getElementById("coffre-description");
    const coffreStreak = document.getElementById("coffre-streak");
    const btnOuvrirCoffre = document.getElementById("btn-ouvrir-coffre");
    const modaleCoffre = document.getElementById("modale-coffre");
    const coffreAnimation = document.getElementById("coffre-animation");
    const coffreRecompenseTitre = document.getElementById("coffre-recompense-titre");
    const coffreRecompenseContenu = document.getElementById("coffre-recompense-contenu");
    const btnFermerCoffre = document.getElementById("btn-fermer-coffre");

    if (sectionCoffre && token) {
        chargerStatutCoffre();
    }

    async function chargerStatutCoffre() {
        try {
            const reponse = await fetch(`${API_URL}/coffres/statut`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await reponse.json();
            if (!data.success) return;

            sectionCoffre.classList.remove("cache");

            // Afficher le streak
            if (data.streak > 0) {
                coffreStreak.textContent = `🔥 ${data.streak} jour${data.streak > 1 ? "s" : ""} d'affilée`;
            }

            if (data.peut_ouvrir) {
                // Coffre disponible
                coffreEmoji.textContent = data.prochain_jour === 7 ? "🏆" : "🎁";
                coffreTitre.textContent = data.prochain_jour === 7 
                    ? "COFFRE LÉGENDAIRE !" 
                    : `Coffre du jour ${data.prochain_jour} / 7`;
                coffreDescription.textContent = data.prochain_jour === 7
                    ? "Ouvre-le pour une récompense exceptionnelle ! 🎉"
                    : "Ouvre ton coffre du jour !";
                btnOuvrirCoffre.classList.remove("cache");
            } else {
                // Coffre déjà ouvert
                coffreEmoji.textContent = "✅";
                coffreTitre.textContent = "Coffre déjà ouvert aujourd'hui";
                coffreDescription.textContent = "Reviens demain pour un nouveau coffre !";
                btnOuvrirCoffre.classList.add("cache");
            }
        } catch (erreur) {
            console.error("Erreur statut coffre:", erreur);
        }
    }

    if (btnOuvrirCoffre) {
        btnOuvrirCoffre.addEventListener("click", async () => {
            btnOuvrirCoffre.disabled = true;
            btnOuvrirCoffre.textContent = "⏳ Ouverture...";

            try {
                const reponse = await fetch(`${API_URL}/coffres/ouvrir`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await reponse.json();

                if (!data.success) {
                    alert("❌ " + data.error);
                    btnOuvrirCoffre.disabled = false;
                    btnOuvrirCoffre.textContent = "🎁 Ouvrir mon coffre";
                    return;
                }

                // Afficher la modale
                afficherRecompense(data);
                chargerStatutCoffre();

            } catch (erreur) {
                alert("❌ " + erreur.message);
                btnOuvrirCoffre.disabled = false;
                btnOuvrirCoffre.textContent = "🎁 Ouvrir mon coffre";
            }
        });
    }

    function afficherRecompense(data) {
        modaleCoffre.classList.remove("cache");

        // Animation d'ouverture
        coffreAnimation.textContent = "🎁";
        setTimeout(() => {
            coffreAnimation.textContent = data.jour === 7 ? "🏆" : "🎉";
        }, 300);

        // Titre
        if (data.jour === 7) {
            coffreRecompenseTitre.textContent = "🏆 COFFRE LÉGENDAIRE !";
        } else if (data.jour >= 5) {
            coffreRecompenseTitre.textContent = "🌟 Excellent !";
        } else if (data.jour >= 3) {
            coffreRecompenseTitre.textContent = "🎉 Bravo !";
        } else {
            coffreRecompenseTitre.textContent = "👍 Bien joué !";
        }

        // Contenu
        let contenuHTML = `
            <div class="recompense-points">
                <div class="recompense-valeur">+${data.points_gagnes}</div>
                <div class="recompense-label">points</div>
            </div>
        `;

        // Récompense spéciale
        if (data.recompense_type === "message") {
            contenuHTML += `<p class="recompense-speciale">"${data.recompense_valeur}"</p>`;
        } else if (data.recompense_type === "badge") {
            contenuHTML += `<p class="recompense-speciale">🏆 Nouveau badge débloqué !</p>`;
        } else if (data.recompense_type === "mot") {
            try {
                const mot = JSON.parse(data.recompense_valeur);
                contenuHTML += `
                    <div class="recompense-mot">
                        <div class="mot-titre">📖 Mot coup de cœur : ${mot.mot}</div>
                        <div class="mot-definition">${mot.definition}</div>
                    </div>
                `;
            } catch (e) {}
        }

        // Total
        contenuHTML += `<p class="recompense-total">Total : ${data.total_points} points</p>`;

        coffreRecompenseContenu.innerHTML = contenuHTML;
    }

    if (btnFermerCoffre) {
        btnFermerCoffre.addEventListener("click", () => {
            modaleCoffre.classList.add("cache");
            btnOuvrirCoffre.disabled = false;
            btnOuvrirCoffre.textContent = "🎁 Ouvrir mon coffre";
        });
    }
    
});