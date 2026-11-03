// Assistant « Que faire maintenant ? » : questionnaire guidé, sans envoi de données.
// Contenu à faire valider par l'expert avant publication.
const ETAPES = {
  depart: { q: "Quelle est votre situation ?", choix: [
    ["Un dégât des eaux ou un autre sinistre", "sinistre"],
    ["Des fissures apparaissent ou s’agrandissent", "fissures"],
    ["Un conflit avec un artisan ou un constructeur", "artisan"],
    ["Je dois réceptionner des travaux ou une maison", "reception"],
    ["J’achète ou je viens d’acheter un bien", "achat"] ] },
  sinistre: { q: "Le sinistre est-il en cours (fuite active, danger) ?", choix: [
    ["Oui, c’est en cours", "sinistre_urgent"], ["Non, c’est stabilisé", "sinistre_ok"] ] },
  fissures: { q: "La maison a-t-elle moins de 10 ans (depuis la réception des travaux) ?", choix: [
    ["Oui, moins de 10 ans", "fissures_decennale"], ["Non, plus de 10 ans", "fissures_ancienne"], ["Je ne sais pas", "fissures_ancienne"] ] },
  artisan: { q: "Les travaux sont-ils terminés et réceptionnés ?", choix: [
    ["Non, chantier en cours ou abandonné", "artisan_encours"], ["Oui, réceptionnés", "artisan_recu"] ] },
  reception: { fin: true, titre: "Avant la réception", conseils: [
    "Ne signez pas le procès-verbal de réception dans la précipitation : vous pouvez y inscrire des réserves.",
    "Vérifiez pièce par pièce, de jour, et notez chaque défaut visible avec photos.",
    "Contrôlez que les paiements correspondent au marché signé et à l’avancement.",
    "Faites-vous accompagner par un expert le jour J : c’est le moment où vous avez le plus de leviers." ] },
  achat: { fin: true, titre: "Achat d’un bien", conseils: [
    "Avant de signer : faites réaliser une expertise technique (structure, humidité, fissures, toiture).",
    "Après l’achat : si un défaut caché apparaît, conservez toutes les preuves (photos, dates, échanges avec le vendeur).",
    "Un rapport d’expert donne à votre avocat les éléments pour agir (vice caché, révision du prix)." ] },
  sinistre_urgent: { fin: true, urgent: true, titre: "Sinistre en cours", conseils: [
    "Mettez-vous en sécurité et coupez l’eau, le gaz ou l’électricité si nécessaire.",
    "Faites cesser la cause si possible (plombier, bâchage) et gardez les factures.",
    "Prenez des photos et vidéos datées avant tout nettoyage.",
    "Déclarez le sinistre à votre assureur au plus vite (vérifiez le délai prévu par votre contrat)." ] },
  sinistre_ok: { fin: true, titre: "Après le sinistre", conseils: [
    "Déclarez le sinistre à votre assureur si ce n’est pas fait, par écrit.",
    "Ne jetez rien d’endommagé avant le passage de l’expert de l’assurance.",
    "Si la proposition d’indemnisation vous semble insuffisante, un expert d’assuré peut l’analyser et la contester." ] },
  fissures_decennale: { fin: true, titre: "Fissures sur une construction récente", conseils: [
    "Photographiez les fissures avec un repère (règle, pièce de monnaie) et datez les photos.",
    "Surveillez leur évolution : largeur, longueur, nouvelles fissures.",
    "La garantie décennale ou l’assurance dommages-ouvrage peuvent être mobilisées : ne laissez pas passer les délais.",
    "Une expertise indépendante établit la cause et la gravité avant la déclaration." ] },
  fissures_ancienne: { fin: true, titre: "Fissures sur une maison ancienne", conseils: [
    "Photographiez et datez les fissures, et surveillez leur évolution.",
    "Après un été sec, renseignez-vous en mairie : votre commune peut demander la reconnaissance de catastrophe naturelle sécheresse.",
    "Une expertise distingue une fissure esthétique d’un désordre structurel et oriente les démarches." ] },
  artisan_encours: { fin: true, titre: "Chantier en cours ou abandonné", conseils: [
    "Écrivez à l’entreprise (courrier recommandé) pour lui demander de reprendre ou terminer les travaux.",
    "Ne payez pas au-delà de ce qui est réellement réalisé.",
    "Faites constater l’état du chantier : une expertise amiable compte comme tentative de résolution amiable, obligatoire avant d’aller en justice." ] },
  artisan_recu: { fin: true, titre: "Malfaçons après réception", conseils: [
    "Signalez les défauts par écrit à l’entreprise : la garantie de parfait achèvement court un an après la réception.",
    "Au-delà, les garanties biennale (équipements) et décennale (solidité) peuvent s’appliquer.",
    "Une expertise contradictoire, en présence de l’entreprise, prépare un règlement amiable ou une action en justice." ] },
};
const box = document.getElementById("que-faire");
let historique = [];
function afficher(id) {
  const e = ETAPES[id];
  let h = "";
  if (e.fin) {
    h = `<h3>${e.titre}</h3>${e.urgent ? '<p class="qf-urgent">Situation urgente : agissez tout de suite.</p>' : ""}<ul class="checks">${e.conseils.map(c => `<li>${c}</li>`).join("")}</ul>
      <p><b>Besoin d’un avis d’expert ?</b> Nous vous rappelons pour en parler.</p>
      <p><a class="btn" href="contact.html#formulaire">Être rappelé</a> <button class="btn btn-line" data-retour>Recommencer</button></p>`;
  } else {
    h = `<h3>${e.q}</h3><div class="qf-choix">${e.choix.map(([t, n]) => `<button class="qf-btn" data-next="${n}">${t}</button>`).join("")}</div>`;
    if (historique.length) h += `<p><button class="btn-lien" data-prec>← Retour</button></p>`;
  }
  box.innerHTML = h;
}
box.addEventListener("click", ev => {
  const b = ev.target.closest("button"); if (!b) return;
  if (b.dataset.next) { historique.push(b.dataset.next); afficher(b.dataset.next); if (!(ETAPES[b.dataset.next] || {}).choix && window.suivi) suivi("que_faire_conseil", { conseil: b.dataset.next }); }
  else if (b.dataset.prec) { historique.pop(); afficher(historique.at(-1) || "depart"); }
  else if ("retour" in b.dataset) { historique = []; afficher("depart"); }
});
afficher("depart");
