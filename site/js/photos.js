/* Formulaire « Envoyez vos photos » : aperçu, légende par photo, réduction avant envoi. */
(function () {
  var f = document.getElementById("form-photos"), inp = document.getElementById("p-photos"),
      ap = document.getElementById("p-apercu"), st = f.querySelector(".form-status");
  var MAX = 5, items = [];
  var LEG = ["Vue d’ensemble", "Gros plan", "Autre côté du mur", "Abords", "Façade", "Autre"];
  inp.addEventListener("change", function () {
    var fs = Array.prototype.slice.call(inp.files, 0, MAX);
    st.hidden = inp.files.length <= MAX; st.textContent = "Seules les 5 premières photos seront envoyées.";
    items = fs.map(function (file, i) { return { file: file, i: i }; });
    ap.innerHTML = items.map(function (it, i) {
      return '<figure><img alt="" src="' + URL.createObjectURL(it.file) + '"><select data-i="' + i + '" aria-label="Que montre la photo ' + (i + 1) + ' ?">' +
        LEG.map(function (l, k) { return "<option" + (k === Math.min(i, 5) ? " selected" : "") + ">" + l + "</option>"; }).join("") + "</select></figure>";
    }).join("");
  });
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!items.length) { st.hidden = false; st.textContent = "Ajoutez au moins une photo."; return; }
    st.hidden = false; st.textContent = "Préparation des photos…";
    var legs = Array.prototype.map.call(ap.querySelectorAll("select"), function (x) { return x.value; });
    st.textContent = "Envoi en cours…";
    envoyerDemande(f, items.map(function (it) { return it.file; }), legs).then(function () {
      window.suivi && suivi("photos_envoyees", { nombre: items.length }); f.reset(); ap.innerHTML = ""; items = [];
      st.textContent = "Merci, vos photos ont bien été envoyées ! Franck Rivet vous rappelle rapidement.";
    }).catch(function (err) {
      st.textContent = err.message === "taille" ? "Les photos sont trop lourdes : envoyez-en moins à la fois."
        : "L’envoi a échoué. Écrivez à expert.frivet@gmail.com ou appelez le 06 37 84 27 02.";
    });
  });
})();
