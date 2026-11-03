/* Statistiques (Google Analytics 4), chargées UNIQUEMENT si le visiteur accepte (règles CNIL).
   Identifiant GA4 repris du site Wix (même propriété, l historique est conservé). */
(function () {
  var GA_ID = "G-KKC15CPW66";
  var CLE = "consentement-stats", DUREE = 395 * 864e5; // choix gardé 13 mois maximum
  var actif = false, enAttente = [];
  function lire() { try { var v = JSON.parse(localStorage.getItem(CLE)); return v && Date.now() - v.t < DUREE ? v.ok : null; } catch (e) { return null; } }
  function ecrire(ok) { try { localStorage.setItem(CLE, JSON.stringify({ ok: ok, t: Date.now() })); } catch (e) {} }
  function charger() {
    if (actif || !/^G-[A-Z0-9]+$/.test(GA_ID) || GA_ID === "G-XXXXXXXXXX") return;
    actif = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date()); gtag("config", GA_ID, { anonymize_ip: true });
    var s = document.createElement("script"); s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID; document.head.appendChild(s);
    enAttente.forEach(function (e) { gtag("event", e[0], e[1]); }); enAttente = [];
  }
  // Actions comptées : appel, formulaire, photos, outil argile, assistant « Que faire ? »
  window.suivi = function (nom, params) {
    if (lire() !== true) return;
    if (window.gtag && actif) gtag("event", nom, params || {}); else enAttente.push([nom, params || {}]);
  };
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (a) window.suivi("clic_appel", { emplacement: a.classList.contains("call-fab") ? "bouton flottant" : (a.closest("header,.hero") ? "haut de page" : "page") });
  });
  function bandeau() {
    if (document.getElementById("cookies")) return;
    var d = document.createElement("div"); d.id = "cookies"; d.className = "cookies"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Statistiques de visite");
    d.innerHTML = '<p>Nous aimerions mesurer la fréquentation du site (Google Analytics) pour l’améliorer. Aucune publicité. <a href="mentions-legales.html#cookies">En savoir plus</a></p>' +
      '<div><button type="button" class="btn" data-ok="1">Accepter</button><button type="button" class="btn btn-line" data-ok="0">Refuser</button></div>';
    d.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var ok = b.getAttribute("data-ok") === "1"; ecrire(ok); d.remove();
      if (ok) charger(); else if (actif) location.reload();
    });
    document.body.appendChild(d);
  }
  window.gererCookies = bandeau;
  var choix = lire();
  if (choix === true) charger(); else if (choix === null) bandeau();
})();
