// ============================================
// INSCRIPTION : INDICATIF AUTOMATIQUE
// ============================================
document.addEventListener("DOMContentLoaded", function () {
    const selectPays = document.getElementById("pays");
    const indicatifAffiche = document.getElementById("indicatif-affiche");
    const champTel = document.getElementById("telephone");
    if (!selectPays || !indicatifAffiche || !champTel) return;

    function majIndicatif() {
        indicatifAffiche.textContent = selectPays.value || "+";
    }

    selectPays.addEventListener("change", majIndicatif);
    majIndicatif();

    // Ne garder que les chiffres dans le champ
    champTel.addEventListener("input", function () {
        champTel.value = champTel.value.replace(/\D/g, "");
    });
});

// Renvoie "+243-823456789" (format attendu par le serveur), ou null si incomplet
function formaterTelephone() {
    const indicatif = document.getElementById("pays").value;
    const numero = document.getElementById("telephone").value.replace(/\D/g, "");
    if (!indicatif || numero.length < 6) return null;
    return `${indicatif}-${numero}`;
}