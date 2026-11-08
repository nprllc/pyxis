# Pyxis

Pyxis est une plateforme personnelle pour apprendre à investir et garder le cap. Elle contient un scanner de marché, des scores qui affichent leur incertitude, un journal de décisions et un coach pédagogique.

Pyxis, c'est la Boussole : une petite constellation du ciel austral. Le logo reprend la position réelle de ses trois étoiles principales.

**Site :** https://nprllc.github.io/pyxis/

## Comment ça marche

```
Chaque soir de semaine (22 h 17 UTC), GitHub Actions :
  1. télécharge les cours (Yahoo Finance, Stooq en secours) et la macro (FRED)
  2. contrôle la cohérence des données
  3. calcule les indicateurs et le score de chaque titre
  4. enregistre le résultat dans site/data/*.json
  5. publie le site sur GitHub Pages
```

Le site est une simple page web : il lit ces fichiers JSON et n'a besoin d'aucun serveur.

En plus, chaque matin de semaine vers 6 h 43 (heure de Madrid), une **tâche Claude planifiée** (« Pyxis – veille du matin ») lit la presse financière de référence, écrit `site/data/brief.json` et le pousse dans le dépôt : le site se republie tout seul avec la veille du jour.

**Ton portefeuille et ton journal restent dans ton navigateur.** Ils ne sont jamais envoyés dans le dépôt, qui est public.

## Organisation

| Dossier / fichier | Rôle |
|---|---|
| `site/` | Le site : `index.html`, `css/`, `js/`, `assets/` (logo, planche d'identité) |
| `site/data/` | Données produites chaque soir (et la veille chaque matin). Ne pas modifier à la main. |
| `site/content/lessons.js` | **Le parcours Apprendre** : 24 leçons, leurs quiz et leurs liens |
| `site/content/brokers.json` | **Le comparatif des courtiers** : tarifs, fiscalité, sources (date de vérification incluse) |
| `site/js/data.js` | Le lexique du débutant (`GLOSSARY`) |
| `pipeline/config.yaml` | **Les titres suivis, ta liste de surveillance et les séries macro.** C'est le fichier à modifier pour ajouter ou retirer un titre. |
| `pipeline/build.py` | Le chef d'orchestre de la mise à jour |
| `pipeline/sources.py` | Récupération des données, avec reprises sur erreur |
| `pipeline/quality.py` | Contrôles de cohérence (historique trop court, cours figé, saut de prix suspect…) |
| `pipeline/indicators.py` | Indicateurs techniques (RSI, tendance, volatilité, volumes…) |
| `pipeline/scoring.py` | Score, fourchette, type de signal, thèse, « Pourquoi je pourrais avoir tort » |
| `pipeline/macro.py` | Contexte économique et phase du cycle |
| `pipeline/backtest.py` | Test sur le passé de la partie « prix » du score (page Méthode) |
| `pipeline/tests/` | Tests automatiques (sans réseau) |
| `.github/workflows/update.yml` | La tâche automatique quotidienne |

## Ajouter un titre

1. Sur GitHub, ouvre `pipeline/config.yaml` et clique sur le crayon.
2. Ajoute le code Yahoo Finance du titre dans la bonne liste. Le code se trouve sur finance.yahoo.com ; par exemple `ITX.MC` pour Inditex à Madrid.
3. Clique sur **Commit changes** : la mise à jour se relance toute seule.

## Lancer une mise à jour à la main

Onglet **Actions** → **Mise à jour** → **Run workflow**.

## Si une mise à jour échoue

Le site garde les dernières données valides, et la pastille en haut de chaque page l'indique (« Mise à jour échouée » ou « Données anciennes »). Le détail des titres en erreur est dans `site/data/meta.json`.

Yahoo bloque parfois temporairement les serveurs de GitHub : la mise à jour du lendemain repasse en général sans problème.

## Le score, en bref

Pour chaque facteur, chaque titre est classé par rapport aux autres titres de son groupe (les actions d'un côté, les ETF de l'autre) :

| Facteur | Poids | Mesures |
|---|---|---|
| Valorisation | 25 % | PER, PER par rapport à son secteur, rendement du cash-flow libre, cours/valeur comptable |
| Qualité | 25 % | Marge nette, marge opérationnelle, rentabilité des capitaux propres, endettement |
| Tendance | 20 % | Hausse sur 12 mois (hors dernier mois), écart à la moyenne 200 jours, hausse sur 3 mois |
| Stabilité | 15 % | Volatilité, pire baisse sur un an, amplitude des séances |
| Contexte | 15 % | Adéquation du secteur à la phase du cycle |

Les types de signal suivent des règles explicites :

- **Valeur** : chute d'au moins 20 %, entreprise solide, cash-flow positif, et cours qui se stabilise (au-dessus de sa moyenne des 20 dernières séances, RSI d'au moins 35).
- **Contrarian** : même chute avec des fondamentaux corrects, mais la baisse continue. C'est une piste à surveiller, pas encore une thèse.
- **Couteau qui tombe** : chute avec des fondamentaux fragiles, ou une baisse qui accélère. Le titre est exclu des idées du jour.
- **Momentum** : tendance dans le haut de l'univers, au-dessus de la moyenne 200 jours, sans surchauffe (RSI sous 70).
- **Anomalie** : volume de la semaine au moins deux fois supérieur à la normale.

La fourchette d'incertitude reflète les données manquantes et le désaccord entre facteurs.

### Le test sur le passé

Chaque soir, `pipeline/backtest.py` rejoue les cinq dernières années mois par mois : il classe les actions selon les deux critères recalculables avec les seuls cours (tendance et stabilité), « achète » le tiers le mieux classé et compare à toutes les actions et à l'ETF monde. Le résultat, avec ses limites (biais du survivant, 35 % du score seulement, sans frais ni impôts), est sur la page **Méthode**.

## Travailler en local (facultatif)

```
pip install -r pipeline/requirements.txt
python -m pytest pipeline/tests -q      # tests
python -m pipeline.build                # mise à jour des données
python -m http.server 8000 -d site      # puis ouvrir http://localhost:8000
```

## Tes données personnelles

Profil, positions, journal et progression dans le parcours sont enregistrés dans le navigateur (`localStorage`), jamais dans le dépôt. Depuis **Réglages → Tes données**, tu peux télécharger une sauvegarde et la restaurer sur un autre appareil. Depuis **Portefeuille → Importer un relevé**, tu peux charger l'export CSV des transactions de ton courtier.

## Entretien

Voir [MAINTENANCE.md](MAINTENANCE.md) : ce qu'il faut vérifier, quand, et quoi faire si quelque chose casse.

## Feuille de route

1. Architecture ✅
2. Interface et identité ✅
3. Vraies données et scanner ✅
4. Test sur le passé et page Méthode ✅
5. Import des relevés, sauvegarde, comparatif des courtiers, parcours d'apprentissage complet ✅
6. Finitions et guide de maintenance ✅
