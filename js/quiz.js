// ============================================
// PAGE QUIZ
// ============================================

// Fonctions utilitaires (hors DOMContentLoaded)
function echapperQuiz(texte) {
    const div = document.createElement("div");
    div.textContent = texte ?? "";
    return div.innerHTML;
}

function normaliserReponse(texte) {
    return (texte ?? "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function melangerTableau(tableau) {
    return [...tableau].sort(() => Math.random() - 0.5);
}

function echapperRegex(texte) {
    return texte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

document.addEventListener("DOMContentLoaded", function () {

    // ===== RÉFÉRENCES DOM =====
    const ecranAccueil = document.getElementById("ecran-accueil");
    const ecranJeu = document.getElementById("ecran-jeu");
    const ecranGameOver = document.getElementById("ecran-gameover");

    const btnCommencer = document.getElementById("btn-commencer");
    const btnSuivant = document.getElementById("btn-suivant");
    const btnRejouerGo = document.getElementById("btn-rejouer-go");
    const btnAccueilGo = document.getElementById("btn-accueil-go");
    const btnPause = document.getElementById("btn-quitter-partie");
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
    const carteQuestion = document.querySelector(".carte-question");

    const gameoverScore = document.getElementById("gameover-score");
    const gameoverNouveauRecord = document.getElementById("gameover-nouveau-record");
    const gameoverRecord = document.getElementById("gameover-record");

    const statsAccueil = document.getElementById("stats-accueil");
    const recordAccueil = document.getElementById("record-accueil");
    const partiesAccueil = document.getElementById("parties-accueil");
    const streakRecordAccueil = document.getElementById("streak-record-accueil");

    // ===== CONSTANTES ET ÉTAT =====
    let VIES_MAX = 3;
    let TEMPS_PAR_QUESTION = 30;
    let MULTIPLICATEUR_POINTS = 1;
    const STREAK_POUR_BONUS = 3;

    let difficulteChoisie = localStorage.getItem("difficulteQuiz") || "facile";
    let domaineChoisi = "tous";

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

    let meilleurScore = 0;
    let partiesJouees = 0;
    let meilleurStreak = 0;

    let questionsRepondues = 0;
    let viesPerdues = 0;
        let achatsDeVie = 0; // nombre de vies achetées pendant cette partie
    const COUT_VIE_BASE = 10;

    let partieEnCours = false;
    let enPause = false;
    let ecranPauseEl = null;

    // ============================================
    // CHARGEMENT DES DONNÉES
    // ============================================
    fetch("data/dictionnaire.json")
        .then(response => response.json())
        .then(donnees => {
            tousLesMots = donnees;
            console.log(`${tousLesMots.length} mots chargés pour le quiz`);
        })
        .catch(erreur => console.error("Erreur :", erreur));

    chargerStats();
    afficherStatsAccueil();

    // ============================================
    // BOUTONS
    // ============================================
    btnCommencer.addEventListener("click", demarrerQuiz);
    btnSuivant.addEventListener("click", questionSuivante);

    boutonsDomaine.forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            boutonsDomaine.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            domaineChoisi = bouton.dataset.domaine;
        });
    });

    boutonsDifficulte.forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            boutonsDifficulte.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            difficulteChoisie = bouton.dataset.difficulte;
            localStorage.setItem("difficulteQuiz", difficulteChoisie);
        });
    });

    boutonsDifficulte.forEach(function (bouton) {
        bouton.classList.toggle("actif", bouton.dataset.difficulte === difficulteChoisie);
    });

    // Le bouton de la partie devient « Pause »
    if (btnPause) {
        btnPause.textContent = "⏸ Pause";
        btnPause.title = "Mettre la partie en pause";
        btnPause.addEventListener("click", mettreEnPause);
    }

    btnRejouerGo.addEventListener("click", function () {
        ecranGameOver.classList.add("cache");
        demarrerQuiz();
    });

    btnAccueilGo.addEventListener("click", function () {
        ecranGameOver.classList.add("cache");
        ecranJeu.classList.add("cache");
        ecranAccueil.classList.remove("cache");
        afficherStatsAccueil();
    });

    // ============================================
    // PAUSE
    // ============================================
    function creerEcranPause() {
        const overlay = document.createElement("div");
        overlay.id = "ecran-pause";
        overlay.className = "modale-overlay cache";
        overlay.innerHTML = `
            <div class="modale modale-pause">
                <div class="pause-icone">⏸️</div>
                <h2>Partie en pause</h2>
                <p>Ta partie est gardée. Prends ton temps, elle t'attend !</p>
                <div class="pause-actions">
                    <button id="btn-reprendre" class="btn-primaire">▶ Reprendre</button>
                    <button id="btn-abandonner" class="btn-secondaire">🏠 Retour à l'accueil</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector("#btn-reprendre").addEventListener("click", reprendre);
        overlay.querySelector("#btn-abandonner").addEventListener("click", abandonner);
        return overlay;
    }

    function mettreEnPause() {
        if (!partieEnCours || enPause) return;
        enPause = true;
        arreterTimer();
        if (!ecranPauseEl) ecranPauseEl = creerEcranPause();
        ecranPauseEl.classList.remove("cache");
    }

    function reprendre() {
        if (!enPause) return;
        enPause = false;
        if (ecranPauseEl) ecranPauseEl.classList.add("cache");
        // Le minuteur repart seulement si la question n'a pas encore reçu de réponse
        if (partieEnCours && !repondu) relancerTimer();
    }

    function abandonner() {
        if (!confirm("Abandonner la partie ? Ton score ne sera pas enregistré.")) return;
        arreterTimer();
        partieEnCours = false;
        enPause = false;
        if (ecranPauseEl) ecranPauseEl.classList.add("cache");
        ecranJeu.classList.add("cache");
        ecranAccueil.classList.remove("cache");
        afficherStatsAccueil();
    }

    // En changeant d'onglet ou en quittant la page, la partie se met en pause
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) mettreEnPause();
    });
    window.addEventListener("pagehide", arreterTimer);

    // ============================================
    // STATS LOCALES
    // ============================================
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

    // ============================================
    // DÉMARRAGE
    // ============================================
    function demarrerQuiz() {
        if (tousLesMots.length === 0) {
            alert("Chargement en cours, réessaie dans un instant...");
            return;
        }

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
                achatsDeVie = 0;
        partieEnCours = true;
        enPause = false;
        if (ecranPauseEl) ecranPauseEl.classList.add("cache");

        questions = [genererQuestion(choisirMotAuHasard())];

        ecranAccueil.classList.add("cache");
        ecranGameOver.classList.add("cache");
        ecranJeu.classList.remove("cache");

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

    // ============================================
    // GÉNÉRATION DES QUESTIONS
    // ============================================
    function motsDuDomaine() {
        return domaineChoisi === "tous"
            ? tousLesMots
            : tousLesMots.filter(m => m.domaine === domaineChoisi);
    }

    function choisirMotAuHasard() {
        const liste = motsDuDomaine().length >= 4 ? motsDuDomaine() : tousLesMots;
        return melangerTableau(liste)[0];
    }

    function autresValeurs(motDeReference, extraire, n = 3) {
        const valeurs = melangerTableau(tousLesMots.filter(m => m.mot !== motDeReference.mot))
            .map(extraire)
            .filter(v => v && v !== extraire(motDeReference));
        return [...new Set(valeurs)].slice(0, n);
    }

    function definitionAvecTrou(mot) {
        const regex = new RegExp(echapperRegex(mot.mot), "gi");
        return mot.definition.replace(regex, "_____");
    }

    // Type 1 : quelle est la définition de ce mot ?
    function questionDefinition(mot) {
        const mauvaises = autresValeurs(mot, m => m.definition);
        return {
            type: "definition",
            mot,
            question: `Que signifie "${mot.mot}" ?`,
            options: melangerTableau([mot.definition, ...mauvaises]),
            bonneReponse: mot.definition
        };
    }

    // Type 2 : quel mot correspond à cette définition ?
    function questionMot(mot) {
        const mauvais = autresValeurs(mot, m => m.mot);
        return {
            type: "mot",
            mot,
            question: `Quel mot correspond à cette définition ?\n"${mot.definition}"`,
            options: melangerTableau([mot.mot, ...mauvais]),
            bonneReponse: mot.mot
        };
    }

    // Type 3 : vrai ou faux
    function questionVraiFaux(mot) {
        const estVrai = Math.random() < 0.5;
        let definitionAffichee;
        let bonneReponse;

        if (estVrai) {
            definitionAffichee = mot.definition;
            bonneReponse = "Vrai";
        } else {
            const autres = tousLesMots.filter(m => m.mot !== mot.mot);
            definitionAffichee = autres[Math.floor(Math.random() * autres.length)].definition;
            bonneReponse = "Faux";
        }

        return {
            type: "vraifaux",
            mot,
            question: `Vrai ou Faux ?\n"${mot.mot}" signifie : "${definitionAffichee}"`,
            options: ["Vrai", "Faux"],
            bonneReponse,
            definitionAffichee
        };
    }

    // Type 4 : complète la définition (le mot est remplacé par un trou)
    function questionComplete(mot) {
        if (!new RegExp(echapperRegex(mot.mot), "i").test(mot.definition)) {
            return questionDefinition(mot);
        }
        const mauvais = autresValeurs(mot, m => m.mot);
        return {
            type: "complete",
            mot,
            question: `Complète la définition :\n"${definitionAvecTrou(mot)}"`,
            options: melangerTableau([mot.mot, ...mauvais]),
            bonneReponse: mot.mot
        };
    }

    // Type 5 : dans quel domaine se trouve ce mot ?
    function questionDomaine(mot) {
        const autresDomaines = [...new Set(tousLesMots.map(m => m.domaine))]
            .filter(d => d !== mot.domaine);
        if (autresDomaines.length < 3) return questionDefinition(mot);

        const mauvais = melangerTableau(autresDomaines).slice(0, 3);
        return {
            type: "domaine",
            mot,
            question: `Dans quel domaine se trouve le mot "${mot.mot}" ?`,
            options: melangerTableau([mot.domaine, ...mauvais]),
            bonneReponse: mot.domaine
        };
    }

    // Type 6 : écris le mot à partir de sa définition (réponse tapée)
    function questionSaisie(mot) {
        if (!new RegExp(echapperRegex(mot.mot), "i").test(mot.definition)) {
            return questionDefinition(mot);
        }
        return {
            type: "saisie",
            mot,
            question: `Écris le mot défini ici :\n"${definitionAvecTrou(mot)}"`,
            options: [],
            bonneReponse: mot.mot
        };
    }

    function genererQuestion(mot) {
        const types = ["definition", "mot", "vraifaux", "complete", "domaine", "saisie"];
        const type = types[Math.floor(Math.random() * types.length)];

        switch (type) {
            case "definition": return questionDefinition(mot);
            case "mot": return questionMot(mot);
            case "vraifaux": return questionVraiFaux(mot);
            case "complete": return questionComplete(mot);
            case "domaine": return questionDomaine(mot);
            case "saisie": return questionSaisie(mot);
            default: return questionDefinition(mot);
        }
    }

    // ============================================
    // AFFICHAGE DES QUESTIONS
    // ============================================
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
        feedback.classList.add("cache");
        btnSuivant.classList.add("cache");

        if (question.type === "saisie") {
            afficherChampSaisie(question);
        } else {
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
        }

        optionsReponse.className = "options-reponse type-" + question.type;
        demarrerTimer();
    }

    function afficherChampSaisie(question) {
        optionsReponse.innerHTML = `
            <div class="saisie-bloc">
                <input type="text" id="champ-saisie" class="champ-saisie"
                       placeholder="Tape ta réponse..." autocomplete="off"
                       autocapitalize="off" spellcheck="false">
                <button id="btn-valider-saisie" class="btn-primaire btn-valider">✅ Valider</button>
            </div>
        `;

        const champ = document.getElementById("champ-saisie");
        const btnValider = document.getElementById("btn-valider-saisie");

        const valider = function () {
            if (repondu) return;
            if (champ.value.trim() === "") {
                champ.focus();
                return;
            }
            sonClic();
            verifierReponse(null, champ.value.trim(), question);
        };

        btnValider.addEventListener("click", valider);
        champ.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                valider();
            }
        });
        setTimeout(() => champ.focus(), 100);
    }

    function questionSuivante() {
        arreterTimer();
        questionActuelle++;
        questions.push(genererQuestion(choisirMotAuHasard()));
        afficherQuestion();
    }

    // ============================================
    // POINTS
    // ============================================
    function calculerPoints() {
        let points = 1;
        if (difficulteChoisie === "difficile") {
            if (tempsRestant >= 13) points = 3;
            else if (tempsRestant >= 7) points = 2;
        } else {
            if (tempsRestant >= 20) points = 3;
            else if (tempsRestant >= 10) points = 2;
        }
        return points * MULTIPLICATEUR_POINTS;
    }

    // ============================================
    // VÉRIFICATION DES RÉPONSES
    // ============================================
    function feedbackMauvaise(question) {
        const mot = question.mot;

        if (question.type === "definition") {
            return `❌ Mauvaise réponse. "${echapperQuiz(mot.mot)}" signifie : ${echapperQuiz(question.bonneReponse)}`;
        }
        if (question.type === "mot" || question.type === "complete" || question.type === "saisie") {
            return `❌ Mauvaise réponse. Le mot était : <strong>${echapperQuiz(mot.mot)}</strong>
                    <br><span style="font-size:14px;">${echapperQuiz(mot.definition)}</span>`;
        }
        if (question.type === "domaine") {
            return `❌ Mauvaise réponse. "${echapperQuiz(mot.mot)}" se trouve dans : <strong>${echapperQuiz(mot.domaine)}</strong>`;
        }
        // Vrai ou faux
        if (question.bonneReponse === "Faux") {
            return `❌ Mauvaise réponse.<br>La bonne réponse était : <strong>Faux</strong>.<br>
                    <span style="font-size:14px;">En réalité, "${echapperQuiz(mot.mot)}" signifie : "${echapperQuiz(mot.definition)}"</span>`;
        }
        return `❌ Mauvaise réponse.<br>La bonne réponse était : <strong>Vrai</strong>.<br>
                <span style="font-size:14px;">"${echapperQuiz(mot.mot)}" signifie bien : "${echapperQuiz(mot.definition)}"</span>`;
    }

    function verifierReponse(btnClique, optionChoisie, question) {
        if (repondu || enPause) return;
        repondu = true;
        arreterTimer();

        const estBonne = question.type === "saisie"
            ? normaliserReponse(optionChoisie) === normaliserReponse(question.bonneReponse)
            : optionChoisie === question.bonneReponse;

        // Verrouiller toutes les réponses (boutons et champ de saisie)
        optionsReponse.querySelectorAll("input, button").forEach(el => { el.disabled = true; });
        optionsReponse.querySelectorAll(".option").forEach(opt => {
            if (opt.textContent === question.bonneReponse) opt.classList.add("bonne");
        });

        const champ = optionsReponse.querySelector("input");
        if (champ) champ.classList.add(estBonne ? "bonne" : "mauvaise");

        if (!estBonne) {
            if (btnClique) btnClique.classList.add("mauvaise");
            sonMauvaiseReponse();
            if (carteQuestion) {
                carteQuestion.classList.add("perte-vie");
                setTimeout(() => carteQuestion.classList.remove("perte-vie"), 500);
            }
            vies--;
            viesPerdues++;
            streak = 0;
            streakTotal = 0;
            majVies();
            majStreak();
        } else {
            sonBonneReponse();
            score += calculerPoints();
            scoreActuel.textContent = `Score : ${score}`;
            scoreActuel.classList.add("pulse");
            setTimeout(() => scoreActuel.classList.remove("pulse"), 400);

            streak++;
            streakTotal++;
            if (streakTotal > streakMaxPartie) streakMaxPartie = streakTotal;

            if (streak >= STREAK_POUR_BONUS) {
                if (vies < VIES_MAX) {
                    vies++;
                    majVies();
                    sonVieGagnee();
                    viesElement.classList.add("gain-vie");
                    setTimeout(() => viesElement.classList.remove("gain-vie"), 500);
                    setTimeout(() => {
                        feedback.innerHTML += `<br><span style="color:#28a745;font-weight:bold;">❤️ +1 vie gagnée !</span>`;
                    }, 200);
                }
                streak = 0;
            }
            majStreak();
        }

        questionsRepondues++;
        verifierBadgesEnPartie(questionsRepondues, viesPerdues);

        feedback.classList.remove("cache", "succes", "erreur");
        if (estBonne) {
            feedback.classList.add("succes");
            feedback.innerHTML = `✅ Bonne réponse ! <strong>+${calculerPoints()} point(s)</strong>`;
        } else {
            feedback.classList.add("erreur");
            feedback.innerHTML = feedbackMauvaise(question);
        }

             if (vies <= 0) {
            proposerAchatVie();
            return;
        }

        btnSuivant.classList.remove("cache");
        btnSuivant.textContent = "Question suivante →";
    }

    // ============================================
    // MINUTEUR
    // ============================================
    function demarrerTimer() {
        tempsRestant = TEMPS_PAR_QUESTION;
        majTimer();
        relancerTimer();
    }

    // Relance le compte à rebours sans le remettre à zéro (utilisé après une pause)
    function relancerTimer() {
        arreterTimer();
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
        optionsReponse.querySelectorAll("input, button").forEach(el => { el.disabled = true; });
        optionsReponse.querySelectorAll(".option").forEach(opt => {
            if (opt.textContent === question.bonneReponse) opt.classList.add("bonne");
        });

        vies--;
        viesPerdues++;
        streak = 0;
        streakTotal = 0;
        majVies();
        majStreak();

        questionsRepondues++;
        verifierBadgesEnPartie(questionsRepondues, viesPerdues);

        feedback.classList.remove("cache", "succes", "erreur");
        feedback.classList.add("erreur");
        feedback.innerHTML = `⏰ Temps écoulé !<br>La bonne réponse était : <strong>${echapperQuiz(question.bonneReponse)}</strong>`;

        if (vies <= 0) {
            setTimeout(afficherGameOver, 1500);
            return;
        }

        btnSuivant.classList.remove("cache");
        btnSuivant.textContent = "Question suivante →";
    }
        // ============================================
    // ACHAT D'UNE VIE AVEC DES POINTS
    // ============================================
    function coutProchaineVie() {
        return COUT_VIE_BASE * (achatsDeVie + 1);
    }

    function lireSolde() {
        return parseInt(localStorage.getItem("points") || "0", 10);
    }

    function ecrireSolde(valeur) {
        localStorage.setItem("points", String(valeur));
        const headerPoints = document.getElementById("points-header");
        if (headerPoints) headerPoints.textContent = valeur;
    }

    function acheterVie() {
        const cout = coutProchaineVie();
        const solde = lireSolde();

        if (solde < cout) {
            alert(`Il te faut ${cout} points pour une vie. Tu en as ${solde}.`);
            return false;
        }

        ecrireSolde(solde - cout);
        achatsDeVie++;
        vies++;
        majVies();
        sonVieGagnee();
        return true;
    }
        function proposerAchatVie() {
        const cout = coutProchaineVie();
        const solde = lireSolde();

        arreterTimer();
        btnSuivant.classList.add("cache");
        feedback.classList.remove("cache");
        feedback.classList.add("erreur");
        feedback.innerHTML = `
            💔 Plus de vies !<br>
            Tu as <strong>${solde} points</strong>.
            Une vie coûte <strong>${cout} points</strong>.
            <div class="achat-vie-actions">
                <button id="btn-acheter-vie" class="btn-primaire" ${solde < cout ? "disabled" : ""}>
                    ❤️ Acheter une vie (${cout} pts)
                </button>
                <button id="btn-fin-partie" class="btn-secondaire">Terminer la partie</button>
            </div>
        `;

        document.getElementById("btn-acheter-vie")?.addEventListener("click", function () {
            if (acheterVie()) {
                // Reprendre la question suivante
                feedback.classList.add("cache");
                questionSuivante();
            }
        });

        document.getElementById("btn-fin-partie")?.addEventListener("click", afficherGameOver);
    }

    // ============================================
    // FIN DE PARTIE
    // ============================================
    function afficherGameOver() {
        arreterTimer();
        partieEnCours = false;
        enPause = false;
        if (ecranPauseEl) ecranPauseEl.classList.add("cache");

        sonGameOver();
        ecranJeu.classList.add("cache");
        ecranGameOver.classList.remove("cache");

        partiesJouees++;

        const nouveauRecord = score > meilleurScore;
        if (nouveauRecord) meilleurScore = score;
        if (streakMaxPartie > meilleurStreak) meilleurStreak = streakMaxPartie;
        sauvegarderStats();

        const stats = {
            partiesJouees,
            meilleurScore,
            meilleurStreak,
            questionsRepondues,
            viesPerdues
        };
        const nouveauxBadges = verifierBadges(stats);
        nouveauxBadges.forEach((badge, index) => {
            setTimeout(() => afficherNotificationBadge(badge), index * 1000);
        });

        // Score de la partie (celui qui vient d'être joué)
        gameoverScore.innerHTML = `
            Score de cette partie : <strong>${score} point(s)</strong><br>
            <span style="font-size: 14px;">Questions répondues : ${questionsRepondues}</span>
        `;

        if (gameoverRecord) {
            gameoverRecord.textContent = `🏆 Meilleur score : ${meilleurScore} points`;
        }
        gameoverNouveauRecord.classList.toggle("cache", !nouveauRecord);
    }

});