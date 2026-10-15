document.addEventListener("DOMContentLoaded", function () {

    // ===== NOM DE L'UTILISATEUR =====
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const paramNom = document.getElementById("param-nom");
    if (paramNom) {
        paramNom.textContent = user
            ? `Connecté en tant que ${user.prenom && user.nom ? user.prenom + " " + user.nom : user.username}`
            : "Tu n'es pas connecté.";
    }

    // ===== THÈME =====
    const btnTheme = document.getElementById("param-theme");
    if (btnTheme) {
        btnTheme.addEventListener("click", function () {
            const btnHeader = document.getElementById("btn-theme");
            if (btnHeader) btnHeader.click();
        });
    }

    // ===== INSTALLATION DE L'APPLI =====
    const btnInstaller = document.getElementById("param-installer");
    const aideInstall = document.getElementById("param-install-aide");
    let invitationInstall = null;

    // Chrome/Android propose l'installation : on garde l'événement pour l'utiliser au clic
    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        invitationInstall = e;
        if (btnInstaller) btnInstaller.classList.remove("cache");
    });

    if (btnInstaller) {
        btnInstaller.addEventListener("click", async function () {
            if (!invitationInstall) return;
            invitationInstall.prompt();
            await invitationInstall.userChoice;
            invitationInstall = null;
            btnInstaller.classList.add("cache");
        });
    }

    // Si l'appli est déjà installée
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
        const texte = document.getElementById("param-install-texte");
        if (texte) texte.textContent = "✅ L'application est installée sur cet appareil.";
    }

    // Instructions manuelles (iPhone, ou navigateur qui ne propose pas l'installation)
    if (aideInstall && !invitationInstall) {
        setTimeout(function () {
            if (!invitationInstall && !window.matchMedia("(display-mode: standalone)").matches) {
                aideInstall.classList.remove("cache");
                aideInstall.innerHTML = `
                    <strong>Sur Android (Chrome) :</strong> menu ⋮ → <em>Installer l'application</em>.<br>
                    <strong>Sur iPhone (Safari) :</strong> bouton Partager <span>⬆️</span> → <em>Sur l'écran d'accueil</em>.
                `;
            }
        }, 1500);
    }

    // ===== DÉCONNEXION =====
    const btnDeconnexion = document.getElementById("param-deconnexion");
    if (btnDeconnexion) {
        btnDeconnexion.addEventListener("click", function () {
            if (!confirm("Te déconnecter ?")) return;
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "auth.html";
        });
    }

});