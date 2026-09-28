// ============================================
// PAGE AMIS - GESTION DES AMITIÉS
// ============================================



document.addEventListener("DOMContentLoaded", function() {
    
    // ===== VÉRIFIER CONNEXION =====
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    
    const ecranNonConnecte = document.getElementById("ecran-non-connecte");
    const ecranPrincipal = document.getElementById("ecran-principal");
    
    if (!token || !user) {
        ecranNonConnecte.classList.remove("cache");
        return;
    }
    
    ecranPrincipal.classList.remove("cache");
    
    // ===== HEADERS POUR L'API =====
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
    
    // ===== RÉFÉRENCES DOM =====
    const listeAmis = document.getElementById("liste-amis");
    const listeDemandesRecues = document.getElementById("liste-demandes-recues");
    const listeDemandesEnvoyees = document.getElementById("liste-demandes-envoyees");
    const compteurAmis = document.getElementById("compteur-amis");
    const compteurDemandes = document.getElementById("compteur-demandes");
    
    // ===== ONGLETS =====
    const onglets = document.querySelectorAll(".amis-onglet");
    onglets.forEach(onglet => {
        onglet.addEventListener("click", function() {
            const cible = onglet.dataset.onglet;
            
            onglets.forEach(o => o.classList.remove("actif"));
            onglet.classList.add("actif");
            
            document.querySelectorAll(".amis-onglet-contenu").forEach(c => c.classList.add("cache"));
            document.getElementById(`onglet-${cible}`).classList.remove("cache");
        });
    });
    
    // ===== FONCTIONS DE CHARGEMENT =====
    async function chargerMesAmis() {
        try {
            const reponse = await fetch(`${API_URL}/amis`, { headers });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            compteurAmis.textContent = data.count;
            
            if (data.count === 0) {
                listeAmis.innerHTML = `
                    <div class="etat-vide">
                        <span class="etat-vide-icone">👥</span>
                        Tu n'as pas encore d'amis.<br>
                        Va dans l'onglet <strong>Découvrir</strong> pour en trouver !
                    </div>
                `;
                return;
            }
            
            listeAmis.innerHTML = "";
            data.data.forEach(ami => {
                listeAmis.appendChild(creerCarteUtilisateur(ami, "ami"));
            });
        } catch (erreur) {
            console.error("Erreur chargement amis:", erreur);
            listeAmis.innerHTML = `<div class="etat-vide">Erreur de chargement</div>`;
        }
    }
    
    async function chargerDemandesRecues() {
        try {
            const reponse = await fetch(`${API_URL}/amis/demandes`, { headers });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            compteurDemandes.textContent = data.count;
            
            if (data.count === 0) {
                listeDemandesRecues.innerHTML = `
                    <div class="etat-vide">
                        <span class="etat-vide-icone">📭</span>
                        Aucune demande en attente
                    </div>
                `;
                return;
            }
            
            listeDemandesRecues.innerHTML = "";
            data.data.forEach(demande => {
                listeDemandesRecues.appendChild(creerCarteUtilisateur(
                    { id: demande.user_id, username: demande.username, email: demande.email, amitie_id: demande.amitie_id },
                    "demande-recue"
                ));
            });
        } catch (erreur) {
            console.error("Erreur chargement demandes:", erreur);
        }
    }
    
    async function chargerDemandesEnvoyees() {
        try {
            const reponse = await fetch(`${API_URL}/amis/envoyees`, { headers });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            if (data.count === 0) {
                listeDemandesEnvoyees.innerHTML = `
                    <div class="etat-vide">
                        <span class="etat-vide-icone">📭</span>
                        Aucune demande envoyée en attente
                    </div>
                `;
                return;
            }
            
            listeDemandesEnvoyees.innerHTML = "";
            data.data.forEach(demande => {
                listeDemandesEnvoyees.appendChild(creerCarteUtilisateur(
                    { id: demande.user_id, username: demande.username, amitie_id: demande.amitie_id },
                    "demande-envoyee"
                ));
            });
        } catch (erreur) {
            console.error("Erreur chargement demandes envoyées:", erreur);
        }
    }
        // ===== CHARGER LES UTILISATEURS (Découvrir) =====
    async function chargerUtilisateurs(recherche = "") {
        try {
            const url = recherche 
                ? `${API_URL}/utilisateurs/recherche/${encodeURIComponent(recherche)}`
                : `${API_URL}/utilisateurs`;
            
            const reponse = await fetch(url, { headers });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            if (data.count === 0) {
                listeUtilisateurs.innerHTML = `
                    <div class="etat-vide">
                        <span class="etat-vide-icone">🔍</span>
                        ${recherche ? "Aucun utilisateur trouvé" : "Aucun autre utilisateur inscrit"}
                    </div>
                `;
                return;
            }
            
            listeUtilisateurs.innerHTML = "";
            data.data.forEach(u => {
                listeUtilisateurs.appendChild(creerCarteUtilisateur(u, "decouvrir"));
            });
        } catch (erreur) {
            console.error("Erreur chargement utilisateurs:", erreur);
            listeUtilisateurs.innerHTML = `<div class="etat-vide">Erreur de chargement</div>`;
        }
    }

    // ===== CRÉATION DE CARTE UTILISATEUR =====
    function creerCarteUtilisateur(u, type) {
        const carte = document.createElement("div");
        carte.className = "carte-utilisateur";
        
        const initiale = u.username.charAt(0).toUpperCase();
        
        let actionsHTML = "";
        
               if (type === "ami") {
            actionsHTML = `
                <button class="btn-action btn-message" data-action="message" data-user="${u.id}" data-username="${u.username}">
                    💬 Message
                </button>
                <button class="btn-action btn-retirer" data-action="retirer" data-amitie="${u.amitie_id}">
                    🗑️ Retirer
                </button>
            `;
        } else if (type === "demande-recue") {
            actionsHTML = `
                <button class="btn-action btn-accepter" data-action="accepter" data-amitie="${u.amitie_id}">
                    ✅ Accepter
                </button>
                <button class="btn-action btn-refuser" data-action="refuser" data-amitie="${u.amitie_id}">
                    ❌ Refuser
                </button>
            `;
                } else if (type === "demande-envoyee") {
            actionsHTML = `
                <button class="btn-action btn-en-attente" disabled>
                    ⏳ En attente
                </button>
            `;
        } else if (type === "decouvrir") {
            // Selon le statut d'amitié
            if (u.statutAmitie === "acceptee") {
                actionsHTML = `
                    <button class="btn-action btn-en-attente" disabled>
                        ✅ Déjà amis
                    </button>
                `;
            } else if (u.statutAmitie === "en_attente") {
                if (u.envoyeParMoi) {
                    actionsHTML = `
                        <button class="btn-action btn-en-attente" disabled>
                            ⏳ En attente
                        </button>
                    `;
                } else {
                    actionsHTML = `
                        <button class="btn-action btn-accepter" data-action="accepter-decouverte" data-amitie="${u.amitieId}">
                            ✅ Accepter
                        </button>
                        <button class="btn-action btn-refuser" data-action="refuser-decouverte" data-amitie="${u.amitieId}">
                            ❌ Refuser
                        </button>
                    `;
                }
            } else {
                actionsHTML = `
                    <button class="btn-action btn-ajouter" data-action="ajouter" data-user="${u.id}">
                        ➕ Ajouter
                    </button>
                `;
            }
        }
        
               carte.innerHTML = `
            <div class="carte-utilisateur-entete">
                <a href="profil-public.html?id=${u.id}" class="avatar-utilisateur" style="text-decoration:none;">${initiale}</a>
                <div>
                    <a href="profil-public.html?id=${u.id}" class="carte-utilisateur-nom" style="text-decoration:none;color:inherit;">${u.username}</a>
                    ${u.email ? `<div class="carte-utilisateur-email">${u.email}</div>` : ""}
                </div>
            </div>
        `;
        
                   // Écouteurs sur les boutons
        carte.querySelectorAll("[data-action]").forEach(btn => {
            btn.addEventListener("click", () => {
                const action = btn.dataset.action;
                const amitieId = btn.dataset.amitie;
                const userId = btn.dataset.user;
                const username = btn.dataset.username;
                
                if (action === "retirer") retirerAmi(amitieId);
                if (action === "accepter") accepterDemande(amitieId);
                if (action === "refuser") refuserDemande(amitieId);
                if (action === "ajouter") envoyerDemande(userId);
                if (action === "accepter-decouverte") accepterDemande(amitieId);
                if (action === "refuser-decouverte") refuserDemande(amitieId);
                if (action === "message") ouvrirMessagerie(userId, username);
            });
        });
        
        return carte;
    }
    
    // ===== ACTIONS =====
    async function retirerAmi(amitieId) {
        if (!confirm("Retirer cet ami ?")) return;
        
        try {
            const reponse = await fetch(`${API_URL}/amis/${amitieId}`, {
                method: "DELETE",
                headers
            });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            chargerMesAmis();
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        }
    }
    
    async function accepterDemande(amitieId) {
        try {
            const reponse = await fetch(`${API_URL}/amis/accepter/${amitieId}`, {
                method: "POST",
                headers
            });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            chargerDemandesRecues();
            chargerMesAmis();
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        }
    }
    
    async function refuserDemande(amitieId) {
        if (!confirm("Refuser cette demande ?")) return;
        
        try {
            const reponse = await fetch(`${API_URL}/amis/refuser/${amitieId}`, {
                method: "POST",
                headers
            });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            chargerDemandesRecues();
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        }
    }

        async function envoyerDemande(userId) {
        try {
            const reponse = await fetch(`${API_URL}/amis/demande/${userId}`, {
                method: "POST",
                headers
            });
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            // Recharger la liste des utilisateurs
            chargerUtilisateurs(document.getElementById("recherche-utilisateur").value);
            // Recharger les demandes envoyées
            chargerDemandesEnvoyees();
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        }
    }
        function ouvrirMessagerie(userId, username) {
        // Rediriger vers messages.html avec les paramètres
        window.location.href = `messages.html?user=${userId}&username=${encodeURIComponent(username)}`;
    }
        // ===== RÉFÉRENCES POUR DÉCOUVRIR =====
    const listeUtilisateurs = document.getElementById("liste-utilisateurs");
    const rechercheUtilisateur = document.getElementById("recherche-utilisateur");
    
    // ===== RECHERCHE =====
    let timeoutRecherche = null;
    rechercheUtilisateur.addEventListener("input", function() {
        const texte = rechercheUtilisateur.value.trim();
        
        // Debounce : attendre 300ms après la dernière frappe
        clearTimeout(timeoutRecherche);
        timeoutRecherche = setTimeout(() => {
            chargerUtilisateurs(texte);
        }, 300);
    });
    
    // ===== CHARGEMENT INITIAL =====
    chargerMesAmis();
    chargerDemandesRecues();
    chargerDemandesEnvoyees();
    chargerUtilisateurs();
    
    console.log("✅ Page amis initialisée pour", user.username);
});