/* Outil « Ma maison est-elle en zone argile ? »
   Données publiques : Base Adresse Nationale (géocodage) + API Géorisques (RGA, Cat Nat).
   À TESTER une fois le site en ligne (non testable depuis l'environnement de préparation). */
(function () {
  var GEO = "https://data.geopf.fr/geocodage/search?limit=5&q=";
  var GEO_OLD = "https://api-adresse.data.gouv.fr/search/?limit=5&q=";
  var GR = "https://georisques.gouv.fr/api/v1/";
  var form = document.getElementById("za-form"), input = document.getElementById("za-adr"),
      list = document.getElementById("za-sugg"), out = document.getElementById("za-res");
  var last = [], timer;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function getJSON(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function geocode(q) {
    return getJSON(GEO + encodeURIComponent(q)).catch(function () { return getJSON(GEO_OLD + encodeURIComponent(q)); })
      .then(function (d) { return d.features || []; });
  }
  input.addEventListener("input", function () {
    clearTimeout(timer);
    var q = input.value.trim(); if (q.length < 4) return;
    timer = setTimeout(function () {
      geocode(q).then(function (f) {
        last = f;
        list.innerHTML = f.map(function (x) { return '<option value="' + esc(x.properties.label) + '">'; }).join("");
      }).catch(function () {});
    }, 300);
  });
  var NIVEAUX = {
    "3": ["Forte", "za-fort", "Les sols de votre secteur sont très sensibles au retrait-gonflement. Des fissures en escalier, des portes qui coincent ou un dallage qui se décolle méritent d’être examinés."],
    "2": ["Moyenne", "za-moyen", "Le risque existe. Surveillez l’apparition de fissures, surtout après un été sec."],
    "1": ["Faible", "za-faible", "Le risque est limité, mais des désordres restent possibles selon les fondations et la végétation proche."],
    "0": ["Nulle ou non renseignée", "za-faible", "Pas d’argile sensible recensée à cet endroit."]
  };
  function blocRGA(d) {
    var code = d && (d.codeExposition != null ? String(d.codeExposition) : null);
    var n = NIVEAUX[code];
    if (!n) return '<p>Exposition au retrait-gonflement : information indisponible pour cette adresse.</p>';
    return '<p class="za-niveau ' + n[1] + '">Exposition au retrait-gonflement des argiles : <strong>' + n[0] + '</strong></p><p>' + n[2] + '</p>';
  }
  function fmt(s) { if (!s) return "?"; var p = String(s).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : s; }
  function blocCatNat(rows, commune) {
    var secs = rows.filter(function (r) { return /s[ée]cheresse|r[ée]hydratation|mouvements? de terrain diff/i.test(r.libelle_risque_jo || ""); });
    secs.sort(function (a, b) { return String(b.date_debut_evt).localeCompare(String(a.date_debut_evt)); });
    var h = '<h3>Arrêtés catastrophe naturelle « sécheresse » à ' + esc(commune) + '</h3>';
    if (!secs.length) return h + '<p>Aucun arrêté sécheresse trouvé pour cette commune. Les demandes de reconnaissance se font par la mairie : si vous constatez des fissures après un été sec, signalez-le à votre mairie.</p>';
    return h + '<ul class="checks">' + secs.slice(0, 8).map(function (r) {
      return '<li>Événement du ' + fmt(r.date_debut_evt) + ' au ' + fmt(r.date_fin_evt) + ', arrêté publié au Journal officiel le ' + fmt(r.date_publication_jo) + '</li>';
    }).join("") + '</ul><p>Après la publication d’un arrêté, le délai pour déclarer le sinistre à votre assureur est court. Si vous avez des fissures, ne tardez pas.</p>';
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value.trim(); if (!q) return;
    out.innerHTML = '<div class="card mt"><p>Recherche en cours…</p></div>';
    var hit = last.filter(function (x) { return x.properties.label === q; })[0];
    (hit ? Promise.resolve([hit]) : geocode(q)).then(function (f) {
      if (!f.length) throw new Error("adresse");
      var p = f[0].properties, c = f[0].geometry.coordinates;
      var lonlat = c[0] + "," + c[1];
      return Promise.all([
        getJSON(GR + "rga?latlon=" + lonlat).catch(function () { return null; }),
        getJSON(GR + "gaspar/catnat?page=1&page_size=100&code_insee=" + p.citycode).then(function (d) { return d.data || []; }).catch(function () { return null; })
      ]).then(function (r) {
        window.suivi && suivi("outil_argile", { commune: p.city, exposition: r[0] && r[0].codeExposition });         out.innerHTML = '<div class="card mt za-res"><p class="kicker">' + esc(p.label) + '</p>' + blocRGA(r[0]) +
          (r[1] ? blocCatNat(r[1], p.city) : '<p>Liste des arrêtés indisponible pour le moment.</p>') +
          '<p><a class="btn" href="contact.html#formulaire">Faire examiner mes fissures</a> <a class="btn btn-line" href="tel:+33637842702">06 37 84 27 02</a></p></div>';
      });
    }).catch(function (err) {
      out.innerHTML = '<div class="card mt"><p>' + (err.message === "adresse" ? "Adresse introuvable. Essayez avec le numéro, la rue et la commune." : "Le service Géorisques ne répond pas pour le moment. Réessayez plus tard ou consultez georisques.gouv.fr.") + '</p></div>';
    });
  });
})();
