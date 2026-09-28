// ============================================
// PAGE FORUM
// ============================================



document.addEventListener("DOMContentLoaded", function() {
    
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    
    // ===== RÉFÉRENCES DOM =====
    const btnNouveauSujet = document.getElementById("btn-nouveau-sujet");
    const modaleNouveauSujet = document.getElementById("modale-nouveau-sujet");
    const btnFermerModale = document.getElementById("btn-fermer-modale-sujet");
    const btnAnnulerSujet = document.getElementById("btn-annuler-sujet");
    const formNouveauSujet = document.getElementById("form-nouveau-sujet");
    
    const listeSujets = document.getElementById("liste-sujets");
    const rechercheForum = document.getElementById("recherche-forum");
    const filtresForum = document.querySelectorAll(".btn-filtre-forum");
    
    const statPosts = document.getElementById("stat-posts");
    const statCommentaires = document.getElementById("stat-commentaires");
    const statMembres = document.getElementById("stat-membres");
    
    // ===== ÉTAT =====
    let domaineActif = "tous";
    let texteRecherche = "";
    let timeoutRecherche = null;
    
    // ===== AFFICHER LE BOUTON SI CONNECTÉ =====
    if (token && user) {
        btnNouveauSujet.classList.remove("cache");
    }
    
    // ===== CHARGER LES STATS =====
    async function chargerStats() {
        try {
            const reponse = await fetch(`${API_URL}/forum/stats`);
            const data = await reponse.json();
            if (!data.success) return;
            
            statPosts.textContent = data.data.nb_posts;
            statCommentaires.textContent = data.data.nb_commentaires;
            statMembres.textContent = data.data.nb_utilisateurs;
        } catch (erreur) {
            console.error("Erreur stats:", erreur);
        }
    }
    
    // ===== CHARGER LES SUJETS =====
    async function chargerSujets() {
        try {
            let url = `${API_URL}/forum/posts`;
            const params = new URLSearchParams();
            
            if (domaineActif !== "tous") params.append("domaine", domaineActif);
            if (texteRecherche) params.append("recherche", texteRecherche);
            
            if (params.toString()) url += "?" + params.toString();
            
            const reponse = await fetch(url);
            const data = await reponse.json();
            
            if (!data.success) throw new Error(data.error);
            
            if (data.count === 0) {
                listeSujets.innerHTML = `
                    <div class="forum-vide">
                        <span class="forum-vide-icone">📝</span>
                        <p>Aucun sujet pour l'instant.</p>
                        ${token && user ? `<p>Sois le premier à en créer un !</p>` : `<p>Connecte-toi pour en créer un.</p>`}
                    </div>
                `;
                return;
            }
            
            listeSujets.innerHTML = "";
            data.data.forEach(post => {
                listeSujets.appendChild(creerCarteSujet(post));
            });
        } catch (erreur) {
            console.error("Erreur chargement sujets:", erreur);
            listeSujets.innerHTML = `<div class="forum-vide">Erreur de chargement</div>`;
        }
    }
    
    // ===== CRÉER UNE CARTE DE SUJET =====
    function creerCarteSujet(post) {
        const carte = document.createElement("a");
        carte.className = "carte-sujet";
        carte.href = `sujet.html?id=${post.id}`;
        
        const date = new Date(post.date);
        const dateStr = date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
        
        carte.innerHTML = `
            <div class="sujet-entete">
                <h3 class="sujet-titre">${escapeHtml(post.titre)}</h3>
                <span class="sujet-domaine">${escapeHtml(post.domaine)}</span>
            </div>
            <p class="sujet-apercu">${escapeHtml(post.apercu)}</p>
            <div class="sujet-meta">
                <span class="sujet-meta-item">👤 ${escapeHtml(post.username)}</span>
                <span class="sujet-meta-item">📅 ${dateStr}</span>
                <span class="sujet-meta-item">💬 ${post.nb_commentaires} réponse(s)</span>
            </div>
        `;
        
        return carte;
    }
    
    // ===== ÉCOUTEURS : FILTRES =====
    filtresForum.forEach(btn => {
        btn.addEventListener("click", function() {
            filtresForum.forEach(b => b.classList.remove("actif"));
            btn.classList.add("actif");
            domaineActif = btn.dataset.domaine;
            chargerSujets();
        });
    });
    
    // ===== ÉCOUTEURS : RECHERCHE =====
    rechercheForum.addEventListener("input", function() {
        texteRecherche = rechercheForum.value.trim();
        
        clearTimeout(timeoutRecherche);
        timeoutRecherche = setTimeout(() => {
            chargerSujets();
        }, 300);
    });
    
    // ===== MODALE NOUVEAU SUJET =====
    btnNouveauSujet.addEventListener("click", function() {
        modaleNouveauSujet.classList.remove("cache");
        document.getElementById("sujet-titre").focus();
    });
    
    btnFermerModale.addEventListener("click", fermerModale);
    btnAnnulerSujet.addEventListener("click", fermerModale);
    
    modaleNouveauSujet.addEventListener("click", function(e) {
        if (e.target === modaleNouveauSujet) fermerModale();
    });
    
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && !modaleNouveauSujet.classList.contains("cache")) {
            fermerModale();
        }
    });
    
    function fermerModale() {
        modaleNouveauSujet.classList.add("cache");
        formNouveauSujet.reset();
    }
    
    // ===== CRÉATION D'UN SUJET =====
    formNouveauSujet.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const titre = document.getElementById("sujet-titre").value.trim();
        const domaine = document.getElementById("sujet-domaine").value;
        const contenu = document.getElementById("sujet-contenu").value.trim();
        
        const btnSubmit = formNouveauSujet.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "⏳ Publication...";
        
        try {
            const reponse = await fetch(`${API_URL}/forum/posts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ titre, contenu, domaine })
            });
            
            const data = await reponse.json();
            if (!data.success) throw new Error(data.error);
            
            fermerModale();
            chargerSujets();
            chargerStats();
            
            // Rediriger vers le sujet créé
            setTimeout(() => {
                window.location.href = `sujet.html?id=${data.data.id}`;
            }, 500);
            
        } catch (erreur) {
            alert("Erreur : " + erreur.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "📝 Publier";
        }
    });
    
    // ===== UTILITAIRE : ESCAPER HTML =====
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ===== CHARGEMENT INITIAL =====
    chargerStats();
    chargerSujets();
    
    console.log("✅ Page forum initialisée");
});