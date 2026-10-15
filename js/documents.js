document.addEventListener("DOMContentLoaded", function () {

    // ===== RÉFÉRENCES DOM =====
    const listeDocuments = document.getElementById("liste-documents");
    const compteurDoc = document.getElementById("compteur-doc");
    const champRecherche = document.getElementById("recherche-doc");
    const boutonsType = document.querySelectorAll(".btn-filtre-type");
    const boutonsDomaine = document.querySelectorAll(".btn-filtre-doc");
    const selectTri = document.getElementById("tri-doc");
    const sectionTelechargements = document.getElementById("mes-telechargements");
    const listeTelechargements = document.getElementById("liste-telechargements");

    // ===== ÉTAT =====
    let tousLesDocuments = [];
    let filtreType = "tous";
    let filtreDomaine = "tous";
    let texteRecherche = "";
    let tri = "nom";

    const JOURS_NOUVEAU = 30;

    // ===== OUTILS =====

    // Protège le texte affiché contre l'injection de HTML
    function echapper(texte) {
        const div = document.createElement("div");
        div.textContent = texte ?? "";
        return div.innerHTML;
    }

    // Lit le localStorage sans planter si la donnée est corrompue
    function lireStorage(cle, valeurParDefaut) {
        try {
            const valeur = JSON.parse(localStorage.getItem(cle));
            return valeur ?? valeurParDefaut;
        } catch (erreur) {
            return valeurParDefaut;
        }
    }

    // "Résumé" devient "resume" (correspond aux classes CSS)
    function classeType(type) {
        return type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function estRecent(dateTexte) {
        const jours = (Date.now() - new Date(dateTexte)) / (1000 * 60 * 60 * 24);
        return jours <= JOURS_NOUVEAU;
    }

    function formaterDate(dateTexte) {
        return new Date(dateTexte).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function getNbTelechargements(titre) {
        return lireStorage("compteursTelechargements", {})[titre] || 0;
    }
        // Masquer les outils de recherche tant qu'il n'y a aucun document
    function masquerOutilsSiVide(estVide) {
        document.querySelectorAll("#recherche-doc, #filtres-type, #filtres-docs, .barre-tri")
            .forEach(el => el.classList.toggle("cache", estVide));
    }

    // ===== CHARGEMENT =====

    fetch("data/documents.json")
        .then(function (reponse) {
            if (!reponse.ok) throw new Error("HTTP " + reponse.status);
            return reponse.json();
        })
              .then(function (docs) {
            tousLesDocuments = docs || [];
                        masquerOutilsSiVide(tousLesDocuments.length === 0);

            // Aucun document pour l'instant : on garde le message du HTML
            if (tousLesDocuments.length === 0) {
                afficherTelechargements();
                return;
            }

            afficherDocuments();
            afficherTelechargements();
        })
        .catch(function (erreur) {
            console.error("Erreur documents :", erreur);
            listeDocuments.innerHTML =
                "<p class='etat-vide'>Impossible de charger les documents 😕 Réessaie plus tard.</p>";
        });

    // ===== ÉCOUTEURS =====
    champRecherche.addEventListener("input", function () {
        texteRecherche = champRecherche.value.trim().toLowerCase();
        afficherDocuments();
    });

    boutonsType.forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            boutonsType.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            filtreType = bouton.dataset.type;
            afficherDocuments();
        });
    });

    boutonsDomaine.forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            boutonsDomaine.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            filtreDomaine = bouton.dataset.domaine;
            afficherDocuments();
        });
    });

    selectTri.addEventListener("change", function () {
        tri = selectTri.value;
        afficherDocuments();
    });

    // ===== FILTRER ET TRIER =====
    function documentsFiltres() {
        const resultats = tousLesDocuments.filter(function (doc) {
            const correspondType = filtreType === "tous" || doc.type === filtreType;
            const correspondDomaine = filtreDomaine === "tous" || doc.domaine === filtreDomaine;
            const correspondTexte =
                texteRecherche === "" ||
                doc.titre.toLowerCase().includes(texteRecherche) ||
                doc.description.toLowerCase().includes(texteRecherche) ||
                doc.domaine.toLowerCase().includes(texteRecherche);
            return correspondType && correspondDomaine && correspondTexte;
        });

        resultats.sort(function (a, b) {
            if (tri === "popularite") return getNbTelechargements(b.titre) - getNbTelechargements(a.titre);
            if (tri === "date") return new Date(b.date) - new Date(a.date);
            return a.titre.localeCompare(b.titre, "fr");
        });

        return resultats;
    }

    function reinitialiserFiltres() {
        filtreType = "tous";
        filtreDomaine = "tous";
        texteRecherche = "";
        champRecherche.value = "";
        boutonsType.forEach(b => b.classList.toggle("actif", b.dataset.type === "tous"));
        boutonsDomaine.forEach(b => b.classList.toggle("actif", b.dataset.domaine === "tous"));
        afficherDocuments();
    }

    // ===== AFFICHAGE DES DOCUMENTS =====
    function afficherDocuments() {
        const resultats = documentsFiltres();
        compteurDoc.textContent = resultats.length + " document(s) affiché(s)";
        listeDocuments.innerHTML = "";

        if (resultats.length === 0) {
            listeDocuments.innerHTML = `
                <div class="etat-vide">
                    <span class="etat-vide-icone">😕</span>
                    <p>Aucun document ne correspond à ta recherche.</p>
                    <button class="btn-reinit" id="btn-reinit">Tout afficher</button>
                </div>`;
            document.getElementById("btn-reinit").addEventListener("click", reinitialiserFiltres);
            return;
        }

        resultats.forEach(function (doc) {
            listeDocuments.appendChild(creerCarte(doc));
        });
    }

    function creerCarte(doc) {
        const carte = document.createElement("article");
        carte.className = "carte-doc";

        carte.innerHTML = `
            <div class="carte-doc-entete">
                <span class="type-badge ${classeType(doc.type)}">${echapper(doc.type)}</span>
                ${estRecent(doc.date) ? '<span class="badge-nouveau">Nouveau</span>' : ""}
            </div>
            <h3>📄 ${echapper(doc.titre)}</h3>
            <p>${echapper(doc.description)}</p>
            <div class="info-doc">
                <span class="domaine-doc">${echapper(doc.domaine)}</span>
                <span>${echapper(doc.taille)}</span>
            </div>
            <div class="info-doc">
                <span>📅 ${formaterDate(doc.date)}</span>
                <span class="nb-telechargements">📥 ${getNbTelechargements(doc.titre)}</span>
            </div>
            <a href="${encodeURI(doc.fichier)}" download class="btn-telecharger">⬇️ Télécharger</a>
        `;

        carte.querySelector(".btn-telecharger").addEventListener("click", function () {
            enregistrerTelechargement(doc);
        });

        return carte;
    }

    // ===== TÉLÉCHARGEMENTS =====
    function enregistrerTelechargement(doc) {
        // Historique : les 5 derniers, sans doublon
        const historique = lireStorage("telechargements", []).filter(t => t.titre !== doc.titre);
        historique.unshift({ titre: doc.titre, date: new Date().toISOString() });
        localStorage.setItem("telechargements", JSON.stringify(historique.slice(0, 5)));

        // Compteur par document
        const compteurs = lireStorage("compteursTelechargements", {});
        compteurs[doc.titre] = (compteurs[doc.titre] || 0) + 1;
        localStorage.setItem("compteursTelechargements", JSON.stringify(compteurs));

        // On attend un instant avant de redessiner : le téléchargement doit démarrer d'abord
        setTimeout(function () {
            afficherTelechargements();
            afficherDocuments();
        }, 100);
    }

    function afficherTelechargements() {
        const historique = lireStorage("telechargements", []);

        if (historique.length === 0) {
            sectionTelechargements.classList.add("cache");
            return;
        }

        sectionTelechargements.classList.remove("cache");
        listeTelechargements.innerHTML = historique.map(function (t) {
            return `
                <div class="telechargement-item">
                    <span class="telechargement-nom">📄 ${echapper(t.titre)}</span>
                    <span class="telechargement-date">${formaterDate(t.date)}</span>
                </div>`;
        }).join("");
    }

});