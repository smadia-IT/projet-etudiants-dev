// ============================================
// CONFETTIS — Effet visuel de célébration
// ============================================

(function() {
    // Éviter les doublons
    if (window.lancerConfettis) return;
    
    // Créer le canvas de confettis
    function creerCanvas() {
        const canvas = document.createElement("canvas");
        canvas.id = "confettis-canvas";
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(canvas);
        return canvas;
    }
    
    // Configuration
    const COULEURS = [
        "#1a73e8", "#0d5bbd", "#4a9eff",   // Bleus
        "#ffc107", "#ff6b35", "#ff4757",   // Jaunes/Oranges
        "#28a745", "#20c997",              // Verts
        "#e91e63", "#9c27b0",              // Roses/Violets
        "#ffffff"                          // Blanc
    ];
    
    const FORMES = ["carré", "rond", "rectangle"];
    
    /**
     * Lance une animation de confettis
     * @param {Object} options - Configuration
     * @param {number} options.duree - Durée en ms (défaut: 3000)
     * @param {number} options.nombre - Nombre de confettis (défaut: 80)
     * @param {string} options.origine - "centre" | "haut" | "cotes" (défaut: "haut")
     * @param {number} options.vitesse - Multiplicateur de vitesse (défaut: 1)
     */
    function lancerConfettis(options = {}) {
        const {
            duree = 3000,
            nombre = 80,
            origine = "haut",
            vitesse = 1
        } = options;
        
        const canvas = creerCanvas();
        const ctx = canvas.getContext("2d");
        
        // Adapter la taille du canvas
        function redimensionner() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        redimensionner();
        
        // Créer les confettis
        const confettis = [];
        
        for (let i = 0; i < nombre; i++) {
            let x, y, vx, vy;
            
            if (origine === "centre") {
                x = canvas.width / 2;
                y = canvas.height / 2;
                const angle = Math.random() * Math.PI * 2;
                const force = 5 + Math.random() * 10;
                vx = Math.cos(angle) * force;
                vy = Math.sin(angle) * force;
            } else if (origine === "cotes") {
                // Partir des 2 côtés
                const gauche = Math.random() < 0.5;
                x = gauche ? -20 : canvas.width + 20;
                y = canvas.height * 0.7;
                vx = (gauche ? 1 : -1) * (3 + Math.random() * 5);
                vy = -(5 + Math.random() * 8);
            } else {
                // "haut" : partir du haut
                x = Math.random() * canvas.width;
                y = -20 - Math.random() * 100;
                vx = (Math.random() - 0.5) * 4;
                vy = 2 + Math.random() * 4;
            }
            
            confettis.push({
                x, y, vx, vy,
                taille: 6 + Math.random() * 8,
                couleur: COULEURS[Math.floor(Math.random() * COULEURS.length)],
                forme: FORMES[Math.floor(Math.random() * FORMES.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationVitesse: (Math.random() - 0.5) * 0.2,
                gravite: 0.15 + Math.random() * 0.1,
                opacite: 1,
                dureeVie: duree / 1000
            });
        }
        
        let derniereFrame = performance.now();
        let tempsEcoule = 0;
        
        function animer(maintenant) {
            const delta = (maintenant - derniereFrame) / 1000;
            derniereFrame = maintenant;
            tempsEcoule += delta * 1000;  // en ms
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            confettis.forEach((c, index) => {
                // Physique
                c.vy += c.gravite;
                c.vx *= 0.99;   // friction
                c.x += c.vx * vitesse;
                c.y += c.vy * vitesse;
                c.rotation += c.rotationVitesse;
                
                // Fade out dans les dernières secondes
                const tempsRestant = duree - tempsEcoule;
                if (tempsRestant < 1000) {
                    c.opacite = tempsRestant / 1000;
                }
                
                // Dessin
                ctx.save();
                ctx.globalAlpha = Math.max(0, c.opacite);
                ctx.translate(c.x, c.y);
                ctx.rotate(c.rotation);
                ctx.fillStyle = c.couleur;
                
                if (c.forme === "carré") {
                    ctx.fillRect(-c.taille / 2, -c.taille / 2, c.taille, c.taille);
                } else if (c.forme === "rond") {
                    ctx.beginPath();
                    ctx.arc(0, 0, c.taille / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Rectangle
                    ctx.fillRect(-c.taille / 2, -c.taille / 4, c.taille, c.taille / 2);
                }
                
                ctx.restore();
            });
            
            // Continuer ou arrêter
            if (tempsEcoule < duree && confettis.some(c => c.y < canvas.height + 50)) {
                requestAnimationFrame(animer);
            } else {
                canvas.remove();
            }
        }
        
        requestAnimationFrame(animer);
        
        // Redimensionnement
        window.addEventListener("resize", redimensionner, { once: true });
    }
    
    // Exposer globalement
    window.lancerConfettis = lancerConfettis;
    
    // Alias plus court
    window.confettis = lancerConfettis;
    
    console.log("🎊 Module confettis prêt");
})();