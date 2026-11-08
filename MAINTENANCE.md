# Entretenir Pyxis

Pyxis tourne tout seul. Ce guide dit ce qu'il faut regarder de temps en temps, et quoi faire si quelque chose casse. Aucune étape ne demande d'installer quoi que ce soit : tout se fait depuis GitHub, dans le navigateur.

## Ce qui tourne tout seul

| Quand | Quoi | Où |
|---|---|---|
| Chaque soir de semaine, 22 h 17 UTC | Cours, chiffres des entreprises, macro, score, test sur le passé, publication du site | GitHub → onglet **Actions** → « Mise à jour » |
| Chaque matin de semaine, 6 h 43 (Madrid) | Veille de presse rédigée par Claude, poussée dans `site/data/brief.json` | claude.ai → tâches planifiées → « Pyxis – veille du matin » |
| À chaque modification du dépôt | Les tests, puis la mise à jour et la publication | GitHub → **Actions** |

## Le petit contrôle

**Chaque semaine (30 secondes).** Ouvre le site. La pastille en haut à droite doit dire « Cours du … » avec une pastille verte et la date de la dernière séance. Orange (« Données anciennes ») ou rouge (« Mise à jour échouée ») : voir plus bas.

**Chaque trimestre (15 minutes).** Les tarifs des courtiers changent souvent (Revolut a changé les siens en octobre 2026).
1. Ouvre `site/content/brokers.json` sur GitHub.
2. Pour chaque courtier, ouvre les liens de `sources` et compare aux champs `etf_order`, `stock_order`, `plan`, `fx` et au bloc `model` (qui sert au calcul).
3. Corrige ce qui a changé, mets à jour la date `checked` en haut du fichier, puis **Commit changes**.

Tu peux aussi demander à Claude : « Revérifie les tarifs de brokers.json de Pyxis avec des sources anglaises et françaises ».

**Chaque année, en janvier (10 minutes).** Le barème fiscal espagnol de l'épargne peut changer avec la loi de finances.
1. Vérifie le barème sur le site de l'Agencia Tributaria (ou demande à ton gestor).
2. S'il a changé, corrige la leçon « Tes impôts sur les placements, en Espagne » dans `site/content/lessons.js` (cherche `id: "fiscalite"`), y compris la ligne « Sources … Vérifié le … » et le quiz.

## Modifier le contenu

| Pour… | Fichier | Comment |
|---|---|---|
| Ajouter ou retirer un titre suivi | `pipeline/config.yaml` | Ajoute son code Yahoo Finance (ex. `ITX.MC`) dans la bonne liste |
| Corriger ou ajouter un mot du lexique | `site/js/data.js`, bloc `GLOSSARY` | Une ligne par mot : `cle: ["Nom", "Définition simple", "Exemple"]` |
| Corriger une leçon | `site/content/lessons.js` | Chaque leçon a un `body` (texte), un `keep` (à retenir), un `quiz` et un `apply` (lien). Dans le texte, `[[cle|mot]]` souligne un mot du lexique |
| Changer la veille (sources, ton, longueur) | La tâche planifiée sur claude.ai | Modifie ses instructions. Les sources autorisées et interdites y sont listées |

Après chaque modification sur GitHub, le site se republie en deux à trois minutes.

## Si quelque chose casse

| Ce que tu vois | Cause probable | Que faire |
|---|---|---|
| Pastille rouge « Mise à jour échouée » | Yahoo a bloqué les serveurs de GitHub ce soir-là | Rien : le site garde les données de la veille. Si ça dure plus de 3 jours, voir la ligne suivante |
| Échec plusieurs jours de suite | La bibliothèque `yfinance` doit être mise à jour (Yahoo change régulièrement son format) | Ouvre `pipeline/requirements.txt`, remplace la version de `yfinance` par la dernière (voir pypi.org/project/yfinance), commit. Ou demande à Claude de le faire |
| Un titre a disparu du Scanner | Son code Yahoo a changé ou n'existe plus | Regarde `site/data/meta.json`, champ `failed`. Corrige ou retire le code dans `config.yaml` |
| La veille date de plusieurs jours | La tâche planifiée n'a pas tourné, ou n'a pas pu pousser | claude.ai → tâches planifiées → « Pyxis – veille du matin » : regarde la dernière exécution, relance-la à la main |
| La page Méthode dit que le test « se calcule à la prochaine mise à jour » | Le test sur le passé a échoué ou n'a pas encore tourné | Relance une mise à jour à la main (onglet Actions → Mise à jour → Run workflow) |
| Mes positions ou mon journal ont disparu | Le navigateur a été vidé, ou tu es sur un autre appareil | Réglages → Tes données → Restaurer une sauvegarde. D'où l'intérêt d'en télécharger une de temps en temps |

## Relancer une mise à jour à la main

GitHub → onglet **Actions** → **Mise à jour** → bouton **Run workflow** → **Run workflow**. Compte trois à cinq minutes.

## Ce qui coûte de l'argent

Rien côté site : GitHub Pages et GitHub Actions sont gratuits pour un dépôt public, et les sources de données (Yahoo Finance, Stooq, FRED) sont gratuites. La veille utilise ton abonnement Claude.
