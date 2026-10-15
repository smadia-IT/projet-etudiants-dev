// ============================================
// NAVIGATION D'APPLICATION (mobile)
// Barre du bas + menu latéral « Plus »
// ============================================
(function () {
    if (window.__appNavChargee) return;
    window.__appNavChargee = true;

    const PAGE = window.location.pathname.split("/").pop() || "index.html";

    const ONGLETS = [
        { href: "index.html", icone: "🏠", label: "Accueil" },
        { href: "dictionnaire.html", icone: "📖", label: "Dictionnaire" },
        { href: "quiz.html", icone: "🎮", label: "Quiz" },
        { href: "messages.html", icone: "💬", label: "Messages" }
    ];

    const MENU = [
        {
            titre: "Mon espace",
            liens: [
                { href: "profil.html", icone: "👤", label: "Mon profil" },
                { href: "badges.html", icone: "🏆", label: "Badges" },
                { href: "revision.html", icone: "📚", label: "Révision" }
            ]
        },
        {
            titre: "Communauté",
            liens: [
                { href: "amis.html", icone: "👥", label: "Amis" },
                { href: "forum.html", icone: "📝", label: "Forum" }
            ]
        },
        {
            titre: "Outils",
            liens: [
                { href: "chat.html", icone: "🤖", label: "Assistant IA" },
                { href: "documents.html", icone: "📄", label: "Documents" }
            ]
        }
    ];

    const estPageDuMenu = MENU.some(s => s.liens.some(l => l.href === PAGE));
    let overlay = null;
    let tiroir = null;

    function estActif(href) {
        return href === PAGE;
    }

    function lireUtilisateur() {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch (erreur) {
            return null;
        }
    }

    // ----- Barre du bas -----
    function creerNavBas() {
        const nav = document.createElement("nav");
        nav.className = "app-nav-bas";
        nav.setAttribute("aria-label", "Navigation principale");

        ONGLETS.forEach(function (onglet) {
            const lien = document.createElement("a");
            lien.href = onglet.href;
            lien.className = "app-nav-item" + (estActif(onglet.href) ? " actif" : "");
            lien.innerHTML = `<span class="app-nav-icone">${onglet.icone}</span><span>${onglet.label}</span>`;
            nav.appendChild(lien);
        });

        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "app-nav-item" + (estPageDuMenu ? " actif" : "");
        bouton.innerHTML = `<span class="app-nav-icone">☰</span><span>Plus</span>`;
        bouton.addEventListener("click", ouvrirMenu);
        nav.appendChild(bouton);

        document.body.appendChild(nav);
    }

    // ----- Menu latéral -----
    function creerLienMenu(icone, label, href, action) {
        const el = document.createElement(href ? "a" : "button");
        if (href) {
            el.href = href;
        } else {
            el.type = "button";
        }
        el.className = "app-menu-lien" + (href && estActif(href) ? " actif" : "");
        el.innerHTML = `<span class="app-menu-icone">${icone}</span><span>${label}</span>`;
        if (action) el.addEventListener("click", action);
        return el;
    }

    function creerMenu() {
        overlay = document.createElement("div");
        overlay.className = "app-menu-overlay";
        overlay.addEventListener("click", fermerMenu);

        tiroir = document.createElement("aside");
        tiroir.className = "app-menu-tiroir";
        tiroir.setAttribute("aria-label", "Menu");

        // En-tête avec le nom de l'utilisateur (textContent : pas de HTML injecté)
        const user = lireUtilisateur();
        const entete = document.createElement("div");
        entete.className = "app-menu-entete";

        const avatar = document.createElement("div");
        avatar.className = "app-menu-avatar";
        const nom = document.createElement("div");
        nom.className = "app-menu-nom";

        if (user) {
            const nomAffiche = (user.prenom && user.nom)
                ? `${user.prenom} ${user.nom}`
                : (user.username || "");
            avatar.textContent = nomAffiche.charAt(0).toUpperCase() || "?";
            nom.textContent = nomAffiche || "Mon compte";
        } else {
            avatar.textContent = "?";
            nom.textContent = "Invité";
        }
        entete.appendChild(avatar);
        entete.appendChild(nom);
        tiroir.appendChild(entete);

        // Sections
        MENU.forEach(function (section) {
            const titre = document.createElement("div");
            titre.className = "app-menu-section";
            titre.textContent = section.titre;
            tiroir.appendChild(titre);

            section.liens.forEach(function (lien) {
                tiroir.appendChild(creerLienMenu(lien.icone, lien.label, lien.href));
            });
        });

        // Paramètres
        const titreParam = document.createElement("div");
        titreParam.className = "app-menu-section";
        titreParam.textContent = "Paramètres";
        tiroir.appendChild(titreParam);

        tiroir.appendChild(creerLienMenu("⚙️", "Paramètres et notifications", "profil.html"));
        tiroir.appendChild(creerLienMenu("🌓", "Changer de thème", null, function () {
            const btnTheme = document.getElementById("btn-theme");
            if (btnTheme) btnTheme.click();
            fermerMenu();
        }));
        tiroir.appendChild(creerLienMenu("🚪", "Se déconnecter", null, deconnecter));

        document.body.appendChild(overlay);
        document.body.appendChild(tiroir);
    }

    function ouvrirMenu() {
        if (!tiroir) creerMenu();
        overlay.classList.add("ouvert");
        tiroir.classList.add("ouvert");
        document.body.classList.add("menu-ouvert");
    }

    function fermerMenu() {
        if (!tiroir) return;
        overlay.classList.remove("ouvert");
        tiroir.classList.remove("ouvert");
        document.body.classList.remove("menu-ouvert");
    }

    function deconnecter() {
        if (!confirm("Te déconnecter ?")) return;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "auth.html";
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") fermerMenu();
    });

    function init() {
        creerNavBas();
        creerMenu();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();