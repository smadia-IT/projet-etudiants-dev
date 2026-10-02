// ============================================
// PAGE RÉVISION — VERSION AMÉLIORÉE
// ============================================
// 2 modes : Apprentissage (découverte) + Quiz (test)
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    
    // ===== RÉFÉRENCES DOM =====
    const ecranVide = document.getElementById("ecran-vide");
    const ecranAccueil = document.getElementById("ecran-accueil");
    const ecranApprentissage = document.getElementById("ecran-apprentissage");
    const ecranRevision = document.getElementById("ecran-revision");
    const ecranFinRevision = document.getElementById("ecran-fin-revision");
    
    // Accueil
    const btnModeApprentissage = document.getElementById("btn-mode-apprentissage");
    const btnModeQuiz = document.getElementById("btn-mode-quiz");
    const btnToutEffacer = document.getElementById("btn-tout-effacer");
    const statsRevision = document.getElementById("stats-revision");
    
    // Apprentissage
    const compteurApprentissage = document.getElementById("compteur-apprentissage");
    const apprentissageMotTitre = document.getElementById("apprentissage-mot-titre");
    const apprentissageDomaine = document.getElementById("apprentissage-domaine");
    const apprentissageNiveau = document.getElementById("apprentissage-niveau");
    const apprentissageDefinition = document.getElementById("apprentissage-definition");
    const apprentissageExplication = document.getElementById("apprentissage-explication");
    const apprentissageExemple = document.getElementById("apprentissage-exemple");
    const btnPrecedentApprentissage = document.getElementById("btn-precedent-apprentissage");
    const btnSuivantApprentissage = document.getElementById("btn-suivant-apprentissage");
    const btnQuitterApprentissage = document.getElementById("btn-quitter-apprentissage");
    
    // Quiz
    const compteurRevision = document.getElementById("compteur-revision");
    const progressionRevision = document.getElementById("progression-revision");
    const texteRevision = document.getElementById("texte-revision");
    const optionsRevision = document.getElementById("options-revision");
    const feedbackRevision = document.getElementById("feedback-revision");
    const btnSuivant = document.getElementById("btn-suivant-revision");
    
    // Fin
    const finEmoji = document.getElementById("fin-emoji");
    const finTitre = document.getElementById("fin-titre");
    const resumeRevision = document.getElementById("resume-revision");
    const btnRecommencer = document.getElementById("btn-recommencer-revision");
    
    // ===== ÉTAT =====
    let tousLesMots = [];
    let motsAReviser = [];          // Les mots de la liste de révision
    let motsAleatoires = [];         // Mots mélangés pour le quiz
    let indexApprentissage = 0;      // Position actuelle en mode Apprentissage
    let questionActuelle = 0;        // Position actuelle dans le quiz
    let repondu = false;             // Pour éviter les double-clics
    let bonsReponses = 0;            // Score du quiz
    
    // ============================================
    // CHARGEMENT DES DONNÉES
    // ============================================
    fetch("data/dictionnaire.json")
        .then(response => response.json())
        .then(donnees => {
            tousLesMots = donnees;
            console.log(`${tousLesMots.length} mots chargés pour la révision`);
            initialiser();
        })
        .catch(erreur => console.error("Erreur chargement dictionnaire :", erreur));
    
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
    
    // ============================================
    // NAVIGATION ENTRE ÉCRANS
    // ============================================
    function afficherEcran(ecran) {
        [ecranVide, ecranAccueil, ecranApprentissage, ecranRevision, ecranFinRevision].forEach(e => {
            e.classList.add("cache");
        });
        ecran.classList.remove("cache");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    
    // ============================================
    // BOUTONS ACCUEIL
    // ============================================
    btnModeApprentissage.addEventListener("click", demarrerApprentissage);
    btnModeQuiz.addEventListener("click", demarrerQuiz);
    
    btnToutEffacer.addEventListener("click", function() {
        if (confirm("Vider toute ta liste de révision ?")) {
            viderListeRevision();
            location.reload();
        }
    });
    
    // ============================================
    // MODE APPRENTISSAGE
    // ============================================
    function demarrerApprentissage() {
        const liste = getListeRevision();
        if (liste.length === 0) {
            location.reload();
            return;
        }
        
        // Construire la liste complète des mots à réviser
        motsAReviser = liste.map(item => {
            const motComplet = tousLesMots.find(m => m.mot === item.mot);
            return { ...motComplet, maitrise: item.maitrise };
        }).filter(m => m.mot);
        
        // Trier : les moins maîtrisés d'abord
        motsAReviser.sort((a, b) => a.maitrise - b.maitrise);
        
        indexApprentissage = 0;
        afficherEcran(ecranApprentissage);
        afficherMotApprentissage();
    }
    
    function afficherMotApprentissage() {
        const mot = motsAReviser[indexApprentissage];
        if (!mot) return;
        
        compteurApprentissage.textContent = `Mot ${indexApprentissage + 1} / ${motsAReviser.length}`;
        apprentissageMotTitre.textContent = mot.mot;
        apprentissageDomaine.textContent = mot.domaine || "—";
        apprentissageNiveau.textContent = mot.niveau || "Débutant";
        apprentissageNiveau.className = `niveau niveau-${(mot.niveau || "débutant").toLowerCase()}`;
        apprentissageDefinition.textContent = mot.definition || "—";
        apprentissageExplication.textContent = mot.explication || "Pas encore d'explication pour ce mot.";
        apprentissageExemple.textContent = mot.exemple || "Pas encore d'exemple pour ce mot.";
        
        // Désactiver Précédent si on est au début
        btnPrecedentApprentissage.disabled = (indexApprentissage === 0);
        
        // Adapter le bouton Suivant
        if (indexApprentissage === motsAReviser.length - 1) {
            btnSuivantApprentissage.textContent = "🎯 Passer au Quiz";
            btnSuivantApprentissage.classList.add("btn-primaire");
        } else {
            btnSuivantApprentissage.textContent = "Suivant →";
        }
    }
    
    btnPrecedentApprentissage.addEventListener("click", function() {
        if (indexApprentissage > 0) {
            indexApprentissage--;
            afficherMotApprentissage();
        }
    });
    
    btnSuivantApprentissage.addEventListener("click", function() {
        if (indexApprentissage < motsAReviser.length - 1) {
            indexApprentissage++;
            afficherMotApprentissage();
        } else {
            // Fin de l'apprentissage → on lance le Quiz
            demarrerQuiz();
        }
    });
    
    btnQuitterApprentissage.addEventListener("click", function() {
        if (confirm("Quitter l'apprentissage ? Ta progression est sauvegardée.")) {
            afficherEcran(ecranAccueil);
        }
    });
    
    // ============================================
    // MODE QUIZ
    // ============================================
    function demarrerQuiz() {
        const liste = getListeRevision();
        if (liste.length === 0) {
            location.reload();
            return;
        }
        
        // Reconstruire la liste des mots (au cas où on vient de l'apprentissage)
        if (motsAReviser.length === 0) {
            motsAReviser = liste.map(item => {
                const motComplet = tousLesMots.find(m => m.mot === item.mot);
                return { ...motComplet, maitrise: item.maitrise };
            }).filter(m => m.mot);
        }
        
        // Mélanger les mots pour le quiz
        motsAleatoires = [...motsAReviser].sort(() => Math.random() - 0.5);
        
        questionActuelle = 0;
        bonsReponses = 0;
        
        afficherEcran(ecranRevision);
        afficherQuestionRevision();
    }
    
    function afficherQuestionRevision() {
        const mot = motsAleatoires[questionActuelle];
        repondu = false;
        
        compteurRevision.textContent = `Mot ${questionActuelle + 1} / ${motsAleatoires.length}`;
        progressionRevision.textContent = `${compterMaitrises()} / ${motsAleatoires.length} maîtrisés`;
        
        // Générer 3 mauvaises définitions (dans le dictionnaire complet)
        const autresMots = tousLesMots.filter(m => m.mot !== mot.mot);
        const mauvaises = [...autresMots]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(m => m.definition);
        
        // Mélanger les 4 options
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
        
        // Désactiver toutes les options + colorer la bonne
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
        
        // Mettre à jour la maîtrise dans le localStorage
        mettreAJourMaitrise(mot.mot, estBonne);
        
        if (estBonne) bonsReponses++;
        
        // Feedback enrichi
        feedbackRevision.classList.remove("cache", "succes", "erreur");
        
        if (estBonne) {
            feedbackRevision.classList.add("succes");
            feedbackRevision.innerHTML = `
                <div class="feedback-titre">✅ Bonne réponse !</div>
                <div class="feedback-detail">
                    <strong>💡 ${mot.explication || ""}</strong>
                    ${mot.exemple ? `<div class="feedback-exemple">🎯 ${mot.exemple}</div>` : ""}
                </div>
            `;
        } else {
            feedbackRevision.classList.add("erreur");
            feedbackRevision.innerHTML = `
                <div class="feedback-titre">❌ Mauvaise réponse</div>
                <div class="feedback-detail">
                    <div>La bonne réponse était : <strong>${mot.definition}</strong></div>
                    ${mot.explication ? `<div class="feedback-explication">💡 ${mot.explication}</div>` : ""}
                    ${mot.exemple ? `<div class="feedback-exemple">🎯 ${mot.exemple}</div>` : ""}
                </div>
            `;
        }
        
        progressionRevision.textContent = `${compterMaitrises()} / ${motsAleatoires.length} maîtrisés`;
        
        btnSuivant.classList.remove("cache");
        if (questionActuelle === motsAleatoires.length - 1) {
            btnSuivant.textContent = "Voir le résultat →";
        } else {
            btnSuivant.textContent = "Mot suivant →";
        }
    }
    
    btnSuivant.addEventListener("click", function() {
        questionActuelle++;
        
        if (questionActuelle >= motsAleatoires.length) {
            afficherFinRevision();
        } else {
            afficherQuestionRevision();
        }
    });
    
    // ============================================
    // ÉCRAN DE FIN
    // ============================================
    function afficherFinRevision() {
        afficherEcran(ecranFinRevision);
        
        const total = motsAleatoires.length;
        const pourcentage = Math.round((bonsReponses / total) * 100);
        
        // Emoji + titre selon le score
        if (pourcentage >= 80) {
            finEmoji.textContent = "🏆";
            finTitre.textContent = "Excellent !";
        } else if (pourcentage >= 50) {
            finEmoji.textContent = "👍";
            finTitre.textContent = "Bien joué !";
        } else {
            finEmoji.textContent = "💪";
            finTitre.textContent = "Continue tes efforts !";
        }
        
        resumeRevision.innerHTML = `
            Tu as révisé <strong>${total} mot${total > 1 ? "s" : ""}</strong>.<br>
            Bonnes réponses : <strong>${bonsReponses} / ${total}</strong> (${pourcentage}%)<br>
            <span style="font-size: 14px;">Mots maîtrisés : ${compterMaitrises()} / ${total}</span>
        `;
    }
    
    btnRecommencer.addEventListener("click", function() {
        demarrerQuiz();
    });
    
});