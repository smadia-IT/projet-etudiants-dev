// ============================================
// PAGE DICTIONNAIRE — VERSION RAPIDE
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

    // ===== RÉGLAGES =====
    const TAILLE_PAGE = 40;
    const comparerMots = new Intl.Collator("fr", { sensitivity: "base" });

    // ===== ÉTAT =====
    let tousLesMots = [];
    let motsFiltres = [];
    let nbAffiches = TAILLE_PAGE;
    let filtreActif = "tous";
    let filtreNiveauActif = "tous";
    let filtreFavorisActif = false;
    let motsFavoris = [];
    let texteRecherche = "";
    let timeoutRecherche = null;

    // ===== FAVORIS =====
    function chargerFavoris() {
        try {
            motsFavoris = JSON.parse(localStorage.getItem("motsFavoris") || "[]");
        } catch (erreur) {
            motsFavoris = [];
        }
    }

    function sauvegarderFavoris() {
        localStorage.setItem("motsFavoris", JSON.stringify(motsFavoris));
    }

    function majCompteurFavoris() {
        const nb = motsFavoris.length;
        compteurFavoris.textContent = `${nb} favori${nb > 1 ? "s" : ""}`;
    }

    function toggleFavori(mot) {
        if (motsFavoris.includes(mot)) {
            motsFavoris = motsFavoris.filter(m => m !== mot);
        } else {
            motsFavoris.push(mot);
        }
        sauvegarderFavoris();
        majCompteurFavoris();
    }

    chargerFavoris();
    majCompteurFavoris();

    // ===== CHARGEMENT DES DONNÉES =====
    fetch("data/dictionnaire.json")
        .then(reponse => reponse.json())
        .then(mots => {
            tousLesMots = mots;
            genererFiltresDomaines();
            filtrer();
        })
        .catch(erreur => {
            console.error("Erreur chargement dictionnaire :", erreur);
            listeMots.innerHTML = "<p class='etat-vide'>Impossible de charger le dictionnaire 😕</p>";
        });

    // ===== RECHERCHE (avec délai) =====
    champRecherche.addEventListener("input", function () {
        clearTimeout(timeoutRecherche);
        timeoutRecherche = setTimeout(function () {
            texteRecherche = champRecherche.value.trim().toLowerCase();
            filtrer();
        }, 200);
    });

    // ===== FILTRES PAR NIVEAU =====
    boutonsNiveau.forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            boutonsNiveau.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            filtreNiveauActif = bouton.dataset.niveau;
            filtrer();
        });
    });

    // ===== FILTRE FAVORIS =====
    btnFavoris.addEventListener("click", function () {
        filtreFavorisActif = !filtreFavorisActif;
        btnFavoris.classList.toggle("actif", filtreFavorisActif);
        btnFavoris.textContent = filtreFavorisActif
            ? "⭐ Afficher tout"
            : "☆ Afficher mes favoris";
        filtrer();
    });

    // ===== MENU DES DOMAINES =====
    function genererFiltresDomaines() {
        if (!menuFiltres || !btnPrincipal || !labelActuel) return;

        menuFiltres.innerHTML = "";

        const compteurDomaines = {};
        tousLesMots.forEach(function (mot) {
            compteurDomaines[mot.domaine] = (compteurDomaines[mot.domaine] || 0) + 1;
        });

        menuFiltres.appendChild(creerItemDomaine("tous", "Tous les domaines", tousLesMots.length));

        const separateur = document.createElement("div");
        separateur.className = "separateur-menu";
        menuFiltres.appendChild(separateur);

        const domaines = [...new Set(tousLesMots.map(m => m.domaine))]
            .sort((a, b) => comparerMots.compare(a, b));

        domaines.forEach(function (domaine) {
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
            filtrer();
        });

        return item;
    }

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

    // ===== FILTRER ET TRIER =====
    function filtrer() {
        motsFiltres = tousLesMots.filter(function (unMot) {
            const correspondDomaine = filtreActif === "tous" || unMot.domaine === filtreActif;
            const correspondNiveau = filtreNiveauActif === "tous" || unMot.niveau === filtreNiveauActif;
            const correspondTexte = texteRecherche === "" ||
                unMot.mot.toLowerCase().includes(texteRecherche) ||
                unMot.definition.toLowerCase().includes(texteRecherche);
            const correspondFavoris = !filtreFavorisActif || motsFavoris.includes(unMot.mot);

            return correspondDomaine && correspondNiveau && correspondTexte && correspondFavoris;
        });

        motsFiltres.sort((a, b) => comparerMots.compare(a.mot, b.mot));

        // Nouvelle recherche : on repart de la première page
        nbAffiches = TAILLE_PAGE;
        afficherListe();
    }

    // ===== AFFICHAGE PAR PAGES =====
    function afficherListe() {
        listeMots.innerHTML = "";

        if (compteur) compteur.classList.add("cache");

        if (motsFiltres.length === 0) {
            listeMots.innerHTML = "<p class='etat-vide'>Aucun mot trouvé 😕</p>";
            return;
        }

        const revisionSet = new Set(getListeRevision().map(item => item.mot));
        const fragment = document.createDocumentFragment();

        motsFiltres.slice(0, nbAffiches).forEach(function (unMot) {
            fragment.appendChild(creerCarte(unMot, revisionSet));
        });

        listeMots.appendChild(fragment);

        const restants = motsFiltres.length - nbAffiches;
        if (restants > 0) {
            const bouton = document.createElement("button");
            bouton.id = "btn-voir-plus";
            bouton.className = "btn-voir-plus";
            bouton.textContent = `Voir plus de mots (${restants} restant${restants > 1 ? "s" : ""})`;
            listeMots.appendChild(bouton);
        }
    }

    function creerCarte(unMot, revisionSet) {
        const carte = document.createElement("div");
        carte.className = "carte-mot";
        carte.dataset.mot = unMot.mot;
        carte.dataset.domaine = normaliserDomaine(unMot.domaine);

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

        return carte;
    }

    // ===== UN SEUL ÉCOUTEUR POUR TOUTE LA LISTE =====
    listeMots.addEventListener("click", function (e) {

        // Bouton « Voir plus »
        if (e.target.closest("#btn-voir-plus")) {
            nbAffiches += TAILLE_PAGE;
            afficherListe();
            return;
        }

        const carte = e.target.closest(".carte-mot");
        if (!carte) return;

        const mot = carte.dataset.mot;

        // Favori
        if (e.target.closest(".btn-favori-carte")) {
            toggleFavori(mot);
            if (filtreFavorisActif) {
                filtrer();
            } else {
                afficherListe();
            }
            return;
        }

        // Réviser
        if (e.target.closest(".btn-reviser")) {
            if (estDansListeRevision(mot)) {
                retirerMotRevision(mot);
            } else {
                ajouterMotRevision(mot);
            }
            afficherListe();
        }
    });

});

// ============================================
// UTILITAIRES (hors DOMContentLoaded)
// ============================================
function escapeHtml(texte) {
    const div = document.createElement("div");
    div.textContent = texte ?? "";
    return div.innerHTML;
}

function normaliserDomaine(texte) {
    return (texte || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
}