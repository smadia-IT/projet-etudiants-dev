// ============================================
// GESTION DES DONNÉES DE RÉVISION
// ============================================

const SCORE_MAITRISE_MAX = 3;

// Charger la liste de révision
function getListeRevision() {
    const stocke = localStorage.getItem("motsAReviser");
    return stocke ? JSON.parse(stocke) : [];
}

// Sauvegarder la liste
function sauvegarderListeRevision(liste) {
    localStorage.setItem("motsAReviser", JSON.stringify(liste));
}

// Vérifier si un mot est dans la liste
function estDansListeRevision(mot) {
    return getListeRevision().some(item => item.mot === mot);
}

// Ajouter un mot à la liste
function ajouterMotRevision(mot) {
    const liste = getListeRevision();
    if (!liste.some(item => item.mot === mot)) {
        liste.push({ mot: mot, maitrise: 0 });
        sauvegarderListeRevision(liste);
        return true;
    }
    return false;
}

// Retirer un mot de la liste
function retirerMotRevision(mot) {
    const liste = getListeRevision();
    const nouvelle = liste.filter(item => item.mot !== mot);
    sauvegarderListeRevision(nouvelle);
}

// Mettre à jour la maîtrise d'un mot
function mettreAJourMaitrise(mot, reussi) {
    const liste = getListeRevision();
    const item = liste.find(i => i.mot === mot);
    if (!item) return;
    
    if (reussi) {
        item.maitrise = Math.min(item.maitrise + 1, SCORE_MAITRISE_MAX);
    } else {
        item.maitrise = 0;
    }
    
    sauvegarderListeRevision(liste);
}

// Compter les mots maîtrisés
function compterMaitrises() {
    return getListeRevision().filter(item => item.maitrise >= SCORE_MAITRISE_MAX).length;
}

// Vider la liste
function viderListeRevision() {
    localStorage.removeItem("motsAReviser");
}