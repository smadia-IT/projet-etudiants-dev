// ============================================
// CONFIGURATION GLOBALE
// ============================================

// Détecte automatiquement l'environnement
const API_URL = 
    window.location.hostname === "localhost" || 
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000/api"                                      // Dev local
       : "https://projet-etudiants-it-backend.onrender.com/api";
        
    