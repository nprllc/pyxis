# Entretenir Pyxis

Pyxis tourne tout seul. Ce guide dit ce qu'il faut regarder de temps en temps, et quoi faire si quelque chose casse. Aucune étape ne demande d'installer quoi que ce soit : tout se fait depuis GitHub, dans le navigateur.

## Ce qui tourne tout seul

| Quand | Quoi | Où |
|---|---|---|
| Chaque soir de semaine, 22 h 17 UTC | Cours, chiffres des entreprises, macro, score, test sur le passé, publication du site | GitHub → onglet **Actions** → « Mise à jour » |
| Chaque matin de semaine, 6 h 43 (Madrid) | Veille de presse rédigée par Claude, poussée dans `site/data/brief.json` | claude.ai → tâches planifiées → « Pyxis – veille du matin » |
| Chaque matin de semaine, 9 h 15 (Madrid, en hiver) | Relais : si la veille Claude manque, revue de presse ou digest par un autre modèle | GitHub → **Actions** → « Veille (relais) » |
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
| Échec plusieurs jours de suite | Yahoo a changé son format et la bibliothèque `yfinance` n'a pas encore suivi | La mise à jour installe toujours la dernière version de `yfinance` : en général, un correctif sort en quelques jours. Ouvre le détail de l'exécution en échec dans Actions et demande à Claude de regarder le message d'erreur |
| Un titre a disparu du Scanner | Son code Yahoo a changé ou n'existe plus | Regarde `site/data/meta.json`, champ `failed`. Corrige ou retire le code dans `config.yaml` |
| La veille est une « Revue de presse du matin » | La tâche Claude n'a pas tourné ce matin : le relais a pris le relais | Rien d'urgent. Sur claude.ai → tâches planifiées → « Pyxis – veille du matin », regarde la dernière exécution |
| La veille date de plusieurs jours | Ni la tâche Claude ni le relais n'ont pu publier (sources injoignables) | Actions → « Veille (relais) » : lis le journal de la dernière exécution |
| La page Méthode dit que le test « se calcule à la prochaine mise à jour » | Le test sur le passé a échoué ou n'a pas encore tourné | Relance une mise à jour à la main (onglet Actions → Mise à jour → Run workflow) |
| Mes positions ou mon journal ont disparu | Le navigateur a été vidé, ou tu es sur un autre appareil | Réglages → Tes données → Restaurer une sauvegarde. D'où l'intérêt d'en télécharger une de temps en temps |

## Changer de modèle pour la veille

La veille est écrite par ta tâche Claude (ton abonnement). Si un jour Claude ne te convient plus ou ne fonctionne plus, le relais peut écrire le digest avec un autre modèle :

1. Crée une clé d'API chez le fournisseur choisi (Mistral, Google Gemini, OpenAI ou Anthropic).
2. Sur GitHub : **Settings → Secrets and variables → Actions → New repository secret**. Nom : `MISTRAL_API_KEY` (ou `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`), valeur : la clé.
3. Dans `pipeline/config.yaml`, bloc `veille: providers:`, mets ce fournisseur en premier et vérifie le nom du modèle (les fournisseurs en sortent de nouveaux régulièrement). Tout fournisseur compatible OpenAI marche aussi : `provider: openai-compatible`, avec `base_url`.
4. Si tu arrêtes la tâche Claude, le relais écrira la veille chaque matin. Pour la décaler plus tôt, change l'heure `cron` dans `.github/workflows/veille.yml`.

Pour essayer sans rien publier : **Actions → Veille (relais) → Run workflow**, coche « Essai », puis lis le résultat dans le journal de l'exécution.

## Pyxis, l'assistant

Le signe Pyxis à côté de chaque section ouvre une conversation. Le modèle se règle dans **Réglages → Pyxis, ton assistant** : fournisseur (Claude, Mistral, Gemini, OpenAI, ou tout service compatible OpenAI), nom du modèle, clé d'API. La clé reste dans ton navigateur, jamais dans le dépôt ni dans les sauvegardes : sur un autre appareil, il faut la recoller.

Si Pyxis répond « erreur » : le nom du modèle a peut-être été retiré par le fournisseur (mets le nom du modèle actuel), ou la clé a expiré. Le bouton « Enregistrer et tester » vérifie tout en une seconde.

## Relancer une mise à jour à la main

GitHub → onglet **Actions** → **Mise à jour** → bouton **Run workflow** → **Run workflow**. Compte trois à cinq minutes.

## Ce qui coûte de l'argent

Rien côté site : GitHub Pages et GitHub Actions sont gratuits pour un dépôt public, et les sources de données (Yahoo Finance, Stooq, FRED) sont gratuites. La veille utilise ton abonnement Claude. Le relais est gratuit sans clé (revue de presse) ; avec une clé, il coûte ce que facture le fournisseur, en général quelques centimes par jour (Mistral et Gemini ont des offres gratuites).
