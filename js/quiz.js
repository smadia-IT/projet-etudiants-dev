document.addEventListener("DOMContentLoaded", function() {
    
    // ===== RÉFÉRENCES DOM =====
    const ecranAccueil = document.getElementById("ecran-accueil");
    const ecranJeu = document.getElementById("ecran-jeu");
    const ecranGameOver = document.getElementById("ecran-gameover");
    
    const btnCommencer = document.getElementById("btn-commencer");
    const btnSuivant = document.getElementById("btn-suivant");
    const btnRejouerGo = document.getElementById("btn-rejouer-go");
    const btnAccueilGo = document.getElementById("btn-accueil-go");
        const boutonsDomaine = document.querySelectorAll(".btn-domaine");
        const boutonsDifficulte = document.querySelectorAll(".btn-difficulte");    
    
    const compteurQuestion = document.getElementById("compteur-question");
    const scoreActuel = document.getElementById("score-actuel");
    const streakElement = document.getElementById("streak");
    const viesElement = document.getElementById("vies");
    const texteQuestion = document.getElementById("texte-question");
    const optionsReponse = document.getElementById("options-reponse");
    const feedback = document.getElementById("feedback");
    const timerBarre = document.getElementById("timer-barre");
    const timerTexte = document.getElementById("timer-texte");
    
    const gameoverScore = document.getElementById("gameover-score");
    const gameoverNouveauRecord = document.getElementById("gameover-nouveau-record");
    
    const statsAccueil = document.getElementById("stats-accueil");
    const recordAccueil = document.getElementById("record-accueil");
    const partiesAccueil = document.getElementById("parties-accueil");
    const streakRecordAccueil = document.getElementById("streak-record-accueil");
        // Variables (changent selon la difficulté)
    let VIES_MAX = 3;
    let TEMPS_PAR_QUESTION = 30;
    let MULTIPLICATEUR_POINTS = 1;
    const STREAK_POUR_BONUS = 3;
    
    // Difficulté choisie
    let difficulteChoisie = localStorage.getItem("difficulteQuiz") || "facile";
    // ===== ÉTAT DU JEU =====
    let tousLesMots = [];
    let questions = [];
    let questionActuelle = 0;
    let score = 0;
    let repondu = false;
    let vies = VIES_MAX;
    let timerInterval = null;
    let tempsRestant = TEMPS_PAR_QUESTION;
    let streak = 0;
    let streakTotal = 0;
    let streakMaxPartie = 0;
        let domaineChoisi = "tous";  // Domaine sélectionné pour le quiz
    
    // Stats persistantes
    let meilleurScore = 0;
    let partiesJouees = 0;
    let meilleurStreak = 0;
    
    // Stats pour les nouveaux badges
    let questionsRepondues = 0;  // Nombre de questions dans la partie actuelle
    let viesPerdues = 0;         // Nombre de vies perdues dans la partie
    
    // ===== CHARGEMENT DES DONNÉES =====
    fetch("data/dictionnaire.json")
        .then(response => response.json())
        .then(donnees => {
            tousLesMots = donnees;
            console.log(`${tousLesMots.length} mots chargés pour le quiz`);
        })
        .catch(erreur => console.error("Erreur :", erreur));
    
    // Charger les stats au démarrage
    chargerStats();
    afficherStatsAccueil();
    
    // ===== BOUTONS =====
    btnCommencer.addEventListener("click", demarrerQuiz);
    btnSuivant.addEventListener("click", questionSuivante);
        // Écouteurs pour le choix du domaine
    boutonsDomaine.forEach(function(bouton) {
        bouton.addEventListener("click", function() {
            boutonsDomaine.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            domaineChoisi = bouton.dataset.domaine;
        });
    });
    
        // Écouteurs pour le choix de la difficulté
    boutonsDifficulte.forEach(function(bouton) {
        bouton.addEventListener("click", function() {
            boutonsDifficulte.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            difficulteChoisie = bouton.dataset.difficulte;
            localStorage.setItem("difficulteQuiz", difficulteChoisie);
        });
    });
    
    // Appliquer la difficulté sauvegardée au chargement
    boutonsDifficulte.forEach(function(bouton) {
        if (bouton.dataset.difficulte === difficulteChoisie) {
            bouton.classList.add("actif");
        } else {
            bouton.classList.remove("actif");
        }
    });
    btnRejouerGo.addEventListener("click", function() {
        gameoverNouveauRecord.classList.add("cache");
        demarrerQuiz();
    });
    
       btnAccueilGo.addEventListener("click", function() {
        // Retour à l'écran d'accueil DU QUIZ (pas la page index)
        ecranGameOver.classList.add("cache");
        ecranJeu.classList.add("cache");
        ecranAccueil.classList.remove("cache");
        
        // Recharger les stats de l'accueil
        afficherStatsAccueil();
    });
    
    // ===== GESTION DU LOCALSTORAGE =====
    function chargerStats() {
        meilleurScore = parseInt(localStorage.getItem("meilleurScore")) || 0;
        partiesJouees = parseInt(localStorage.getItem("partiesJouees")) || 0;
        meilleurStreak = parseInt(localStorage.getItem("meilleurStreak")) || 0;
    }
    
    function sauvegarderStats() {
        localStorage.setItem("meilleurScore", meilleurScore);
        localStorage.setItem("partiesJouees", partiesJouees);
        localStorage.setItem("meilleurStreak", meilleurStreak);
    }
    
    function afficherStatsAccueil() {
        if (partiesJouees > 0) {
            statsAccueil.classList.remove("cache");
            recordAccueil.textContent = meilleurScore;
            partiesAccueil.textContent = partiesJouees;
            streakRecordAccueil.textContent = meilleurStreak;
        } else {
            statsAccueil.classList.add("cache");
        }
    }
    
    // ===== DÉMARRAGE =====
        function demarrerQuiz() {
        if (tousLesMots.length === 0) {
            alert("Chargement en cours, réessaie dans un instant...");
            return;
        }
        
                // Appliquer la difficulté
        if (difficulteChoisie === "difficile") {
            VIES_MAX = 3;
            TEMPS_PAR_QUESTION = 20;
            MULTIPLICATEUR_POINTS = 2;
        } else {
            VIES_MAX = 3;
            TEMPS_PAR_QUESTION = 30;
            MULTIPLICATEUR_POINTS = 1;
        }
        score = 0;
        questionActuelle = 0;
        vies = VIES_MAX;
        streak = 0;
        streakTotal = 0;
        streakMaxPartie = 0;
        questionsRepondues = 0;
        viesPerdues = 0;
        questions = genererQuestions(1);
        
        ecranAccueil.classList.add("cache");
        ecranGameOver.classList.add("cache");
        ecranJeu.classList.remove("cache");
        gameoverNouveauRecord.classList.add("cache");
        
        majVies();
        majStreak();
        afficherQuestion();
    }
    
    function majStreak() {
        streakElement.textContent = `🔥 ${streakTotal}`;
        streakElement.classList.remove("actif", "complet");
        
        if (streakTotal > 0 && streakTotal < STREAK_POUR_BONUS) {
            streakElement.classList.add("actif");
        } else if (streak >= STREAK_POUR_BONUS) {
            streakElement.classList.add("complet");
        }
    }
    
    function majVies() {
        let texte = "";
        for (let i = 0; i < VIES_MAX; i++) {
            texte += i < vies ? "❤️" : "🖤";
        }
        viesElement.textContent = texte;
    }
    
    // ===== GÉNÉRATION DES QUESTIONS =====
       function genererQuestions(nb) {
        // Filtrer par domaine si nécessaire
        const motsDisponibles = domaineChoisi === "tous" 
            ? tousLesMots 
            : tousLesMots.filter(m => m.domaine === domaineChoisi);
        
        // ⚠️ Sécurité : si le domaine n'a pas assez de mots
        if (motsDisponibles.length < 4) {
            console.warn(`Pas assez de mots dans le domaine "${domaineChoisi}"`);
            // On utilise tous les mots
            return genererQuestionsAvecListe(tousLesMots, nb);
        }
        
        return genererQuestionsAvecListe(motsDisponibles, nb);
    }
    
    function genererQuestionsAvecListe(listeMots, nb) {
        // Mélanger les mots
        const motsMelanges = [...listeMots].sort(() => Math.random() - 0.5);
        
        // Prendre les n premiers
        const motsChoisis = motsMelanges.slice(0, nb);
        
        return motsChoisis.map(mot => {
            const types = ["definition", "mot", "vraifaux"];
            const type = types[Math.floor(Math.random() * types.length)];
            
            if (type === "definition") {
                const autresMots = tousLesMots.filter(m => m.mot !== mot.mot);
                const mauvaisesReponses = [...autresMots]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3)
                    .map(m => m.definition);
                
                const options = [mot.definition, ...mauvaisesReponses]
                    .sort(() => Math.random() - 0.5);
                
                return {
                    type: "definition",
                    mot: mot,
                    question: `Que signifie "${mot.mot}" ?`,
                    options: options,
                    bonneReponse: mot.definition
                };
            }
            
            if (type === "mot") {
                const autresMots = tousLesMots.filter(m => m.mot !== mot.mot);
                const mauvaisesReponses = [...autresMots]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3)
                    .map(m => m.mot);
                
                const options = [mot.mot, ...mauvaisesReponses]
                    .sort(() => Math.random() - 0.5);
                
                return {
                    type: "mot",
                    mot: mot,
                    question: `Quel mot correspond à cette définition ?\n"${mot.definition}"`,
                    options: options,
                    bonneReponse: mot.mot
                };
            }
            
            // Vrai/Faux
            const estVrai = Math.random() < 0.5;
            let definitionAffichee, bonneReponse;
            
            if (estVrai) {
                definitionAffichee = mot.definition;
                bonneReponse = "Vrai";
            } else {
                const autresMots = tousLesMots.filter(m => m.mot !== mot.mot);
                const autreMot = autresMots[Math.floor(Math.random() * autresMots.length)];
                definitionAffichee = autreMot.definition;
                bonneReponse = "Faux";
            }
            
            return {
                type: "vraifaux",
                mot: mot,
                question: `Vrai ou Faux ?\n"${mot.mot}" signifie : "${definitionAffichee}"`,
                options: ["Vrai", "Faux"],
                bonneReponse: bonneReponse,
                definitionAffichee: definitionAffichee
            };
        });
    }
    
    // ===== AFFICHAGE DES QUESTIONS =====
    function afficherQuestion() {
        const question = questions[questionActuelle];
        repondu = false;
        
                    const nomDomaine = domaineChoisi === "tous" ? "🎲 Mixte" : `📚 ${domaineChoisi}`;
        const iconeDifficulte = difficulteChoisie === "difficile" ? "🔥" : "";
        compteurQuestion.textContent = `${iconeDifficulte} Question ${questionActuelle + 1} — ${nomDomaine}`;
        compteurQuestion.classList.add("anim");
        setTimeout(() => compteurQuestion.classList.remove("anim"), 300);
        scoreActuel.textContent = `Score : ${score}`;
        texteQuestion.innerText = question.question;
        
        optionsReponse.innerHTML = "";
                question.options.forEach(option => {
            const btn = document.createElement("button");
            btn.className = "option";
            btn.textContent = option;
            btn.addEventListener("click", () => {
                sonClic();
                verifierReponse(btn, option, question);
            });
            optionsReponse.appendChild(btn);
        });
        
        optionsReponse.className = "options-reponse type-" + question.type;
        feedback.classList.add("cache");
        btnSuivant.classList.add("cache");
        
        demarrerTimer();
    }
    
    function questionSuivante() {
        arreterTimer();
        questionActuelle++;
        
        const nouvelleQuestion = genererQuestions(1)[0];
        questions.push(nouvelleQuestion);
        
        afficherQuestion();
    }
    
    // ===== VÉRIFICATION DES RÉPONSES =====
    function verifierReponse(btnClique, optionChoisie, question) {
        if (repondu) return;
        repondu = true;
        
        arreterTimer();
        
        const estBonne = optionChoisie === question.bonneReponse;
        
        // Désactiver toutes les options et colorer la bonne
        const toutesLesOptions = optionsReponse.querySelectorAll(".option");
        toutesLesOptions.forEach(opt => {
            opt.disabled = true;
            if (opt.textContent === question.bonneReponse) {
                opt.classList.add("bonne");
            }
        });
        
                if (!estBonne) {
            btnClique.classList.add("mauvaise");
            sonMauvaiseReponse();
            document.querySelector(".carte-question").classList.add("perte-vie");
            setTimeout(() => {
                document.querySelector(".carte-question").classList.remove("perte-vie");
            }, 500);
            vies--;
            viesPerdues++;
            streak = 0;
            streakTotal = 0;
            majVies();
            majStreak();
        } else {
            sonBonneReponse();
                       // Bonus si rapide (adapté à la difficulté)
            let points = 1;
                       if (difficulteChoisie === "difficile") {
                // En difficile (20s), barème adapté
                if (tempsRestant >= 13) points = 3;
                else if (tempsRestant >= 7) points = 2;
            } else {
                // En facile (30s), barème normal
                if (tempsRestant >= 20) points = 3;
                else if (tempsRestant >= 10) points = 2;
            }
            // Appliquer le multiplicateur
            points *= MULTIPLICATEUR_POINTS;
            score += points;
            scoreActuel.textContent = `Score : ${score}`;
            scoreActuel.classList.add("pulse");
            setTimeout(() => scoreActuel.classList.remove("pulse"), 400);
            
            // Incrémenter les séries
            streak++;
            streakTotal++;
            
            if (streakTotal > streakMaxPartie) {
                streakMaxPartie = streakTotal;
            }
            
            // Vérifier si on gagne une vie
                       if (streak >= STREAK_POUR_BONUS) {
                if (vies < VIES_MAX) {
                    vies++;
                    majVies();
                    sonVieGagnee();
                    viesElement.classList.add("gain-vie");
                    setTimeout(() => viesElement.classList.remove("gain-vie"), 500);
                    setTimeout(() => {
                        feedback.innerHTML += `<br><span style="color: #28a745; font-weight: bold;">❤️ +1 vie gagnée !</span>`;
                    }, 200);
                }
                streak = 0;
            }
            
            majStreak();
        }
        
        // Incrémenter le compteur de questions répondues
        questionsRepondues++;
        
        // Vérifier les badges qui se débloquent pendant la partie
        verifierBadgesEnPartie(questionsRepondues, viesPerdues);
        
        // Feedback
        feedback.classList.remove("cache", "succes", "erreur");
                if (estBonne) {
            feedback.classList.add("succes");
            let pointsAffiches = 1;
                       if (difficulteChoisie === "difficile") {
                if (tempsRestant >= 13) pointsAffiches = 3;
                else if (tempsRestant >= 7) pointsAffiches = 2;
            } else {
                if (tempsRestant >= 20) pointsAffiches = 3;
                else if (tempsRestant >= 10) pointsAffiches = 2;
            }
            pointsAffiches *= MULTIPLICATEUR_POINTS;
            feedback.innerHTML = `✅ Bonne réponse ! <strong>+${pointsAffiches} point(s)</strong>`;
        } else {
            feedback.classList.add("erreur");
            
            if (question.type === "definition") {
                feedback.textContent = `❌ Mauvaise réponse. "${question.mot.mot}" signifie : ${question.bonneReponse}`;
            } else if (question.type === "mot") {
                feedback.textContent = `❌ Mauvaise réponse. La bonne réponse était : ${question.bonneReponse}`;
            } else {
                if (question.bonneReponse === "Faux") {
                    feedback.innerHTML = `
                        ❌ Mauvaise réponse.<br>
                        La bonne réponse était : <strong>Faux</strong>.<br>
                        <span style="font-size: 14px;">
                            En réalité, "${question.mot.mot}" signifie : "${question.mot.definition}"
                        </span>
                    `;
                } else {
                    feedback.innerHTML = `
                        ❌ Mauvaise réponse.<br>
                        La bonne réponse était : <strong>Vrai</strong>.<br>
                        <span style="font-size: 14px;">
                            "${question.mot.mot}" signifie bien : "${question.mot.definition}"
                        </span>
                    `;
                }
            }
        }
        
        // Vérifier game over
        if (vies <= 0) {
            setTimeout(afficherGameOver, 1500);
            return;
        }
        
        btnSuivant.classList.remove("cache");
        btnSuivant.textContent = "Question suivante →";
    }
    
    // ===== TIMER =====
    function demarrerTimer() {
        arreterTimer();
        tempsRestant = TEMPS_PAR_QUESTION;
        majTimer();
        
        timerInterval = setInterval(() => {
            tempsRestant--;
            majTimer();
            
            if (tempsRestant <= 0) {
                arreterTimer();
                tempsEcoule();
            }
        }, 1000);
    }
    
    function arreterTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    function majTimer() {
        const pourcentage = (tempsRestant / TEMPS_PAR_QUESTION) * 100;
        timerBarre.style.width = pourcentage + "%";
        timerTexte.textContent = `⏱️ ${tempsRestant}s`;
        
               timerBarre.classList.remove("warning", "danger");
        timerTexte.classList.remove("danger");
        
        if (tempsRestant <= 5) {
            timerBarre.classList.add("danger");
            timerTexte.classList.add("danger");
            sonTicTac();
        } else if (tempsRestant <= 10) {
            timerBarre.classList.add("warning");
        }
    }
    
    function tempsEcoule() {
        if (repondu) return;
        repondu = true;
        
        const question = questions[questionActuelle];
        const toutesLesOptions = optionsReponse.querySelectorAll(".option");
        toutesLesOptions.forEach(opt => {
            opt.disabled = true;
            if (opt.textContent === question.bonneReponse) {
                opt.classList.add("bonne");
            }
        });
        
        // Perdre une vie et casser la série
        vies--;
        viesPerdues++;
        streak = 0;
        streakTotal = 0;
        majVies();
        majStreak();
        
        // Incrémenter le compteur de questions répondues
        questionsRepondues++;
        
        // Vérifier les badges qui se débloquent pendant la partie
        verifierBadgesEnPartie(questionsRepondues, viesPerdues);
        
        // Feedback
        feedback.classList.remove("cache", "succes", "erreur");
        feedback.classList.add("erreur");
        feedback.innerHTML = `⏰ Temps écoulé !<br>La bonne réponse était : <strong>${question.bonneReponse}</strong>`;
        
        // Vérifier game over
        if (vies <= 0) {
            setTimeout(afficherGameOver, 1500);
            return;
        }
        
        btnSuivant.classList.remove("cache");
        btnSuivant.textContent = "Question suivante →";
    }
    
    // ===== GAME OVER =====
       function afficherGameOver() {
        arreterTimer();
        sonGameOver();
        ecranJeu.classList.add("cache");
        ecranGameOver.classList.remove("cache");
        // Incrémenter le nombre de parties
        partiesJouees++;
        
        // Vérifier si nouveau record
        let nouveauRecord = false;
        if (score > meilleurScore) {
            meilleurScore = score;
            nouveauRecord = true;
        }
        
        // Vérifier si nouveau meilleur streak
        if (streakMaxPartie > meilleurStreak) {
            meilleurStreak = streakMaxPartie;
        }
        
        // Sauvegarder
        sauvegarderStats();
        
        // Vérifier les nouveaux badges (basés sur les stats globales)
        const stats = {
            partiesJouees: partiesJouees,
            meilleurScore: meilleurScore,
            meilleurStreak: meilleurStreak,
            questionsRepondues: questionsRepondues,
            viesPerdues: viesPerdues
        };
        
        const nouveauxBadges = verifierBadges(stats);
        nouveauxBadges.forEach((badge, index) => {
            setTimeout(() => afficherNotificationBadge(badge), index * 1000);
        });
        
        // Afficher le score
        gameoverScore.innerHTML = `
            Score de cette partie : <strong>${score} points</strong><br>
            <span style="font-size: 14px;">Questions répondues : ${questionActuelle + 1}</span>
        `;
        
        // Afficher le record
        if (nouveauRecord) {
            gameoverNouveauRecord.classList.remove("cache");
            gameoverRecord.textContent = `🏆 Meilleur score : ${meilleurScore} points`;
        } else {
            gameoverNouveauRecord.classList.add("cache");
            gameoverRecord.textContent = `🏆 Meilleur score : ${meilleurScore} points`;
        }
    }
    
});