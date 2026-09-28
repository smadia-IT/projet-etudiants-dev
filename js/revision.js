document.addEventListener("DOMContentLoaded", function() {
    
    // ===== RÉFÉRENCES DOM =====
    const ecranVide = document.getElementById("ecran-vide");
    const ecranAccueil = document.getElementById("ecran-accueil");
    const ecranRevision = document.getElementById("ecran-revision");
    const ecranFinRevision = document.getElementById("ecran-fin-revision");
    
    const btnCommencer = document.getElementById("btn-commencer-revision");
    const btnToutEffacer = document.getElementById("btn-tout-effacer");
    const btnSuivant = document.getElementById("btn-suivant-revision");
    const btnRecommencer = document.getElementById("btn-recommencer-revision");
    
    const statsRevision = document.getElementById("stats-revision");
    const compteurRevision = document.getElementById("compteur-revision");
    const progressionRevision = document.getElementById("progression-revision");
    const texteRevision = document.getElementById("texte-revision");
    const optionsRevision = document.getElementById("options-revision");
    const feedbackRevision = document.getElementById("feedback-revision");
    const resumeRevision = document.getElementById("resume-revision");
    
    // ===== ÉTAT =====
    let tousLesMots = [];
    let motsAReviser = [];
    let questionActuelle = 0;
    let repondu = false;
    let bonsReponses = 0;
    
    // ===== CHARGEMENT DES DONNÉES =====
    fetch("data/dictionnaire.json")
        .then(response => response.json())
        .then(donnees => {
            tousLesMots = donnees;
            initialiser();
        })
        .catch(erreur => console.error("Erreur :", erreur));
    
    function initialiser() {
        const liste = getListeRevision();
        
        if (liste.length === 0) {
            ecranVide.classList.remove("cache");
            return;
        }
        
        ecranAccueil.classList.remove("cache");
        majStatsAccueil();
    }
    
    function majStatsAccueil() {
        const liste = getListeRevision();
        const maitrises = compterMaitrises();
        statsRevision.innerHTML = `
            Tu as <strong>${liste.length} mot${liste.length > 1 ? "s" : ""}</strong> dans ta liste de révision.<br>
            <span style="font-size: 14px;">Mots maîtrisés : ${maitrises} / ${liste.length}</span>
        `;
    }
    
    // ===== BOUTONS =====
    btnCommencer.addEventListener("click", demarrerRevision);
    btnSuivant.addEventListener("click", motSuivant);
    btnRecommencer.addEventListener("click", demarrerRevision);
    
    btnToutEffacer.addEventListener("click", function() {
        if (confirm("Vider toute ta liste de révision ?")) {
            viderListeRevision();
            location.reload();
        }
    });
    
    // ===== RÉVISION =====
    function demarrerRevision() {
        const liste = getListeRevision();
        if (liste.length === 0) {
            location.reload();
            return;
        }
        
        // Construire la liste des mots à réviser (avec leurs infos complètes)
        motsAReviser = liste.map(item => {
            const motComplet = tousLesMots.find(m => m.mot === item.mot);
            return {
                ...motComplet,
                maitrise: item.maitrise
            };
        }).filter(m => m.mot); // Sécurité : ignorer les mots qui n'existent plus
        
        // Trier : les moins maîtrisés d'abord
        motsAReviser.sort((a, b) => a.maitrise - b.maitrise);
        
        questionActuelle = 0;
        bonsReponses = 0;
        
        ecranAccueil.classList.add("cache");
        ecranFinRevision.classList.add("cache");
        ecranRevision.classList.remove("cache");
        
        afficherQuestionRevision();
    }
    
    function afficherQuestionRevision() {
        const mot = motsAReviser[questionActuelle];
        repondu = false;
        
        compteurRevision.textContent = `Mot ${questionActuelle + 1} / ${motsAReviser.length}`;
        progressionRevision.textContent = `${compterMaitrises()} / ${motsAReviser.length} maîtrisés`;
        
        // Générer 3 mauvaises définitions
        const autresMots = tousLesMots.filter(m => m.mot !== mot.mot);
        const mauvaises = [...autresMots]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(m => m.definition);
        
        const options = [mot.definition, ...mauvaises]
            .sort(() => Math.random() - 0.5);
        
        texteRevision.innerText = `Que signifie "${mot.mot}" ?`;
        
        optionsRevision.innerHTML = "";
        options.forEach(option => {
            const btn = document.createElement("button");
            btn.className = "option";
            btn.textContent = option;
            btn.addEventListener("click", () => verifierReponseRevision(btn, option, mot));
            optionsRevision.appendChild(btn);
        });
        
        optionsRevision.className = "options-reponse type-definition";
        
        feedbackRevision.classList.add("cache");
        btnSuivant.classList.add("cache");
    }
    
    function verifierReponseRevision(btnClique, optionChoisie, mot) {
        if (repondu) return;
        repondu = true;
        
        const estBonne = optionChoisie === mot.definition;
        
        // Désactiver et colorer
        const toutesLesOptions = optionsRevision.querySelectorAll(".option");
        toutesLesOptions.forEach(opt => {
            opt.disabled = true;
            if (opt.textContent === mot.definition) {
                opt.classList.add("bonne");
            }
        });
        
        if (!estBonne) {
            btnClique.classList.add("mauvaise");
        }
        
        // Mettre à jour la maîtrise
        mettreAJourMaitrise(mot.mot, estBonne);
        
        if (estBonne) bonsReponses++;
        
        // Feedback
        feedbackRevision.classList.remove("cache", "succes", "erreur");
        if (estBonne) {
            feedbackRevision.classList.add("succes");
            feedbackRevision.innerHTML = `✅ Bonne réponse !`;
        } else {
            feedbackRevision.classList.add("erreur");
            feedbackRevision.innerHTML = `❌ Mauvaise réponse.<br>La bonne définition était : <strong>${mot.definition}</strong>`;
        }
        
        progressionRevision.textContent = `${compterMaitrises()} / ${motsAReviser.length} maîtrisés`;
        
        btnSuivant.classList.remove("cache");
        if (questionActuelle === motsAReviser.length - 1) {
            btnSuivant.textContent = "Voir le résultat →";
        } else {
            btnSuivant.textContent = "Mot suivant →";
        }
    }
    
    function motSuivant() {
        questionActuelle++;
        
        if (questionActuelle >= motsAReviser.length) {
            afficherFinRevision();
        } else {
            afficherQuestionRevision();
        }
    }
    
    function afficherFinRevision() {
        ecranRevision.classList.add("cache");
        ecranFinRevision.classList.remove("cache");
        
        const maitrises = compterMaitrises();
        const total = motsAReviser.length;
        const pourcentage = Math.round((maitrises / total) * 100);
        
        resumeRevision.innerHTML = `
            Tu as révisé <strong>${total} mot${total > 1 ? "s" : ""}</strong>.<br>
            Bonnes réponses : <strong>${bonsReponses} / ${total}</strong><br>
            Mots maîtrisés : <strong>${maitrises} / ${total}</strong> (${pourcentage}%)
        `;
    }
    
});