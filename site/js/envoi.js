/* Envoi des formulaires (contact et photos) vers le script Google du cabinet :
   la demande arrive par e-mail à l'expert, avec les photos, et est rangée dans son Google Drive
   (ExpertFR › Site internet › Demandes), où le logiciel ExpertFR la retrouve.
   À la mise en ligne : remplacer l'adresse ci-dessous par celle du script Google (voir le guide). */
(function () {
  var ADRESSE = "https://script.google.com/macros/s/A-REMPLACER/exec";
  var COTE = 1800, MAX_TOTAL = 18 * 1024 * 1024;

  function reduire(file) {
    return new Promise(function (ok) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var r = Math.min(1, COTE / Math.max(img.width, img.height));
        var c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function (b) { ok(b || file); }, "image/jpeg", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); ok(file); };
      img.src = url;
    });
  }
  function base64(blob) {
    return new Promise(function (ok, ko) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).split(",")[1] || ""); };
      r.onerror = ko; r.readAsDataURL(blob);
    });
  }
  // form : le formulaire ; fichiers : tableau de File ; legendes : tableau de textes (facultatif)
  window.envoyerDemande = function (form, fichiers, legendes) {
    var champs = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === "file" || el.type === "submit") return;
      if ((el.type === "radio" || el.type === "checkbox") && !el.checked) return;
      champs[el.name] = el.type === "checkbox" ? "oui" : el.value;
    });
    if (champs.site) return Promise.resolve();          // piège à robots : on fait semblant
    return Promise.all((fichiers || []).slice(0, 5).map(reduire)).then(function (blobs) {
      var total = blobs.reduce(function (t, b) { return t + b.size; }, 0);
      if (total > MAX_TOTAL) throw new Error("taille");
      return Promise.all(blobs.map(base64));
    }).then(function (datas) {
      champs.photos = datas.map(function (d, i) { return { data: d, type: "image/jpeg", legende: (legendes || [])[i] || "" }; });
      if (ADRESSE.indexOf("A-REMPLACER") >= 0) throw new Error("config");
      return fetch(ADRESSE, { method: "POST", body: JSON.stringify(champs), headers: { "Content-Type": "text/plain;charset=utf-8" } });
    }).then(function (r) {
      if (!r.ok) throw new Error("envoi");
      return r.json();
    }).then(function (d) {
      if (!d || !d.ok) throw new Error("envoi");
    });
  };
})();
