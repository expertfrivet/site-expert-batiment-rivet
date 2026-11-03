/**
 * Réception des formulaires du site www.expert-batiment-rivet.com
 * À coller dans un projet Google Apps Script (script.google.com) créé avec le compte expert.frivet@gmail.com,
 * puis Déployer › Nouveau déploiement › Application Web (Exécuter en tant que : Moi ; Accès : Tout le monde).
 *
 * Pour chaque demande :
 *  - un e-mail est envoyé à l'expert, avec les photos en pièces jointes (Répondre = répondre au client) ;
 *  - la demande et ses photos sont rangées dans Mon Drive › ExpertFR › Site internet › Demandes,
 *    où le logiciel ExpertFR (PC et téléphone) les affiche dans « Demandes du site ».
 */
var DESTINATAIRE = 'expert.frivet@gmail.com';
var CHEMIN = ['ExpertFR', 'Site internet', 'Demandes'];

function dossier_() {
  var d = DriveApp.getRootFolder();
  CHEMIN.forEach(function (nom) {
    var it = d.getFoldersByName(nom);
    d = it.hasNext() ? it.next() : d.createFolder(nom);
  });
  return d;
}

function propre_(v, max) {
  return String(v || '').replace(/[\r\n]+/g, ' ').replace(/<[^>]*>/g, '').trim().slice(0, max || 200);
}

function repondre_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return repondre_({ ok: true, service: 'formulaires expert-batiment-rivet' });
}

function doPost(e) {
  try {
    var c = JSON.parse(e.postData.contents || '{}');
    if (c.site) return repondre_({ ok: true });                      // piège à robots
    var f = {};
    ['nom', 'email', 'phone', 'commune', 'code-postal', 'type', 'urgence', 'rappel', 'depuis', 'evolution', 'assurance', 'type-form']
      .forEach(function (k) { f[k] = propre_(c[k]); });
    var message = String(c.message || '').replace(/<[^>]*>/g, '').trim().slice(0, 5000);
    var photosForm = f['type-form'] === 'photos';
    if (photosForm && !message) message = '(pas de message)';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email) || !f.phone || !message || !f.type || !c.rgpd) {
      return repondre_({ ok: false, erreur: 'champs' });
    }
    // Anti-abus simple : 20 demandes par heure au maximum
    var cache = CacheService.getScriptCache(), n = Number(cache.get('compteur') || 0);
    if (n > 20) return repondre_({ ok: false, erreur: 'trop' });
    cache.put('compteur', String(n + 1), 3600);

    var maintenant = new Date();
    var id = Utilities.formatDate(maintenant, 'Europe/Paris', 'yyyyMMdd-HHmmss') + '-' +
      Utilities.getUuid().replace(/-/g, '').slice(0, 6);
    var dos = dossier_();
    var pj = [], photos = [], total = 0;
    (c.photos || []).slice(0, 5).forEach(function (p, i) {
      if (!p || !p.data) return;
      var octets = Utilities.base64Decode(p.data);
      total += octets.length;
      if (total > 20 * 1024 * 1024) return;
      var nom = id + '-' + (i + 1) + '.jpg';
      var blob = Utilities.newBlob(octets, 'image/jpeg', nom);
      dos.createFile(blob);
      pj.push(blob);
      photos.push({ fichier: nom, type: 'image/jpeg', legende: propre_(p.legende, 80) });
    });

    var demande = {
      id: id, recue_le: Utilities.formatDate(maintenant, 'Europe/Paris', "yyyy-MM-dd'T'HH:mm:ssXXX"),
      formulaire: photosForm ? 'photos' : 'contact',
      nom: f.nom, email: f.email, telephone: f.phone, commune: f.commune, code_postal: f['code-postal'],
      type: f.type, urgence: f.urgence, rappel: f.rappel, depuis: f.depuis, evolution: f.evolution,
      assurance: f.assurance, message: message, photos: photos
    };
    dos.createFile(id + '.json', JSON.stringify(demande, null, 1), 'application/json');

    var corps = "Nouvelle demande d'expertise depuis le site\n\n" +
      'Nom : ' + f.nom + '\nE-mail : ' + f.email + '\nTéléphone : ' + f.phone + '\n' +
      'Commune : ' + f.commune + (f['code-postal'] ? ' (' + f['code-postal'] + ')' : '') + '\nType de problème : ' + f.type + '\n' +
      (photosForm
        ? 'Remarqué depuis : ' + f.depuis + '\nÉvolution : ' + f.evolution + "\nDéclaré à l'assurance : " + f.assurance + '\n'
        : 'Urgence : ' + f.urgence + '\nRappel souhaité : ' + f.rappel + '\n') +
      '\nDemande :\n' + message + '\n';
    photos.forEach(function (p, i) { if (p.legende) corps += '\nPhoto ' + (i + 1) + ' : ' + p.legende; });
    corps += "\n\n(La demande est aussi dans l'appli ExpertFR, onglet Demandes du site.)";
    var sujet = (photosForm ? 'Photos - ' : "Demande d'expertise - ") + (f.type || 'site') + ' - ' + (f.commune || f.nom);
    MailApp.sendEmail({ to: DESTINATAIRE, subject: sujet, body: corps, replyTo: f.email,
                        name: 'Site expert-batiment-rivet', attachments: pj });
    return repondre_({ ok: true });
  } catch (err) {
    console.error(err);
    return repondre_({ ok: false, erreur: 'serveur' });
  }
}

/** À lancer une fois à la main (bouton Exécuter) pour donner les autorisations Drive et Gmail. */
function autoriser() {
  dossier_();
  MailApp.getRemainingDailyQuota();
}
