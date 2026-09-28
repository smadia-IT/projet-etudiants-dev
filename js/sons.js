// ============================================
// GESTION DES SONS (Web Audio API)
// ============================================

let audioContext = null;

// Initialiser le contexte audio (à appeler au premier clic utilisateur)
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Fonction générique pour jouer une note
function jouerNote(frequence, duree, type = "sine", volume = 0.3) {
    const ctx = initAudio();
    if (!ctx) return;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequence;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duree);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + duree);
}

// ===== SON 1 : Bonne réponse =====
// Deux notes ascendantes (do → mi)
function sonBonneReponse() {
    jouerNote(523.25, 0.15);  // Do (C5)
    setTimeout(() => jouerNote(659.25, 0.2), 120);  // Mi (E5)
}

// ===== SON 2 : Mauvaise réponse =====
// Deux notes descendantes (mi → do grave)
function sonMauvaiseReponse() {
    jouerNote(330, 0.15, "sawtooth");  // Mi (E4)
    setTimeout(() => jouerNote(220, 0.3, "sawtooth"), 120);  // La (A3)
}

// ===== SON 3 : Badge débloqué =====
// Trois notes ascendantes (do → mi → sol)
function sonBadge() {
    jouerNote(523.25, 0.15);  // Do (C5)
    setTimeout(() => jouerNote(659.25, 0.15), 100);  // Mi (E5)
    setTimeout(() => jouerNote(783.99, 0.3), 200);  // Sol (G5)
}

// ===== SON 4 : Clic / sélection =====
function sonClic() {
    jouerNote(800, 0.05, "sine", 0.1);
}

// ===== SON 5 : Game Over =====
// Descente grave
function sonGameOver() {
    jouerNote(440, 0.2, "sawtooth", 0.2);  // La (A4)
    setTimeout(() => jouerNote(349.23, 0.2, "sawtooth", 0.2), 200);  // Fa (F4)
    setTimeout(() => jouerNote(261.63, 0.5, "sawtooth", 0.2), 400);  // Do (C4)
}

// ===== SON 6 : Timer (tic tac) =====
function sonTicTac() {
    jouerNote(1200, 0.03, "square", 0.1);
}

// ===== SON 7 : Vie gagnée =====
function sonVieGagnee() {
    jouerNote(659.25, 0.1);  // Mi
    setTimeout(() => jouerNote(783.99, 0.1), 100);  // Sol
    setTimeout(() => jouerNote(1046.5, 0.2), 200);  // Do aigu
}

// Initialiser l'audio au premier clic n'importe où
document.addEventListener("click", function init() {
    initAudio();
    document.removeEventListener("click", init);
}, { once: true });