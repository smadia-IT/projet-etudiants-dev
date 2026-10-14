// ============================================
// MESSAGERIE MOBILE — RETOUR À LA LISTE
// ============================================
document.addEventListener("DOMContentLoaded", function () {
    const btnRetour = document.getElementById("btn-retour-liste");
    const conversation = document.getElementById("conversation-active");
    if (!btnRetour || !conversation) return;

    btnRetour.addEventListener("click", function () {
        // Masquer la conversation : la liste redevient visible sur mobile
        conversation.classList.add("cache");
    });
});