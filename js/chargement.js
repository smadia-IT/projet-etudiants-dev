// ============================================
// ÉCRAN DE CHARGEMENT
// ============================================

(function() {
    // Créer l'overlay de chargement
    const overlay = document.createElement("div");
    overlay.id = "chargement-overlay";
    overlay.innerHTML = `
        <div class="chargement-contenu">
            <div class="chargement-logo">
                <svg viewBox="0 0 100 100" width="80" height="80">
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#1a73e8;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#0d5bbd;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="40" fill="url(#grad)" opacity="0.1"/>
                    <text x="50" y="65" font-size="45" text-anchor="middle" fill="url(#grad)">🎓</text>
                </svg>
            </div>
            <div class="chargement-texte">
                <span class="chargement-point">É</span>
                <span class="chargement-point">t</span>
                <span class="chargement-point">u</span>
                <span class="chargement-point">d</span>
                <span class="chargement-point">i</span>
                <span class="chargement-point">a</span>
                <span class="chargement-point">n</span>
                <span class="chargement-point">t</span>
                <span class="chargement-point">s</span>
                <span class="chargement-espace"> </span>
                <span class="chargement-point">I</span>
                <span class="chargement-point">T</span>
            </div>
            <div class="chargement-barre">
                <div class="chargement-barre-remplie"></div>
            </div>
        </div>
    `;
    
    // Ajouter au body dès que possible
    document.addEventListener("DOMContentLoaded", function() {
        document.body.prepend(overlay);
    });
    
    // Ou immédiatement si le DOM est déjà chargé
    if (document.body) {
        document.body.prepend(overlay);
    } else {
        document.addEventListener("DOMContentLoaded", function() {
            document.body.prepend(overlay);
        });
    }
    
    // Retirer l'overlay après le chargement complet
    window.addEventListener("load", function() {
        setTimeout(() => {
            overlay.classList.add("chargement-fin");
            setTimeout(() => overlay.remove(), 500);
        }, 600);  // 600ms minimum pour voir l'animation
    });
})();