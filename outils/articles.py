"""Fabrique les pages des articles publiés depuis l'appli ExpertFR.

Lancé par GitHub Actions à chaque publication (voir .github/workflows/publier.yml) :
    python outils/articles.py <dossier du site à publier>
Lit donnees/articles/*.json (un fichier par article, envoyé par l'appli), crée article-AAAA-MM-....html
à partir de outils/modele-article.html et insère la liste dans evenements.html et sitemap.xml
entre les repères <!--ARTICLES--> et <!--/ARTICLES-->. Tout le texte est échappé : aucun HTML venu de l'appli.
"""
import glob, html, json, os, re, sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_URL = "https://www.expert-batiment-rivet.com"
MOIS = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août",
        "Septembre", "Octobre", "Novembre", "Décembre"]
e = lambda t: html.escape(str(t or ""), quote=True)


def mois_lisible(m):
    a, n = m.split("-")
    return f"{MOIS[int(n)]} {a}"


def lire_articles(dossier):
    arts = []
    for f in sorted(glob.glob(os.path.join(dossier, "*.json"))):
        try:
            a = json.load(open(f, encoding="utf-8"))
        except ValueError:
            print("illisible :", f); continue
        if not re.fullmatch(r"article-[a-z0-9-]+", a.get("slug", "")) or not re.fullmatch(r"20\d\d-(0[1-9]|1[0-2])", a.get("mois", "")):
            print("ignoré :", f); continue
        arts.append(a)
    return sorted(arts, key=lambda a: a["mois"], reverse=True)


def corps(a, site):
    photos = [p for p in a.get("photos", []) if re.fullmatch(r"images/articles/[a-z0-9-]+\.jpg", p.get("fichier", ""))
              and os.path.exists(os.path.join(site, p["fichier"]))]
    h = f'<p class="date">{e(mois_lisible(a["mois"]))}' + (f' · {e(a["commune"])}' if a.get("commune") else "") + "</p>"
    liste = False
    for b in a.get("blocs", []):
        t = (b.get("texte") or "").strip()
        if not t:
            continue
        ty = b.get("type", "p")
        if ty == "li" and not liste:
            h += '<ul class="checks">'; liste = True
        if ty != "li" and liste:
            h += "</ul>"; liste = False
        h += f"<h2>{e(t)}</h2>" if ty == "h2" else (f"<li>{e(t)}</li>" if ty == "li" else f"<p>{e(t)}</p>")
    if liste:
        h += "</ul>"
    if photos:
        h += '<div class="gallery">' + "".join(
            f'<a href="{e(p["fichier"])}" target="_blank" rel="noopener"><img src="{e(p["fichier"])}" alt="{e(p.get("legende"))}" loading="lazy"></a>'
            for p in photos) + "</div>"
    h += ('<p>Vous rencontrez un problème semblable ? <a href="envoyer-mes-photos.html">Envoyez vos photos à l’expert</a> '
          'ou appelez le <a href="tel:+33637842702">06 37 84 27 02</a>.</p>')
    ld = {"@context": "https://schema.org", "@type": "BlogPosting", "headline": a["titre"], "datePublished": a["mois"] + "-01",
          "author": {"@type": "Person", "name": "Franck Rivet"}}
    if photos:
        ld["image"] = f'{SITE_URL}/{photos[0]["fichier"]}'
    h += '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace("<", "\\u003c") + "</script>"
    return h, photos


def remplacer(chemin, contenu):
    if not os.path.exists(chemin):
        return
    t = open(chemin, encoding="utf-8").read()
    n = re.sub(r"<!--ARTICLES-->.*?<!--/ARTICLES-->", lambda _: "<!--ARTICLES-->\n" + contenu + "<!--/ARTICLES-->", t, count=1, flags=re.S)
    open(chemin, "w", encoding="utf-8").write(n)


def main(site):
    modele = open(os.path.join(RACINE, "outils", "modele-article.html"), encoding="utf-8").read()
    arts = lire_articles(os.path.join(RACINE, "donnees", "articles"))
    liste = plan = ""
    for a in arts:
        h, photos = corps(a, site)
        page = modele
        for k, v in {"__SLUG__": a["slug"], "__TITRE__": e(a["titre"]), "__DESC__": e(a.get("resume")),
                     "__SOUSTITRE__": e(mois_lisible(a["mois"])), "__CORPS__": h}.items():
            page = page.replace(k, v)
        open(os.path.join(site, a["slug"] + ".html"), "w", encoding="utf-8").write(page)
        img = photos[0]["fichier"] if photos else ""
        liste += (f'<article class="post" id="{e(a["slug"])}"><p class="date">{e(mois_lisible(a["mois"]))}</p>'
                  f'<h2><a href="{e(a["slug"])}.html">{e(a["titre"])}</a></h2>'
                  + (f'<a href="{e(a["slug"])}.html"><img src="{e(img)}" alt="" loading="lazy" style="max-height:320px;width:100%;object-fit:cover;border-radius:8px;margin-bottom:12px"></a>' if img else "")
                  + f'<p>{e(a.get("resume"))}</p><p><a href="{e(a["slug"])}.html">Lire l’article</a></p></article>\n')
        plan += f"  <url><loc>{SITE_URL}/{e(a['slug'])}</loc></url>\n"
    remplacer(os.path.join(site, "evenements.html"), liste)
    remplacer(os.path.join(site, "sitemap.xml"), plan)
    print(len(arts), "article(s) publiés")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(RACINE, "site"))
