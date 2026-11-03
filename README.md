# Site www.expert-batiment-rivet.com

Site de **Expertises Bâtiment Franck RIVET** (Troyes), hébergé gratuitement sur GitHub Pages.

- `site/` : les pages du site, telles qu'elles sont publiées.
- `donnees/articles/` : un fichier par article publié depuis l'appli ExpertFR (PC ou téléphone).
- `outils/articles.py` : fabrique les pages des articles à chaque publication.
- `outils/script-google/Code.gs` : script Google qui reçoit les formulaires (e-mail + Google Drive).
- `.github/workflows/publier.yml` : met le site en ligne à chaque modification (onglet Actions).

Aucune donnée client n'est stockée ici : les demandes des formulaires vont dans le Google Drive du cabinet.
