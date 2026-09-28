// ============================================
// MENU DÉROULANT DANS LE HEADER
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    const dropdown = document.querySelector(".nav-dropdown");
    if (!dropdown) return;
    
    const btn = dropdown.querySelector(".nav-dropdown-btn");
    const menu = dropdown.querySelector(".nav-dropdown-menu");
    
    if (!btn || !menu) return;
    
    // Ouvrir/fermer au clic
    btn.addEventListener("click", function(e) {
        e.stopPropagation();
        menu.classList.toggle("ouvert");
    });
    
    // Fermer en cliquant ailleurs
    document.addEventListener("click", function() {
        menu.classList.remove("ouvert");
    });
    
    // Empêcher la fermeture si on clique dans le menu
    menu.addEventListener("click", function(e) {
        e.stopPropagation();
    });
});