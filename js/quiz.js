 document.addEventListener("DOMContentLoaded", function() {
    
    // ===== RÉFÉRENCES DOM =====
    const ecranAccueil = document.getElementById("ecran-accueil");
    const ecranJeu = document.getElementById("ecran-jeu");

    const btnCommencer = document.getElementById("btn-commencer");
    const btnSuivant = document.getElementById("btn-suivant");
   
   
        const streakElement = document.getElementById("streak");
    const compteurQuestion = document.getElementById("compteur-question");
    const scoreActuel = document.getElementById("score-actuel");
    const texteQuestion = document.getElementById("texte-question");
    const optionsReponse = document.getElementById("options-reponse");
    const feedback = document.getElementById("feedback");
   
    const ecranGameOver = document.getElementById("ecran-gameover");
    const viesElement = document.getElementById("vies");
    const timerBarre = document.getElementById("timer-barre");
    const timerTexte = document.getElementById("timer-texte");
    const gameoverMessage = document.getElementById("gameover-message");
    const gameoverScore = document.getElementById("gameover-score");
    const btnRejouerGo = document.getElementById("btn-rejouer-go");
    const btnAccueilGo = document.getElementById("btn-accueil-go");
        const statsAccueil = document.getElementById("stats-accueil");
    const recordAccueil = document.getElementById("record-accueil");
    const partiesAccueil = document.getElementById("parties-accueil");
    const streakRecordAccueil = document.getElementById("streak-record-accueil");
    const gameoverNouveauRecord = document.getElementById("gameover-nouveau-record");
    
    // ===== ÉTAT DU JEU =====
    // Plus de limite ! On génère les questions à la volée.
    let tousLesMots = [];
    let questions = [];
    let questionActuelle = 0;
    let score = 0;
        // Stats persistantes (localStorage)
    let meilleurScore = 0;
    let partiesJouees = 0;
    let meilleurStreak = 0;
    let streakMaxPartie = 0;  // Série max dans la partie actuelle
    // Stats pour les badges
    let partieParfaite = false;   // 100% de réussite
    let partieSansErreur = false; // 3 vies intactes

    let repondu = false;
    const VIES_MAX = 3;
    const TEMPS_PAR_QUESTION = 30;  // secondes
    let vies = VIES_MAX;
    let timerInterval = null;
    let tempsRestant = TEMPS_PAR_QUESTION;
        const STREAK_POUR_BONUS = 3;  // Nombre de bonnes réponses d'affilée pour gagner une vie
    let streak = 0;
    let streakTotal = 0;  // Série totale de la partie (pour les badges)
    
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
          
               btnRejouerGo.addEventListener("click", function() {
        gameoverNouveauRecord.classList.add("cache");
        demarrerQuiz();
    });
    
    btnAccueilGo.addEventListener("click", function() {
        window.location.href = "index.html";
    });


    // ===== FONCTIONS =====
        // ===== GESTION DU LOCALSTORAGE =====
        function chargerStats() {
        meilleurScore = parseInt(localStorage.getItem("meilleurScore")) || 0;
        partiesJouees = parseInt(localStorage.getItem("partiesJouees")) || 0;
        meilleurStreak = parseInt(localStorage.getItem("meilleurStreak")) || 0;
        partieParfaite = localStorage.getItem("partieParfaite") === "true";
        partieSansErreur = localStorage.getItem("partieSansErreur") === "true";
    }
    
       function sauvegarderStats() {
        localStorage.setItem("meilleurScore", meilleurScore);
        localStorage.setItem("partiesJouees", partiesJouees);
        localStorage.setItem("meilleurStreak", meilleurStreak);
        localStorage.setItem("partieParfaite", partieParfaite);
        localStorage.setItem("partieSansErreur", partieSansErreur);
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
               function demarrerQuiz() {
        if (tousLesMots.length === 0) {
            alert("Chargement en cours, réessaie dans un instant...");
            return;
        }
        
                      score = 0;
        questionActuelle = 0;
        vies = VIES_MAX;
               streak = 0;
        streakTotal = 0;
        streakMaxPartie = 0;
        questions = genererQuestions(1);
        partieSansErreur = true;  // ← On part du principe qu'il n'y a pas d'erreur // ← 1 seule question pour commencer
        
               ecranAccueil.classList.add("cache");
        ecranGameOver.classList.add("cache");
        ecranJeu.classList.remove("cache");
        gameoverNouveauRecord.classList.add("cache");  // ← Cacher le message
        
                majVies();
        majStreak();
        afficherQuestion();
    }
    
            function majStreak() {
        // Afficher la série TOTALE (pour les badges)
        streakElement.textContent = `🔥 ${streakTotal}`;
        
        streakElement.classList.remove("actif", "complet");
        
        if (streakTotal > 0 && streakTotal < STREAK_POUR_BONUS) {
            streakElement.classList.add("actif");
        } else if (streak >= STREAK_POUR_BONUS) {
            streakElement.classList.add("complet");
        }
    }
       
    
     function genererQuestions(nb) {
        // Mélanger les mots
        const motsMelanges = [...tousLesMots].sort(() => Math.random() - 0.5);
        
        // Prendre les n premiers
        const motsChoisis = motsMelanges.slice(0, nb);
        
        // Pour chaque mot, générer une question d'un type aléatoire
        return motsChoisis.map(mot => {
            // Choisir un type de question au hasard
            const types = ["definition", "mot", "vraifaux"];
            const type = types[Math.floor(Math.random() * types.length)];
            
            if (type === "definition") {
                // Format 1 : "Que signifie X ?" → 4 définitions
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
                // Format 2 : "Quel mot correspond à ... ?" → 4 mots
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
            
            // Format 3 : Vrai/Faux
            // 50% de chance que ce soit vrai, 50% que ce soit faux
            const estVrai = Math.random() < 0.5;
            let definitionAffichee, bonneReponse;
            
            if (estVrai) {
                definitionAffichee = mot.definition;
                bonneReponse = "Vrai";
            } else {
                // Prendre la définition d'un AUTRE mot
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
               function afficherQuestion() {
        const question = questions[questionActuelle];
        repondu = false;
        
        compteurQuestion.textContent = `Question ${questionActuelle + 1}`;  // ← plus de /5
        scoreActuel.textContent = `Score : ${score}`;
        
        texteQuestion.innerText = question.question;
        
        optionsReponse.innerHTML = "";
        question.options.forEach(option => {
            const btn = document.createElement("button");
            btn.className = "option";
            btn.textContent = option;
            btn.addEventListener("click", () => verifierReponse(btn, option, question));
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
        
        // Générer une nouvelle question à la volée
        const nouvelleQuestion = genererQuestions(1)[0];
        questions.push(nouvelleQuestion);
        
        afficherQuestion();
    }
            function verifierReponse(btnClique, optionChoisie, question) {
        if (repondu) return;
        repondu = true;
        
        arreterTimer();  // ← ARRÊTER LE TIMER
        
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
            vies--;
            streak = 0;
            streakTotal = 0;   // ← casser la série totale aussi
            partieSansErreur = false;
            majVies();
            majStreak();
        } else {
            // Bonus si rapide
            let points = 1;
            if (tempsRestant >= 20) {
                points = 3;
            } else if (tempsRestant >= 10) {
                points = 2;
            }
            score += points;
            scoreActuel.textContent = `Score : ${score}`;
            
                        // Incrémenter la série
                       // Incrémenter les deux séries
            streak++;
            streakTotal++;
            
            // Mettre à jour la série max de la partie (basée sur streakTotal)
            if (streakTotal > streakMaxPartie) {
                streakMaxPartie = streakTotal;
            }
            
            // Vérifier si on gagne une vie (basé sur streak)
            if (streak >= STREAK_POUR_BONUS) {
                if (vies < VIES_MAX) {
                    vies++;
                    majVies();
                    setTimeout(() => {
                        feedback.innerHTML += `<br><span style="color: #28a745; font-weight: bold;">❤️ +1 vie gagnée !</span>`;
                    }, 200);
                }
                streak = 0;  // ← On remet streak à 0, mais PAS streakTotal
            }
            
            majStreak();
        }
        
        // Feedback
        feedback.classList.remove("cache", "succes", "erreur");
        if (estBonne) {
            feedback.classList.add("succes");
            feedback.innerHTML = `✅ Bonne réponse ! <strong>+${tempsRestant >= 20 ? 3 : (tempsRestant >= 10 ? 2 : 1)} point(s)</strong>`;
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
        btnSuivant.textContent = "Question suivante →";  // ← toujours pareil
    
    }

        // ===== TIMER =====
    function demarrerTimer() {
        // Réinitialiser
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
        if (tempsRestant <= 5) {
            timerBarre.classList.add("danger");
        } else if (tempsRestant <= 10) {
            timerBarre.classList.add("warning");
        }
    }
    
    function tempsEcoule() {
        if (repondu) return;
        repondu = true;
        
        // Marquer la bonne réponse
        const question = questions[questionActuelle];
        const toutesLesOptions = optionsReponse.querySelectorAll(".option");
        toutesLesOptions.forEach(opt => {
            opt.disabled = true;
            if (opt.textContent === question.bonneReponse) {
                opt.classList.add("bonne");
            }
        });
        
                      // Perdre une vie et casser la série
                // Perdre une vie et casser la série
        vies--;
        streak = 0;
        streakTotal = 0;
        partieSansErreur = false;
        majVies();
        majStreak();
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
    
    // ===== VIES =====
    function majVies() {
        let texte = "";
        for (let i = 0; i < VIES_MAX; i++) {
            texte += i < vies ? "❤️" : "🖤";
        }
        viesElement.textContent = texte;
    }    function afficherFin() {
        arreterTimer();
        scoreTotal += score;
        
        ecranJeu.classList.add("cache");
        ecranFin.classList.remove("cache");
        scoreFinal.innerHTML = `
            Score de cette partie : <strong>${score} / ${NB_QUESTIONS * 3}</strong><br>
            <span style="font-size: 14px; color: var(--couleur-texte-clair);">
                Score total cumulé : ${scoreTotal} points
            </span>
        `;
    }
           function afficherGameOver() {
        arreterTimer();
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
        
        // Vérifier si partie parfaite (au moins 5 questions, 100% réussite)
        if (questionActuelle + 1 >= 5 && partieSansErreur) {
            partieParfaite = true;
        }
        
        // Vérifier si 3 vies intactes (partie longue = au moins 5 questions)
        if (questionActuelle + 1 >= 5 && vies === VIES_MAX) {
            partieSansErreur = true;
        }
        
        // Sauvegarder
        sauvegarderStats();
        
        // Vérifier les nouveaux badges
        const stats = {
            partiesJouees: partiesJouees,
            meilleurScore: meilleurScore,
            meilleurStreak: meilleurStreak,
            partieParfaite: partieParfaite,
            partieSansErreur: partieSansErreur
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