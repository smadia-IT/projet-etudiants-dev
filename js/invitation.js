// ============================================
// INVITATION POUR LES VISITEURS NON CONNECTÉS
// ============================================
(function () {
    if (localStorage.getItem("token") && localStorage.getItem("user")) return;

    const page = window.location.pathname.split("/").pop() || "index.html";
    if (["auth.html", "offline.html"].includes(page)) return;

    const bandeau = document.createElement("div");
    bandeau.className = "invitation-bandeau";
    bandeau.innerHTML = `
        <div class="invitation-texte">
            <strong>Rejoins Étudiants IT</strong> : quiz,dictionnaire, messagerie, amis et forum, gratuitement.
        </div>
        <a href="auth.html" class="btn-primaire invitation-btn">Créer mon compte</a>
    `;

    const main = document.querySelector("main.conteneur");
    if (main) main.prepend(bandeau);
})();