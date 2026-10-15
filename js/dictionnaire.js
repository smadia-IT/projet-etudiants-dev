// ============================================
// PAGE DICTIONNAIRE
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    // ===== RÉFÉRENCES DOM =====
    const listeMots = document.getElementById("liste-mots");
    const compteur = document.getElementById("compteur-mots");
    const champRecherche = document.getElementById("recherche");
    const boutonsNiveau = document.querySelectorAll(".btn-niveau");
    const btnFavoris = document.getElementById("btn-favoris");
    const compteurFavoris = document.getElementById("compteur-favoris");
    const menuFiltres = document.getElementById("menu-filtres");
    const btnPrincipal = document.getElementById("btn-filtre-principal");
    const labelActuel = document.getElementById("filtre-actuel-label");

    // ===== ÉTAT =====
    let tousLesMots = [];
    let filtreActif = "tous";
    let filtreNiveauActif = "tous";
    let filtreFavorisActif = false;
    let motsFavoris = [];
    let texteRecherche = "";
    let timeoutRecherche = null;

    // ============================================
    // FAVORIS
    // ============================================
    function chargerFavoris() {
        const stockes = localStorage.getItem("motsFavoris");
        motsFavoris = stockes ? JSON.parse(stockes) : [];
    }

    function sauvegarderFavoris() {
        localStorage.setItem("motsFavoris", JSON.stringify(motsFavoris));
    }

    function estFavori(mot) {
        return motsFavoris.includes(mot);
    }

    function toggleFavori(mot) {
        if (estFavori(mot)) {
            motsFavoris = motsFavoris.filter(m => m !== mot);
        } else {
            motsFavoris.push(mot);
        }
        sauvegarderFavoris();
        majCompteurFavoris();
    }

    function majCompteurFavoris() {
        const nb = motsFavoris.length;
        compteurFavoris.textContent = `${nb} favori${nb > 1 ? "s" : ""}`;
    }

    // ============================================
    // CHARGEMENT DES DONNÉES
    // ============================================
    chargerFavoris();
    majCompteurFavoris();

    fetch("data/dictionnaire.json")
        .then(response => response.json())
        .then(mots => {
            tousLesMots = mots;
            console.log(`${tousLesMots.length} mots chargés depuis le JSON`);
            genererFiltresDomaines();
            afficherMotsFiltres();
        })
        .catch(erreur => console.error("Erreur chargement dictionnaire :", erreur));

    // ============================================
    // RECHERCHE (avec délai pour ne pas recalculer à chaque lettre)
    // ============================================
    champRecherche.addEventListener("input", function () {
        clearTimeout(timeoutRecherche);
        timeoutRecherche = setTimeout(function () {
            texteRecherche = champRecherche.value.trim().toLowerCase();
            afficherMotsFiltres();
        }, 200);
    });

    // ============================================
    // FILTRES PAR NIVEAU
    // ============================================
    boutonsNiveau.forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            boutonsNiveau.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            filtreNiveauActif = bouton.dataset.niveau;
            afficherMotsFiltres();
        });
    });

    // ============================================
    // FILTRE FAVORIS
    // ============================================
    btnFavoris.addEventListener("click", function () {
        filtreFavorisActif = !filtreFavorisActif;
        btnFavoris.classList.toggle("actif", filtreFavorisActif);
        btnFavoris.textContent = filtreFavorisActif
            ? "⭐ Afficher tout"
            : "☆ Afficher mes favoris";
        afficherMotsFiltres();
    });

    // ============================================
    // MENU DES DOMAINES
    // ============================================
    function genererFiltresDomaines() {
        if (!menuFiltres || !btnPrincipal || !labelActuel) return;

        menuFiltres.innerHTML = "";

        const compteurDomaines = {};
        tousLesMots.forEach(function (mot) {
            compteurDomaines[mot.domaine] = (compteurDomaines[mot.domaine] || 0) + 1;
        });

        menuFiltres.appendChild(creerItemDomaine("tous", "Tous les domaines", tousLesMots.length));

        const sep = document.createElement("div");
        sep.className = "separateur-menu";
        menuFiltres.appendChild(sep);

        const domainesUniques = [...new Set(tousLesMots.map(m => m.domaine))];
        domainesUniques.sort((a, b) => a.localeCompare(b));

        domainesUniques.forEach(function (domaine) {
            menuFiltres.appendChild(creerItemDomaine(domaine, domaine, compteurDomaines[domaine]));
        });
    }

    function creerItemDomaine(valeur, label, nombre) {
        const item = document.createElement("button");
        item.className = "item-domaine";
        item.dataset.domaine = valeur;

        if (valeur === filtreActif) item.classList.add("actif");

        item.innerHTML = `
            <span>${escapeHtml(label)}</span>
            <span class="compteur-domaine">${nombre}</span>
        `;

        item.addEventListener("click", function (e) {
            e.stopPropagation();
            filtreActif = valeur;
            labelActuel.textContent = valeur === "tous" ? "(Tous)" : `(${label})`;
            menuFiltres.querySelectorAll(".item-domaine").forEach(i => i.classList.remove("actif"));
            item.classList.add("actif");
            menuFiltres.classList.add("cache");
            afficherMotsFiltres();
        });

        return item;
    }

    // ============================================
    // OUVERTURE / FERMETURE DU MENU
    // ============================================
    if (btnPrincipal && menuFiltres) {
        btnPrincipal.addEventListener("click", function (e) {
            e.stopPropagation();
            menuFiltres.classList.toggle("cache");
        });

        document.addEventListener("click", function () {
            menuFiltres.classList.add("cache");
        });

        menuFiltres.addEventListener("click", function (e) {
            e.stopPropagation();
        });
    }

    // ============================================
    // FILTRAGE
    // ============================================
    function afficherMotsFiltres() {
        const resultats = tousLesMots.filter(function (unMot) {
            const correspondDomaine = filtreActif === "tous" || unMot.domaine === filtreActif;
            const correspondNiveau = filtreNiveauActif === "tous" || unMot.niveau === filtreNiveauActif;
            const correspondTexte =
                unMot.mot.toLowerCase().includes(texteRecherche) ||
                unMot.definition.toLowerCase().includes(texteRecherche);
            const correspondFavoris = !filtreFavorisActif || estFavori(unMot.mot);

            return correspondDomaine && correspondNiveau && correspondTexte && correspondFavoris;
        });

        resultats.sort((a, b) => a.mot.localeCompare(b.mot, "fr", { sensitivity: "base" }));

        afficherMots(resultats);
    }

    // ============================================
    // AFFICHAGE DES CARTES
    // ============================================
    function afficherMots(mots) {
        listeMots.innerHTML = "";

        if (compteur) compteur.classList.add("cache");

        if (mots.length === 0) {
            listeMots.innerHTML = "<p>Aucun mot trouvé 😕</p>";
            return;
        }

        // Lire une seule fois la liste de révision
        const revisionSet = new Set(getListeRevision().map(item => item.mot));

        const fragment = document.createDocumentFragment();

        mots.forEach(function (unMot) {
            const carte = document.createElement("div");
            carte.className = "carte-mot";

            const favori = motsFavoris.includes(unMot.mot);
            const dansRevision = revisionSet.has(unMot.mot);
            const niveau = unMot.niveau || "Débutant";

            carte.innerHTML = `
                <div class="carte-entete">
                    <h3>${escapeHtml(unMot.mot)}</h3>
                    <button class="btn-favori-carte ${favori ? "est-favori" : ""}"
                            title="${favori ? "Retirer des favoris" : "Ajouter aux favoris"}">
                        ${favori ? "⭐" : "☆"}
                    </button>
                </div>
                <p>${escapeHtml(unMot.definition)}</p>
                <div class="carte-footer">
                    <span class="domaine">${escapeHtml(unMot.domaine)}</span>
                    <span class="niveau niveau-${niveau.toLowerCase()}">${escapeHtml(niveau)}</span>
                </div>
                <button class="btn-reviser ${dansRevision ? "est-dans-liste" : ""}">
                    📖 ${dansRevision ? "Dans ma révision" : "Réviser ce mot"}
                </button>
            `;

            carte.querySelector(".btn-favori-carte").addEventListener("click", function (e) {
                e.stopPropagation();
                toggleFavori(unMot.mot);
                afficherMotsFiltres();
            });

            carte.querySelector(".btn-reviser").addEventListener("click", function (e) {
                e.stopPropagation();
                if (estDansListeRevision(unMot.mot)) {
                    retirerMotRevision(unMot.mot);
                } else {
                    ajouterMotRevision(unMot.mot);
                }
                afficherMotsFiltres();
            });

            fragment.appendChild(carte);
        });

        listeMots.appendChild(fragment);
    }

}); // fin du DOMContentLoaded

// ============================================
// UTILITAIRE : ÉCHAPPER LE HTML
// ============================================
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}