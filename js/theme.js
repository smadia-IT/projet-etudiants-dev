// Gestion du thème clair/sombre
(function() {
    // Récupérer le thème sauvegardé (ou clair par défaut)
    const themeSauvegarde = localStorage.getItem("theme") || "clair";
    
    // Appliquer le thème dès le chargement
    if (themeSauvegarde === "sombre") {
        document.body.classList.add("dark");
    }
    
    // Attendre que le DOM soit prêt
    document.addEventListener("DOMContentLoaded", function() {
        const btnTheme = document.getElementById("btn-theme");
        
        if (!btnTheme) return;
        
        // Mettre à jour l'icône au chargement
        majIcone();
        
        // Au clic, basculer le thème
        btnTheme.addEventListener("click", function() {
            document.body.classList.toggle("dark");
            
            // Sauvegarder le choix
            if (document.body.classList.contains("dark")) {
                localStorage.setItem("theme", "sombre");
            } else {
                localStorage.setItem("theme", "clair");
            }
            
            majIcone();
        });
        
        // Fonction pour changer l'icône
        function majIcone() {
            if (document.body.classList.contains("dark")) {
                btnTheme.textContent = "☀️";
            } else {
                btnTheme.textContent = "🌙";
            }
        }
    });
})();