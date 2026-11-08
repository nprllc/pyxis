/* =========================================================================
   Pyxis · Le parcours « Apprendre »
   4 modules × 6 leçons courtes, écrites pour quelqu'un qui part de zéro.

   Petites conventions d'écriture, transformées à l'affichage :
     [[cle|texte]]   mot du lexique (souligné, s'explique au survol)
     {{live:nom}}    encadré calculé sur les vraies données Pyxis du jour
     {{sim:nom}}     petit simulateur interactif
   Chaque leçon : corps, « À retenir », quiz de 3 questions, lien pour appliquer.
   Les chiffres historiques sont arrondis et donnés comme ordres de grandeur.
   ========================================================================= */
(function () {
  const modules = [
    { id: "bases", n: 1, title: "Les bases", lede: "Les mots indispensables, et ce qu'on achète vraiment quand on investit." },
    { id: "duree", n: 2, title: "Investir dans la durée", lede: "Pourquoi le temps, la régularité et la diversification font l'essentiel du travail." },
    { id: "analyser", n: 3, title: "Analyser une entreprise", lede: "Lire un cours, des comptes, un avis d'analystes et le score Pyxis sans se faire avoir." },
    { id: "toi", n: 4, title: "Le marché et toi", lede: "L'économie, tes propres réflexes, tes impôts en Espagne, et ton premier achat." },
  ];

  const lessons = [
    /* ============================ MODULE 1 ============================ */
    {
      id: "bases", module: "bases", minutes: 4,
      title: "Une action, la bourse : de quoi parle-t-on ?",
      body: `
<p>Investir en bourse, c'est acheter des morceaux d'entreprises en espérant qu'ils prennent de la valeur avec le temps, et parfois qu'ils te versent une part des bénéfices.</p>
<h3>Une action</h3>
<p>Une [[action|action]] est un tout petit morceau d'une entreprise. Acheter une action Inditex, c'est devenir copropriétaire, pour une part minuscule, de Zara. Si l'entreprise gagne plus d'argent au fil des années, ta part vaut en général plus cher. Si elle va mal, elle perd de la valeur, et elle peut tomber à zéro en cas de faillite.</p>
<h3>Ce que l'action peut te rapporter</h3>
<p>Deux choses : la hausse de son prix (tu revends plus cher que tu as acheté) et le [[dividende|dividende]], une partie des bénéfices que certaines entreprises reversent chaque année à leurs actionnaires.</p>
<h3>La bourse</h3>
<p>La [[bourse|bourse]] est le marché où ces morceaux s'échangent entre acheteurs et vendeurs. Le prix bouge toute la journée : s'il y a plus de gens qui veulent acheter que de gens qui veulent vendre, il monte. Il n'y a pas de « juste prix » affiché quelque part : le prix, c'est le dernier échange.</p>
<p>Chaque jour d'ouverture s'appelle une [[seance|séance]]. Les bourses européennes sont ouvertes en semaine, à peu près de 9 h à 17 h 30.</p>
{{live:market}}`,
      keep: "Une action est un morceau d'entreprise. Elle rapporte si l'entreprise prospère (hausse du prix, dividendes), et peut perdre beaucoup, voire tout, si elle va mal.",
      quiz: [
        { q: "Tu achètes une action Inditex. Qu'est-ce que tu possèdes ?", o: ["Un prêt fait à Inditex", "Une toute petite part de l'entreprise", "Un bon de réduction chez Zara"], a: 1, why: "Une action est une part de propriété. Un prêt, ce serait une obligation." },
        { q: "Pourquoi le prix d'une action monte-t-il pendant une séance ?", o: ["Parce que l'entreprise l'a décidé", "Parce qu'il y a plus d'acheteurs que de vendeurs à ce moment-là", "Parce que la banque centrale l'a fixé"], a: 1, why: "Le prix résulte de l'offre et de la demande, échange après échange." },
        { q: "Quel est le pire scénario pour une action seule ?", o: ["Elle ne bouge plus", "Elle tombe à zéro si l'entreprise fait faillite", "Elle est convertie en ETF"], a: 1, why: "C'est pour ça qu'on ne met jamais tout sur une seule entreprise." },
      ],
      apply: { href: "#scanner", label: "Voir les entreprises suivies dans le Scanner" },
    },
    {
      id: "indice", module: "bases", minutes: 3,
      title: "Un indice, c'est le thermomètre du marché",
      body: `
<p>Quand on entend « le CAC 40 a perdu 1 % », on ne parle pas d'une entreprise mais d'un [[indice|indice]] : une liste d'entreprises dont on suit la valeur d'ensemble.</p>
<h3>Quelques indices à connaître</h3>
<p><b>CAC 40</b> : les 40 plus grandes entreprises françaises. <b>IBEX 35</b> : les 35 plus grandes espagnoles. <b>S&P 500</b> : 500 grandes entreprises américaines. <b>MSCI World</b> : environ 1 300 à 1 400 grandes entreprises de 23 pays développés.</p>
<h3>Pondéré par la taille</h3>
<p>Dans la plupart des indices, chaque entreprise pèse selon sa taille en bourse. Une géante comme Apple compte bien plus qu'une petite entreprise. Conséquence : un indice peut monter grâce à quelques géants pendant que la majorité des entreprises baissent.</p>
<p>C'est pour ça que Pyxis regarde aussi la [[largeur|largeur du marché]] : combien de titres montent et combien baissent, chacun comptant pour un.</p>
{{live:market}}`,
      keep: "Un indice résume un marché. Il est pondéré par la taille : quelques géants peuvent le tirer à eux seuls. Regarder la largeur du marché complète le tableau.",
      quiz: [
        { q: "Le S&P 500, c'est…", o: ["Une entreprise américaine", "Une liste de 500 grandes entreprises américaines", "Un courtier"], a: 1, why: "C'est un indice : une liste suivie pour mesurer la santé du marché américain." },
        { q: "L'indice monte de 0,5 % mais 70 % des titres baissent. C'est possible ?", o: ["Non, c'est impossible", "Oui, si quelques très grosses entreprises montent fort", "Seulement le week-end"], a: 1, why: "Les géants pèsent beaucoup plus dans l'indice : ils peuvent masquer une majorité en baisse." },
        { q: "Combien d'entreprises environ dans le MSCI World ?", o: ["40", "500", "Entre 1 300 et 1 400"], a: 2, why: "Le MSCI World couvre les grandes et moyennes entreprises de 23 pays développés." },
      ],
      apply: { href: "#", label: "Voir la santé du marché sur Aujourd'hui" },
    },
    {
      id: "etf", module: "bases", minutes: 4,
      title: "Un ETF : le panier tout prêt",
      body: `
<p>Choisir les bonnes entreprises est difficile, même pour les professionnels : la majorité des fonds gérés par des experts font moins bien que leur indice sur 10 ou 15 ans, une fois leurs frais payés. D'où l'idée de l'[[etf|ETF]].</p>
<h3>Le principe</h3>
<p>Un ETF (de l'anglais <i>exchange-traded fund</i>, fonds coté en bourse) est un panier qui copie un indice. Il achète automatiquement toutes les entreprises de la liste, dans les bonnes proportions. Toi, tu achètes une « part du panier », comme une action, et tu possèdes indirectement un petit bout de chacune.</p>
<h3>Pourquoi c'est intéressant</h3>
<p>Il ne coûte presque rien : autour de 0,1 à 0,3 % par an pour les grands ETF, prélevés discrètement dans le prix. Il est diversifié d'office : si une entreprise s'effondre, elle ne pèse presque rien dans le total. Et il ne demande aucun travail : le panier se met à jour tout seul.</p>
<h3>Capitalisant ou distribuant</h3>
<p>Un ETF « [[capitalisant|capitalisant]] » (souvent marqué <b>Acc</b>) réinvestit lui-même les dividendes reçus. Un ETF « distribuant » (<b>Dist</b>) te les verse. Pour faire grossir une petite épargne, le capitalisant est plus simple, et en Espagne tu n'es imposé qu'au moment où tu revends.</p>
<h3>Le code ISIN</h3>
<p>Chaque ETF a un [[isin|code ISIN]] de 12 caractères. Des dizaines d'ETF ont des noms presque identiques : c'est l'ISIN qui évite de se tromper.</p>`,
      keep: "Un ETF copie un indice pour un coût très faible. En une seule ligne, tu possèdes des centaines d'entreprises. Un ETF « Acc » réinvestit les dividendes à ta place.",
      quiz: [
        { q: "Que fait un ETF qui copie le MSCI World ?", o: ["Il choisit les meilleures entreprises du monde", "Il achète toutes les entreprises de l'indice, selon leur poids", "Il prête ton argent aux entreprises"], a: 1, why: "Un ETF indiciel ne choisit rien : il réplique la liste." },
        { q: "Un ETF « Acc », c'est…", o: ["Un ETF qui réinvestit les dividendes", "Un ETF réservé aux experts", "Un ETF plus risqué"], a: 0, why: "Acc pour accumulating, capitalisant : les dividendes restent dans le fonds." },
        { q: "Pourquoi noter l'ISIN avant d'acheter ?", o: ["Pour payer moins d'impôts", "Parce que plusieurs produits ont des noms presque identiques", "C'est obligatoire pour se connecter"], a: 1, why: "L'ISIN identifie un produit de façon unique." },
      ],
      apply: { href: "#scanner", label: "Voir les ETF suivis dans le Scanner" },
    },
    {
      id: "etf-monde", module: "bases", minutes: 4,
      title: "Ce qu'il y a vraiment dans un ETF monde",
      body: `
<p>Un [[etfMonde|ETF monde]] est le panier le plus utilisé pour démarrer. Mais « monde » ne veut pas dire « réparti également sur la planète ».</p>
<h3>Ce qu'il contient</h3>
<p>Les grandes entreprises de 23 pays développés, chacune selon sa taille. Les États-Unis en représentent environ 70 %, et la dizaine de plus grosses entreprises (Apple, Microsoft, Nvidia, Amazon…) pèse à elle seule autour d'un quart du total.</p>
<h3>Ce qu'il ne contient pas</h3>
<p>Les pays émergents (Chine, Inde, Brésil…) et les petites entreprises. Les ETF dits « All-World » (comme celui de Vanguard, suivi dans Pyxis) ajoutent les pays émergents, pour environ 10 % du panier.</p>
<h3>Ce que ça implique</h3>
<p>Ton ETF monde dépend beaucoup de l'économie américaine, des géants de la technologie et du dollar. Ce n'est pas un défaut caché : c'est le reflet de la taille réelle de ces entreprises. Mais il faut le savoir, pour ne pas croire qu'on est « couvert sur tout ».</p>
{{live:world}}`,
      keep: "Un ETF monde, c'est environ 1 400 entreprises, mais 70 % d'américaines et un gros poids des géants de la tech. Il reste le meilleur point de départ pour une petite épargne.",
      quiz: [
        { q: "Quelle part environ des États-Unis dans un ETF MSCI World ?", o: ["Environ 20 %", "Environ 50 %", "Environ 70 %"], a: 2, why: "Le poids suit la taille des entreprises, et les plus grosses sont américaines." },
        { q: "Qu'ajoute un ETF « All-World » par rapport au MSCI World ?", o: ["Les pays émergents", "Les cryptomonnaies", "Les obligations"], a: 0, why: "Il ajoute la Chine, l'Inde, le Brésil, etc., pour environ un dixième du panier." },
        { q: "« Monde » veut dire que chaque pays pèse autant. Vrai ?", o: ["Vrai", "Faux"], a: 1, why: "Chaque entreprise pèse selon sa taille en bourse, d'où la domination américaine." },
      ],
      apply: { href: "#fiche-EUNL.DE", label: "Ouvrir la fiche de l'ETF MSCI World" },
    },
    {
      id: "ordres", module: "bases", minutes: 5,
      title: "Le courtier et les ordres de bourse",
      body: `
<p>Tu ne peux pas acheter directement à la bourse : tu passes par un [[courtier|courtier]], aujourd'hui une simple application. C'est lui qui transmet tes ordres et garde tes titres à ton nom.</p>
<h3>Tes titres sont-ils en sécurité ?</h3>
<p>Les titres achetés t'appartiennent et sont séparés des comptes du courtier. En Europe, si un courtier fait faillite, un fonds de garantie couvre en plus un éventuel manque, en général jusqu'à 20 000 € par personne. Vérifie toujours qu'il est régulé (BaFin en Allemagne, CNMV en Espagne, AMF en France…).</p>
<h3>Deux façons d'acheter</h3>
<p><b>L'ordre au marché</b> : « achète tout de suite, au prix disponible ». Simple, mais sur un titre peu échangé tu peux payer plus cher que prévu.</p>
<p><b>L'[[ordreLimite|ordre à cours limité]]</b> : « achète, mais pas au-dessus de tel prix ». Tu gardes le contrôle. C'est l'ordre à privilégier.</p>
<h3>L'écart entre achat et vente</h3>
<p>À chaque instant, il y a un prix pour acheter et un prix un peu plus bas pour vendre. Cet [[spread|écart]] (le <i>spread</i>) est un coût caché. Il est plus faible quand la bourse du titre est ouverte et que beaucoup de gens l'échangent : achète plutôt en pleine séance qu'à l'ouverture ou le soir.</p>
<h3>Le plan programmé</h3>
<p>La plupart des courtiers proposent un [[dca|plan d'investissement programmé]] : chaque mois, le même montant est investi automatiquement dans l'ETF choisi, souvent sans frais. C'est la façon la plus simple de démarrer.</p>`,
      keep: "Choisis un courtier régulé. Préfère l'ordre à cours limité, achète pendant les heures d'ouverture, et pour un ETF utilise le plan programmé.",
      quiz: [
        { q: "Quel ordre te protège d'un prix d'achat trop élevé ?", o: ["L'ordre au marché", "L'ordre à cours limité", "Le virement SEPA"], a: 1, why: "Tu fixes un prix maximum : l'ordre ne s'exécute pas au-dessus." },
        { q: "Ton courtier fait faillite. Tes ETF…", o: ["Sont perdus", "Restent à ton nom, séparés de ses comptes", "Sont transformés en euros"], a: 1, why: "Les titres sont ségrégués, et un fonds de garantie couvre un éventuel manque." },
        { q: "Quand l'écart achat/vente est-il le plus faible ?", o: ["À 22 h", "En pleine séance, quand le titre s'échange beaucoup", "Le dimanche"], a: 1, why: "Plus il y a d'échanges, plus les prix d'achat et de vente sont serrés." },
      ],
      apply: { href: "#courtiers", label: "Comparer les courtiers pour ton cas" },
    },
    {
      id: "frais", module: "bases", minutes: 4,
      title: "Ce que les frais coûtent vraiment",
      body: `
<p>Les [[frais|frais]] paraissent minuscules : 1 €, 0,2 %, 1,5 %… Mais ils sont certains, alors que le rendement ne l'est pas. Et ils se cumulent.</p>
<h3>Deux sortes de frais</h3>
<p><b>Les frais d'achat</b>, payés à chaque ordre. 1 € sur un achat de 20 €, c'est déjà 5 % perdus d'entrée : il faut que le titre monte de 5 % juste pour revenir à zéro.</p>
<p><b>Les frais annuels</b> du fonds, prélevés chaque année sur tout ce que tu as accumulé. Un grand ETF coûte environ 0,2 % par an ; beaucoup de fonds vendus en agence bancaire coûtent 1,5 à 2 %.</p>
<h3>Fais l'essai</h3>
<p>Le simulateur compare la même épargne avec deux niveaux de frais annuels. L'écart se creuse avec les années, parce que les frais rongent aussi les gains des années précédentes.</p>
{{sim:fees}}`,
      keep: "Les frais sont la seule chose certaine en bourse. Regroupe tes achats pour que les frais d'ordre restent sous 1 %, et choisis des fonds à frais annuels bas.",
      quiz: [
        { q: "Un achat de 20 € avec 1 € de frais te coûte…", o: ["0,5 %", "5 %", "20 %"], a: 1, why: "1 divisé par 20, c'est 5 % : le titre doit monter d'autant pour que tu retrouves ta mise." },
        { q: "Pourquoi 1,8 % de frais annuels coûtent-ils si cher sur 20 ans ?", o: ["Parce qu'ils sont prélevés aussi sur les gains accumulés, chaque année", "Parce qu'ils doublent chaque année", "Ils ne coûtent pas cher"], a: 0, why: "Les frais s'appliquent à tout ton capital, y compris aux gains : l'effet boule de neige joue contre toi." },
        { q: "Quelle est la seule chose certaine quand tu investis ?", o: ["Le rendement", "Les frais", "Le dividende"], a: 1, why: "Le rendement est incertain ; les frais, eux, seront prélevés quoi qu'il arrive." },
      ],
      apply: { href: "#courtiers", label: "Calculer tes frais selon le courtier" },
    },

    /* ============================ MODULE 2 ============================ */
    {
      id: "interets", module: "duree", minutes: 5,
      title: "Les intérêts composés : la boule de neige",
      body: `
<p>Les [[interets|intérêts composés]], c'est quand tes gains rapportent à leur tour des gains. La première année, ça ne se voit presque pas. Au bout de vingt ans, c'est souvent la plus grosse partie de ton épargne.</p>
<h3>Un exemple simple</h3>
<p>100 € qui rapportent 7 % deviennent 107 € au bout d'un an. L'année suivante, les 7 % s'appliquent à 107 €, pas à 100 € : tu gagnes 7,49 €. Puis 8,01 €. Et ainsi de suite.</p>
<h3>La règle de 72</h3>
<p>Pour estimer le temps qu'il faut pour doubler une somme, divise 72 par le rendement annuel. À 7 % par an, environ 10 ans. À 3,5 %, environ 20 ans.</p>
<h3>Attention aux promesses</h3>
<p>Sur plusieurs décennies, les actions mondiales ont rapporté en moyenne quelque chose comme 6 à 8 % par an, dividendes compris. Mais cette moyenne cache des années à −40 % et d'autres à +30 %. Le simulateur ci-dessous suppose un rendement régulier, ce qui n'existe pas : prends-le comme un ordre de grandeur, pas une promesse.</p>
{{sim:compound}}`,
      keep: "Le temps fait le gros du travail : commencer tôt compte plus que mettre beaucoup. Mais aucun rendement n'est garanti, et les moyennes cachent de fortes baisses.",
      quiz: [
        { q: "Avec la règle de 72, combien de temps pour doubler à 6 % par an ?", o: ["6 ans", "12 ans", "72 ans"], a: 1, why: "72 divisé par 6 donne 12 ans environ." },
        { q: "Pourquoi les gains accélèrent-ils avec le temps ?", o: ["Parce que les gains produisent eux-mêmes des gains", "Parce que la bourse monte plus vite chaque année", "Parce que les frais baissent"], a: 0, why: "C'est l'effet boule de neige : le rendement s'applique à un montant qui grossit." },
        { q: "Un rendement moyen de 7 % par an signifie…", o: ["Que tu gagneras 7 % chaque année", "Une moyenne sur longue période, avec des années très négatives", "Un rendement garanti par la loi"], a: 1, why: "La moyenne lisse des années à −40 % et d'autres à +30 %." },
      ],
      apply: { href: "#portefeuille", label: "Voir la projection de ton plan" },
    },
    {
      id: "dca", module: "duree", minutes: 4,
      title: "Investir chaque mois, sans chercher le bon moment",
      body: `
<p>Personne ne sait prévoir les hauts et les bas du marché de façon fiable, pas même les professionnels. La parade la plus simple : investir la même somme à date fixe, quoi qu'il arrive. C'est l'[[dca|investissement programmé]].</p>
<h3>Ce que ça change</h3>
<p>Quand les prix sont bas, tes 80 € achètent plus de parts. Quand ils sont hauts, ils en achètent moins. Sur la durée, ton prix moyen se lisse, et surtout tu n'as jamais à te demander « est-ce le bon moment ? ».</p>
<h3>Le vrai avantage : la discipline</h3>
<p>Le principal intérêt n'est pas mathématique, il est psychologique. Un plan automatique t'empêche d'arrêter d'acheter quand tout baisse (souvent le meilleur moment) ou de tout miser quand tout le monde s'enthousiasme (souvent le pire).</p>
<h3>Et si j'ai une grosse somme d'un coup ?</h3>
<p>Les études montrent qu'investir une somme en une fois fait en moyenne un peu mieux, parce que le marché monte plus souvent qu'il ne baisse. Mais l'étaler sur quelques mois réduit le regret si une chute arrive juste après. Les deux se défendent.</p>`,
      keep: "Investir la même somme chaque mois t'évite de deviner le bon moment et te protège de tes propres émotions. C'est la base de ton plan.",
      quiz: [
        { q: "Le marché baisse de 20 %. Ton plan programmé…", o: ["Achète plus de parts avec le même montant", "S'arrête automatiquement", "Vend tes parts"], a: 0, why: "Prix plus bas, même montant : tu obtiens plus de parts." },
        { q: "Le principal intérêt de l'investissement programmé ?", o: ["Il garantit un gain", "Il supprime la tentation de deviner le bon moment", "Il supprime les frais"], a: 1, why: "Il n'y a rien à décider chaque mois : c'est la discipline qui paie." },
        { q: "Prévoir les creux du marché, c'est…", o: ["Facile avec un peu d'entraînement", "Très difficile, même pour les professionnels", "Interdit"], a: 1, why: "Les études montrent que presque personne n'y parvient régulièrement." },
      ],
      apply: { href: "#reglages", label: "Régler ton montant mensuel" },
    },
    {
      id: "diversification", module: "duree", minutes: 4,
      title: "Ne pas mettre tous ses œufs dans le même panier",
      body: `
<p>La [[diversification|diversification]], c'est posséder beaucoup de choses différentes pour qu'un accident sur l'une ne te ruine pas.</p>
<h3>Le risque d'une entreprise seule</h3>
<p>Une entreprise peut perdre la moitié de sa valeur en un jour sur une mauvaise nouvelle, ou disparaître. Des noms célèbres l'ont fait. Dans un panier de 1 400 entreprises, la même chute ne bouge presque rien.</p>
<h3>Ce que la diversification n'efface pas</h3>
<p>Quand c'est toute l'économie qui recule, presque tout baisse en même temps. Un ETF monde a perdu environ 40 % en 2008. La diversification protège de l'accident individuel, pas d'une crise générale. Seul le temps aide face à celle-ci.</p>
<h3>Diversifier pour de vrai</h3>
<p>Dix actions de la même industrie, ce n'est pas diversifié. Pyxis limite la part d'une seule ligne (dans tes Réglages) et regarde le secteur des idées qu'il te montre, pour éviter de tout concentrer au même endroit.</p>
{{live:vol}}`,
      keep: "Diversifier protège d'une catastrophe sur une entreprise, pas d'une crise de tout le marché. Face à celle-ci, c'est le temps qui joue pour toi.",
      quiz: [
        { q: "Une action de ton panier de 1 400 entreprises chute de 50 %. Effet sur ton ETF ?", o: ["−50 %", "Presque rien", "L'ETF est suspendu"], a: 1, why: "Elle ne pèse qu'une toute petite part du panier." },
        { q: "En 2008, un ETF monde a perdu environ…", o: ["5 %", "40 %", "90 %"], a: 1, why: "Une crise générale touche presque tout : la diversification ne l'évite pas." },
        { q: "10 actions de banques, c'est bien diversifié ?", o: ["Oui, 10 c'est beaucoup", "Non, elles dépendent des mêmes risques"], a: 1, why: "Elles réagiront ensemble aux mêmes événements." },
      ],
      apply: { href: "#portefeuille", label: "Vérifier la diversification de ton portefeuille" },
    },
    {
      id: "volatilite", module: "duree", minutes: 5,
      title: "Volatilité et baisses : pourquoi ça monte et ça descend",
      body: `
<p>La [[volatilite|volatilité]] mesure à quel point un prix s'agite. Plus elle est forte, plus les variations sont amples, dans les deux sens.</p>
<h3>Les baisses font partie du chemin</h3>
<p>Une baisse de 10 % sur les actions mondiales arrive en moyenne à peu près une fois par an ou tous les deux ans. Une baisse de 20 % ou plus, quelques fois par décennie. En mars 2020, le marché a chuté d'un tiers en un mois, puis retrouvé son niveau en quelques mois. Après 2000 ou 2008, il a fallu des années.</p>
<h3>La perte maximale</h3>
<p>La [[drawdown|perte maximale]] est la pire chute entre un sommet et le creux suivant. C'est le chiffre à regarder en face : « est-ce que je tiendrais sans vendre si mon épargne perdait autant ? ».</p>
<h3>Une perte n'est réelle qu'à la vente</h3>
<p>Tant que tu ne vends pas, une baisse est une perte [[latent|latente]] : sur le papier. Vendre en pleine panique, c'est transformer une baisse temporaire en perte définitive. C'est l'erreur la plus coûteuse des débutants.</p>
{{live:vol}}`,
      keep: "Les baisses de 10 à 30 % sont normales et reviennent régulièrement. Avant d'investir, demande-toi combien tu supporterais de voir baisser sans vendre.",
      quiz: [
        { q: "Ton ETF perd 15 % mais tu ne vends pas. Ta perte est…", o: ["Définitive", "Latente : elle n'existe que sur le papier", "Remboursée par le courtier"], a: 1, why: "Une perte ne devient réelle qu'au moment où tu vends." },
        { q: "Une baisse de 10 % du marché mondial, c'est…", o: ["Rarissime", "Fréquent : environ une fois par an ou tous les deux ans", "Le signe d'une faillite"], a: 1, why: "C'est une respiration normale du marché." },
        { q: "La perte maximale d'un titre, c'est…", o: ["Son plus mauvais jour", "Sa pire chute entre un sommet et le creux suivant", "Le prix d'achat moins les frais"], a: 1, why: "Elle mesure la pire épreuve qu'un investisseur aurait dû traverser." },
      ],
      apply: { href: "#scanner", label: "Comparer la volatilité des titres" },
    },
    {
      id: "coeur-satellite", module: "duree", minutes: 4,
      title: "Cœur et satellite : apprendre sans tout risquer",
      body: `
<p>Tu veux apprendre à analyser des entreprises, mais sans mettre ton épargne en jeu. La méthode [[coeur|cœur et satellite]] sépare les deux.</p>
<h3>Le cœur, 70 à 90 %</h3>
<p>Un ETF monde, alimenté chaque mois par ton plan programmé, que tu ne touches pas. C'est lui qui fait le gros du travail sur la durée.</p>
<h3>Le satellite, 10 à 30 %</h3>
<p>Quelques actions choisies, pour apprendre et peut-être faire un peu mieux. Si tes choix sont mauvais, le cœur limite les dégâts. Pyxis te propose des idées pour ce satellite, avec leur score et ce qui pourrait les rendre fausses.</p>
<h3>Une règle utile</h3>
<p>Mets la part satellite de côté jusqu'à environ 100 € avant d'acheter une action : en dessous, les frais d'achat pèsent trop. Et compare toujours ton satellite à ton cœur : si tes choix font moins bien que l'ETF monde sur plusieurs années, c'est une leçon précieuse, pas un échec.</p>`,
      keep: "Le cœur (ETF monde, automatique) protège ton épargne ; le satellite (quelques actions) te sert à apprendre. Compare toujours le satellite au cœur.",
      quiz: [
        { q: "Quelle part de ton épargne va dans le cœur ?", o: ["10 à 30 %", "70 à 90 %", "100 %"], a: 1, why: "Le cœur est la grosse part, stable et diversifiée." },
        { q: "À quoi sert le satellite ?", o: ["À apprendre et tenter de faire un peu mieux, sur une petite part", "À remplacer l'ETF monde", "À payer les frais"], a: 0, why: "Il limite le risque de tes apprentissages à une petite part." },
        { q: "Ton satellite fait moins bien que l'ETF monde depuis 3 ans. Tu en conclus…", o: ["Rien du tout", "Qu'il vaudrait peut-être mieux tout mettre dans le cœur", "Qu'il faut doubler la mise"], a: 1, why: "C'est le test le plus honnête de tes choix." },
      ],
      apply: { href: "#journal", label: "Comparer tes décisions au marché dans le Journal" },
    },
    {
      id: "precaution", module: "duree", minutes: 4,
      title: "Avant d'investir : l'épargne de précaution",
      body: `
<p>L'argent placé en bourse doit pouvoir rester investi plusieurs années, même pendant une crise. Sinon, tu risques de devoir vendre au pire moment.</p>
<h3>Le matelas d'abord</h3>
<p>C'est l'[[precaution|épargne de précaution]]. Garde de côté, sur un compte disponible, de quoi couvrir plusieurs mois de dépenses : on conseille souvent 3 à 6 mois. Pour un travailleur indépendant, dont les revenus varient, plutôt le haut de la fourchette, voire plus.</p>
<h3>L'horizon</h3>
<p>L'argent dont tu auras besoin dans moins de 5 ans (un achat, un apport, des impôts à payer) n'a rien à faire en actions. Sur une période courte, une baisse de 30 % est tout à fait possible au mauvais moment.</p>
<h3>Les dettes chères</h3>
<p>Rembourser un crédit à la consommation à 8 ou 10 %, c'est un « rendement » garanti que la bourse ne t'offrira pas. Ça passe avant.</p>
<p>Une fois ces trois cases cochées, investir 100 € par mois en bourse devient un risque que tu peux vraiment te permettre.</p>`,
      keep: "D'abord un matelas de plusieurs mois de dépenses, pas de dette chère, et seulement de l'argent dont tu n'auras pas besoin avant 5 ans en bourse.",
      quiz: [
        { q: "Tu auras besoin de cet argent dans 2 ans. En actions ?", o: ["Oui, c'est le plus rentable", "Non, l'horizon est trop court"], a: 1, why: "Sur deux ans, une baisse importante au mauvais moment est tout à fait possible." },
        { q: "Pour un indépendant, l'épargne de précaution doit être…", o: ["Plus faible qu'un salarié", "Plutôt plus élevée, car les revenus varient", "Inutile"], a: 1, why: "Les revenus irréguliers demandent un matelas plus épais." },
        { q: "Tu as un crédit à 9 %. Priorité ?", o: ["Investir en bourse", "Rembourser le crédit"], a: 1, why: "Rembourser, c'est un gain sûr de 9 % ; la bourse n'offre rien de garanti." },
      ],
      apply: { href: "#reglages", label: "Revoir ton profil dans Réglages" },
    },

    /* ============================ MODULE 3 ============================ */
    {
      id: "lire-cours", module: "analyser", minutes: 4,
      title: "Lire un cours et un graphique",
      body: `
<p>Sur la fiche d'un titre, Pyxis affiche son prix et plusieurs variations. Voici comment les lire sans se raconter d'histoires.</p>
<h3>Les variations</h3>
<p>« +2 % sur la séance » dit ce qui s'est passé hier. « −8 % sur un mois » dit la tendance récente. « +15 % sur 12 mois », la tendance de fond. Une séance seule ne veut presque rien dire : il faut regarder plusieurs horizons.</p>
<h3>La moyenne 200 jours</h3>
<p>La [[ma200|moyenne 200 jours]] lisse le bruit. Un titre au-dessus a une tendance de fond plutôt saine ; en dessous, il est à la peine. C'est un repère, pas un signal d'achat.</p>
<h3>Le RSI</h3>
<p>Le [[rsi|RSI]] mesure si un titre a beaucoup monté ou baissé récemment, sur une échelle de 0 à 100. Au-dessus de 70, il a beaucoup monté ; sous 30, beaucoup baissé. Ça ne dit pas s'il va continuer.</p>
<h3>Le piège du graphique</h3>
<p>On voit facilement des « figures » dans un graphique, comme des formes dans les nuages. Le passé d'un prix aide à mesurer le risque, beaucoup moins à prédire l'avenir.</p>
{{live:market}}`,
      keep: "Regarde plusieurs horizons (séance, mois, an) et la moyenne 200 jours. Un graphique aide à mesurer le risque, pas à prédire le prix de demain.",
      quiz: [
        { q: "Un titre perd 3 % sur une séance. Tu en conclus…", o: ["Qu'il faut vendre", "Pas grand-chose : il faut regarder plus loin", "Que l'entreprise va mal"], a: 1, why: "Une séance isolée est surtout du bruit." },
        { q: "Un titre au-dessus de sa moyenne 200 jours…", o: ["Va forcément monter", "A une tendance de fond plutôt saine", "Est trop cher"], a: 1, why: "C'est un repère de tendance, pas une prédiction." },
        { q: "Un RSI de 25 signifie…", o: ["Que le titre a beaucoup baissé récemment", "Que l'entreprise a 25 ans", "Qu'il faut acheter"], a: 0, why: "Sous 30, le titre a beaucoup baissé. Il peut continuer." },
      ],
      apply: { href: "#scanner", label: "Ouvrir une fiche depuis le Scanner" },
    },
    {
      id: "per", module: "analyser", minutes: 5,
      title: "Une action est-elle chère ? Le PER",
      body: `
<p>Le prix d'une action seul ne dit rien : une action à 500 € n'est pas plus chère qu'une action à 5 €. Ce qui compte, c'est ce que tu paies par rapport à ce que l'entreprise gagne.</p>
<h3>Le PER</h3>
<p>Le [[pe|PER]] (<i>price earnings ratio</i>) divise le prix de l'action par le bénéfice par action. Un PER de 20 veut dire : tu paies 20 années de bénéfices actuels. Plus il est élevé, plus le marché attend de croissance future.</p>
<h3>Le comparer, toujours</h3>
<p>Un PER n'a de sens que comparé : au secteur (une entreprise de logiciels a souvent un PER plus élevé qu'une banque), et à l'historique de l'entreprise. Pyxis affiche ces deux repères sur chaque fiche.</p>
<h3>Le PER « prévisionnel »</h3>
<p>Il utilise les bénéfices attendus l'an prochain par les analystes. S'il est bien plus bas que le PER actuel, le marché s'attend à une forte hausse des bénéfices… qui peut ne pas arriver.</p>
<h3>Ses limites</h3>
<p>Une entreprise qui perd de l'argent n'a pas de PER. Et un PER très bas n'est pas forcément une bonne affaire : c'est parfois le signe que l'entreprise a de gros problèmes. Pyxis appelle ce piège un [[couteau|couteau qui tombe]].</p>
{{live:per}}`,
      keep: "Le PER dit combien d'années de bénéfices tu paies. Il ne se lit qu'en comparaison (secteur, historique). Pas cher n'est pas forcément une bonne affaire.",
      quiz: [
        { q: "Une action à 400 € est plus chère qu'une action à 10 €. Vrai ?", o: ["Vrai", "Faux : il faut comparer le prix aux bénéfices"], a: 1, why: "Le prix seul ne dit rien sans le bénéfice par action." },
        { q: "Un PER de 30 dans un secteur où la moyenne est de 15 signifie…", o: ["Que le marché attend beaucoup de croissance", "Que l'entreprise est sûre", "Qu'elle verse un gros dividende"], a: 0, why: "Payer deux fois plus que le secteur, c'est parier sur des bénéfices futurs plus élevés." },
        { q: "Un PER très bas, c'est toujours une affaire ?", o: ["Oui", "Non, c'est parfois le signe de problèmes sérieux"], a: 1, why: "Le marché peut avoir de bonnes raisons d'être pessimiste." },
      ],
      apply: { href: "#scanner", label: "Trier les entreprises par valorisation" },
    },
    {
      id: "comptes", module: "analyser", minutes: 6,
      title: "Lire les comptes d'une entreprise",
      body: `
<p>Une entreprise publie trois documents chaque trimestre. Pas besoin d'être comptable pour en tirer l'essentiel.</p>
<h3>Le compte de résultat : combien elle gagne</h3>
<p>En haut, le <b>[[chiffreAffaires|chiffre d'affaires]]</b> : tout ce qu'elle a vendu. On retire les coûts pour arriver au <b>résultat d'exploitation</b> (ce que rapporte son métier), puis au <b>bénéfice net</b> une fois payés les intérêts et les impôts. Question à se poser : est-ce que le chiffre d'affaires grandit, et le bénéfice avec ?</p>
<h3>Le bilan : ce qu'elle possède et ce qu'elle doit</h3>
<p>D'un côté ses biens (usines, trésorerie, brevets…), de l'autre ses dettes et ce qui appartient aux actionnaires. Question : doit-elle beaucoup par rapport à ce qu'elle possède ?</p>
<h3>Les flux de trésorerie : l'argent réellement encaissé</h3>
<p>Un bénéfice comptable peut être flatteur ; la trésorerie, elle, ment moins. Le <b>[[fcf|flux de trésorerie disponible]]</b> est l'argent qui reste une fois payés le fonctionnement et les investissements. C'est avec lui qu'une entreprise rembourse ses dettes, verse des dividendes ou rachète ses actions.</p>
<h3>Où les trouver</h3>
<p>Sur le site de l'entreprise, rubrique « Investisseurs » (ou <i>Investor relations</i>). Pyxis reprend les chiffres clés sur chaque fiche.</p>`,
      keep: "Trois questions : ses ventes et bénéfices grandissent-ils ? Doit-elle beaucoup ? Encaisse-t-elle vraiment de l'argent ?",
      quiz: [
        { q: "Le chiffre d'affaires, c'est…", o: ["Le bénéfice", "Tout ce que l'entreprise a vendu", "Sa valeur en bourse"], a: 1, why: "C'est le haut du compte de résultat, avant de retirer les coûts." },
        { q: "Quel document dit combien l'entreprise doit ?", o: ["Le bilan", "Le compte de résultat", "Le cours de bourse"], a: 0, why: "Le bilan liste ce qu'elle possède et ce qu'elle doit." },
        { q: "Pourquoi regarder le flux de trésorerie disponible ?", o: ["Parce que c'est l'argent réellement encaissé, plus dur à maquiller", "Parce qu'il est toujours égal au bénéfice", "Pour connaître le cours"], a: 0, why: "Un bénéfice comptable peut être flatteur ; la trésorerie ment moins." },
      ],
      apply: { href: "#scanner", label: "Ouvrir une fiche pour lire ses chiffres" },
    },
    {
      id: "marges-dette", module: "analyser", minutes: 5,
      title: "Marges, rentabilité et dette",
      body: `
<p>Trois chiffres disent beaucoup de la qualité d'une entreprise. Pyxis les utilise dans son facteur « qualité ».</p>
<h3>La marge</h3>
<p>Sur 100 € de ventes, combien reste-t-il en bénéfice ? Une [[marge|marge nette]] de 20 %, c'est 20 € gardés. Une marge élevée et stable suggère un avantage difficile à copier : une marque, une technologie, un réseau.</p>
<h3>La rentabilité des capitaux propres (ROE)</h3>
<p>Le [[roe|ROE]] dit combien l'entreprise gagne par rapport à l'argent de ses actionnaires. Au-delà de 15 % de façon durable, c'est en général une très bonne affaire… sauf si elle l'obtient en s'endettant beaucoup.</p>
<h3>La dette</h3>
<p>La dette n'est pas mauvaise en soi, mais elle rend fragile : quand les taux montent ou que les ventes baissent, il faut continuer à rembourser. Le ratio dette sur capitaux propres compare ce que l'entreprise doit à ce qui appartient aux actionnaires.</p>
<h3>Lire ensemble</h3>
<p>Une belle marge avec une dette légère : solide. Une rentabilité spectaculaire avec une dette énorme : à creuser. Comme toujours, compare au secteur : un supermarché a naturellement des marges faibles.</p>
{{live:quality}}`,
      keep: "Marge élevée, bonne rentabilité, dette raisonnable : c'est le portrait d'une entreprise de qualité. Compare toujours au secteur.",
      quiz: [
        { q: "Une marge nette de 25 % veut dire…", o: ["25 € gardés en bénéfice sur 100 € de ventes", "25 % de hausse en bourse", "25 % de dette"], a: 0, why: "La marge mesure ce qui reste des ventes une fois tout payé." },
        { q: "Pourquoi une forte dette rend-elle fragile ?", o: ["Il faut rembourser même quand les ventes baissent", "Elle fait baisser les marges à zéro", "Elle est illégale"], a: 0, why: "Les échéances tombent quoi qu'il arrive, et coûtent plus quand les taux montent." },
        { q: "Un supermarché a 3 % de marge. C'est forcément mauvais ?", o: ["Oui", "Non, c'est normal dans son secteur"], a: 1, why: "Il faut comparer à des entreprises du même métier." },
      ],
      apply: { href: "#scanner", label: "Voir le facteur qualité dans les fiches" },
    },
    {
      id: "analystes", module: "analyser", minutes: 4,
      title: "L'avis des analystes : utile, mais pas parole d'évangile",
      body: `
<p>Des analystes de banques et de sociétés de bourse suivent les grandes entreprises. Ils publient une recommandation (acheter, conserver, vendre) et un objectif de cours à 12 mois. Pyxis affiche leur [[consensus|consensus]], c'est-à-dire la moyenne de leurs avis.</p>
<h3>Comment le lire</h3>
<p>Regarde le nombre d'analystes (un avis de 3 personnes pèse moins que celui de 30), l'objectif moyen, et surtout l'écart entre l'objectif le plus bas et le plus haut : s'il est énorme, personne n'est vraiment sûr.</p>
<h3>Leurs biais connus</h3>
<p>Les recommandations penchent nettement vers « acheter » : les avis « vendre » sont rares. Les objectifs suivent souvent le cours au lieu de l'anticiper. Et ils se trompent collectivement, comme tout le monde.</p>
<h3>Comment s'en servir</h3>
<p>Comme d'un avis parmi d'autres. Un consensus très enthousiaste veut aussi dire que beaucoup de bonnes nouvelles sont peut-être déjà dans le prix. C'est pourquoi le score Pyxis ne repose pas sur leur avis.</p>
{{live:analysts}}`,
      keep: "Le consensus des analystes est une information utile, mais biaisée vers l'optimisme. Regarde combien ils sont et à quel point leurs objectifs divergent.",
      quiz: [
        { q: "Pourquoi le nombre d'analystes compte-t-il ?", o: ["Un consensus de 30 avis est plus solide qu'un de 3", "Plus ils sont nombreux, plus le cours monte", "Il ne compte pas"], a: 0, why: "Plus d'avis, c'est une moyenne moins sensible à une erreur isolée." },
        { q: "Les recommandations « vendre » sont…", o: ["Très fréquentes", "Rares"], a: 1, why: "C'est un biais connu : les analystes penchent vers l'achat." },
        { q: "Objectifs entre 80 € et 250 € pour un titre à 120 €. Tu en conclus…", o: ["Que la hausse est certaine", "Que l'incertitude est très grande", "Que le titre vaut 165 €"], a: 1, why: "Un tel écart montre que personne n'est sûr de rien." },
      ],
      apply: { href: "#scanner", label: "Voir l'avis des analystes sur une fiche" },
    },
    {
      id: "score", module: "analyser", minutes: 5,
      title: "Comprendre le score Pyxis (et ses limites)",
      body: `
<p>Chaque titre suivi reçoit un [[score|score]] de 0 à 100. Ce n'est pas une prédiction : c'est un résumé de cinq critères, chacun classé par rapport aux autres titres.</p>
<h3>Les cinq critères</h3>
<p><b>Valorisation</b> (25 %) : est-il bon marché par rapport à ses bénéfices ? <b>Qualité</b> (25 %) : marges, rentabilité, dette. <b>[[momentum|Momentum]]</b> (20 %) : sa tendance sur un an. <b>Risque</b> (15 %) : volatilité et pires baisses. <b>Macro</b> (15 %) : son secteur convient-il à la [[phase|phase économique]] actuelle ?</p>
<h3>Un classement relatif</h3>
<p>« Qualité 90 » veut dire : meilleur que 90 % des titres suivis sur ce critère. Pas que l'entreprise est parfaite.</p>
<h3>La fourchette</h3>
<p>Pyxis affiche toujours une fourchette autour du score : quand une donnée manque ou que les critères se contredisent, elle s'élargit. Elle reste provisoire tant que la méthode n'a pas été testée sur le passé ([[backtest|backtest]]), ce qui viendra plus tard.</p>
<h3>Ce que le score ne sait pas</h3>
<p>Une nouvelle de la nuit, un procès, un changement de dirigeant. Chaque idée vient donc avec « ce qui pourrait la rendre fausse » et un signal d'alerte. Lis-les toujours.</p>
{{live:score}}`,
      keep: "Le score résume cinq critères relatifs. C'est un point de départ pour étudier un titre, jamais un ordre d'achat. Lis toujours ce qui pourrait le rendre faux.",
      quiz: [
        { q: "« Qualité 90 » signifie…", o: ["L'entreprise est parfaite à 90 %", "Elle fait mieux que 90 % des titres suivis sur ce critère", "Elle va monter de 90 %"], a: 1, why: "Les critères sont des classements relatifs." },
        { q: "Quel critère pèse le plus dans le score ?", o: ["Macro", "Valorisation et qualité, à égalité", "Risque"], a: 1, why: "25 % chacune, devant le momentum (20 %), le risque et la macro (15 % chacun)." },
        { q: "Un score élevé veut dire qu'il faut acheter. Vrai ?", o: ["Vrai", "Faux : c'est une piste à étudier"], a: 1, why: "Le score ignore beaucoup de choses ; c'est un point de départ." },
      ],
      apply: { href: "#", label: "Voir les idées du jour et leur score" },
    },

    /* ============================ MODULE 4 ============================ */
    {
      id: "cycle", module: "toi", minutes: 5,
      title: "Le cycle économique",
      body: `
<p>L'économie avance par vagues. On les découpe souvent en quatre [[phase|phases]], que Pyxis estime chaque jour à partir de l'inflation et du chômage.</p>
<h3>Les quatre phases</h3>
<p><b>Reprise</b> : après une crise, l'activité repart, le chômage commence à baisser. <b>Expansion</b> : tout tourne, les entreprises embauchent et gagnent plus. <b>Surchauffe</b> : la demande dépasse ce que l'économie peut produire, les prix montent, les banques centrales freinent. <b>Ralentissement</b> : l'activité ralentit, le chômage remonte.</p>
<h3>Les secteurs ne réagissent pas pareil</h3>
<p>En reprise, les entreprises sensibles à l'activité (industrie, consommation non essentielle) profitent souvent le plus. En ralentissement, les secteurs « défensifs » (santé, alimentation, services publics) résistent mieux : on mange et on se soigne quoi qu'il arrive.</p>
<h3>Rester modeste</h3>
<p>On ne sait souvent quelle phase on traversait qu'après coup, et la bourse anticipe l'économie de plusieurs mois. C'est pour ça que la macro ne pèse que 15 % du score Pyxis.</p>
{{live:macro}}`,
      keep: "Reprise, expansion, surchauffe, ralentissement : chaque phase favorise des secteurs différents. Mais on ne la reconnaît bien qu'après coup.",
      quiz: [
        { q: "Quelle phase voit les prix monter et les banques centrales freiner ?", o: ["La reprise", "La surchauffe", "Le ralentissement"], a: 1, why: "La demande dépasse l'offre, l'inflation accélère." },
        { q: "Quels secteurs résistent le mieux en ralentissement ?", o: ["Les défensifs : santé, alimentation, services publics", "Le luxe et l'automobile", "Aucun"], a: 0, why: "On continue à se nourrir et à se soigner, quoi qu'il arrive." },
        { q: "Pourquoi la macro ne pèse-t-elle que 15 % du score ?", o: ["Parce qu'on identifie mal la phase en temps réel", "Parce qu'elle ne compte pas", "Par hasard"], a: 0, why: "La phase n'est vraiment claire qu'après coup, et la bourse anticipe." },
      ],
      apply: { href: "#macro", label: "Voir la phase actuelle dans Macro" },
    },
    {
      id: "taux-inflation", module: "toi", minutes: 5,
      title: "Taux d'intérêt et inflation",
      body: `
<p>Deux chiffres de l'économie influencent tous les marchés : l'inflation et les taux de la banque centrale.</p>
<h3>L'inflation</h3>
<p>L'[[inflation|inflation]], c'est la hausse générale des prix. À 3 % par an, 100 € ne permettent plus d'acheter que l'équivalent de 97 € l'année suivante. C'est une raison d'investir : un compte qui ne rapporte rien perd chaque année du pouvoir d'achat.</p>
<h3>La banque centrale</h3>
<p>Pour la zone euro, c'est la BCE. Son objectif : une inflation autour de 2 %. Quand les prix montent trop vite, elle relève son [[tauxDirecteur|taux directeur]] : emprunter coûte plus cher, l'économie ralentit, l'inflation se calme. Quand l'économie va mal, elle les baisse.</p>
<h3>L'effet sur la bourse</h3>
<p>Des taux plus hauts pèsent souvent sur les actions : les entreprises paient leur dette plus cher, et un placement sans risque rapporte davantage, ce qui rend les actions moins attirantes en comparaison. Les entreprises dont les bénéfices sont attendus loin dans le futur (technologie en croissance) y sont les plus sensibles.</p>
{{live:macro}}`,
      keep: "L'inflation ronge l'épargne qui dort. Quand elle monte, la banque centrale relève ses taux, ce qui pèse souvent sur les actions, surtout celles de croissance.",
      quiz: [
        { q: "Avec 3 % d'inflation, ton argent non placé…", o: ["Garde sa valeur", "Perd environ 3 % de pouvoir d'achat par an", "Gagne 3 %"], a: 1, why: "Les prix montent, la même somme achète moins." },
        { q: "L'inflation dépasse nettement 2 %. La BCE va plutôt…", o: ["Monter ses taux", "Baisser ses taux", "Imprimer des billets"], a: 0, why: "Rendre le crédit plus cher calme la demande, donc les prix." },
        { q: "Quels titres souffrent souvent le plus d'une hausse des taux ?", o: ["Les entreprises de croissance, dont les bénéfices sont attendus loin dans le futur", "Les supermarchés", "Aucun"], a: 0, why: "Des bénéfices lointains valent moins aujourd'hui quand les taux montent." },
      ],
      apply: { href: "#macro", label: "Suivre les taux et l'inflation dans Macro" },
    },
    {
      id: "pieges", module: "toi", minutes: 6,
      title: "Les pièges qui font perdre de l'argent aux débutants",
      body: `
<p>Le plus grand risque en bourse, ce n'est souvent pas le marché : c'est nous. Notre cerveau a des réflexes utiles dans la vie, mais coûteux quand on investit.</p>
<h3>1. Vendre dans la panique</h3>
<p>Tout baisse, les titres de presse sont alarmants, on vend « pour limiter les dégâts ». C'est exactement ce qui transforme une baisse temporaire en perte définitive.</p>
<h3>2. Acheter par peur de rater le train</h3>
<p>Tout le monde parle d'un titre qui a doublé. On achète au sommet de l'enthousiasme. Si tout le monde en parle, il est souvent déjà cher.</p>
<h3>3. Garder un perdant pour ne pas reconnaître l'erreur</h3>
<p>Une perte fait environ deux fois plus mal qu'un gain du même montant ne fait plaisir. Alors on garde un mauvais titre « en attendant qu'il remonte », au lieu de se demander si on l'achèterait aujourd'hui.</p>
<h3>4. Ne chercher que ce qui nous donne raison</h3>
<p>Une fois convaincu, on lit les articles qui confirment et on ignore les autres. Pyxis te montre exprès « ce qui pourrait rendre l'idée fausse ».</p>
<h3>5. Ne regarder que les gagnants</h3>
<p>On entend parler des entreprises qui ont fait fortune, jamais de celles qui ont disparu. C'est le [[survivant|biais du survivant]] : il fait croire que c'est plus facile que ça ne l'est.</p>
<h3>6. Trop agir</h3>
<p>Regarder son portefeuille tous les jours pousse à bouger sans cesse, avec des frais à chaque fois. Les études montrent que les investisseurs qui achètent et vendent le plus obtiennent en général les moins bons résultats.</p>`,
      keep: "Tes émotions coûtent plus cher que les frais. Un plan automatique, un journal et des règles écrites à l'avance sont tes meilleures protections.",
      quiz: [
        { q: "Une perte de 100 € fait…", o: ["Autant d'effet qu'un gain de 100 €", "Environ deux fois plus mal qu'un gain de 100 € ne fait plaisir", "Moins mal"], a: 1, why: "C'est l'aversion à la perte, mesurée par de nombreuses études." },
        { q: "Tout le monde parle d'un titre qui a doublé en trois mois. Le réflexe sain ?", o: ["Acheter vite", "Se demander ce qui est déjà dans le prix", "Vendre ses ETF pour l'acheter"], a: 1, why: "L'enthousiasme général signale souvent un prix déjà élevé." },
        { q: "Le biais du survivant, c'est…", o: ["Ne voir que les réussites et oublier les échecs", "Garder ses actions longtemps", "Survivre à une crise"], a: 0, why: "Les entreprises disparues ne font plus parler d'elles, ce qui fausse notre vision." },
      ],
      apply: { href: "#journal", label: "Écrire ta première décision dans le Journal" },
    },
    {
      id: "journal", module: "toi", minutes: 4,
      title: "Tenir un journal de ses décisions",
      body: `
<p>On se souvient mal de nos raisons passées : la mémoire réécrit l'histoire pour nous donner raison. Un journal d'investissement règle ce problème.</p>
<h3>Que noter ?</h3>
<p>Avant chaque décision : ce que tu fais (acheter, vendre, ne rien faire), <b>pourquoi</b>, ce qui te prouverait que tu avais tort, et une date pour relire. Trois lignes suffisent.</p>
<h3>Pourquoi ça marche</h3>
<p>Écrire oblige à formuler une vraie raison, et parfois à se rendre compte qu'on n'en a pas. Relire plus tard permet de distinguer la chance du jugement : un bon résultat peut venir d'un mauvais raisonnement, et l'inverse.</p>
<h3>Te comparer au marché</h3>
<p>Le journal de Pyxis compare chaque décision à ce qu'aurait donné l'ETF monde sur la même période. C'est la question la plus honnête : « mes choix ont-ils fait mieux que ne rien choisir ? ».</p>`,
      keep: "Note chaque décision avec sa raison et ce qui te prouverait tort. Relis-la plus tard et compare-la à l'ETF monde : c'est comme ça qu'on progresse vraiment.",
      quiz: [
        { q: "Que faut-il absolument noter avec une décision ?", o: ["Le cours du jour seulement", "Sa raison et ce qui te prouverait que tu as tort", "L'avis d'un ami"], a: 1, why: "C'est ce qui permet de juger ton raisonnement plus tard." },
        { q: "Un bon résultat prouve-t-il un bon raisonnement ?", o: ["Oui, toujours", "Non, ça peut être de la chance"], a: 1, why: "Le journal aide à séparer la chance du jugement." },
        { q: "À quoi Pyxis compare-t-il tes décisions ?", o: ["À l'ETF monde sur la même période", "À l'avis des analystes", "À rien"], a: 0, why: "C'est le test « ai-je fait mieux que ne rien choisir ? »." },
      ],
      apply: { href: "#journal", label: "Ouvrir ton Journal" },
    },
    {
      id: "fiscalite", module: "toi", minutes: 6,
      title: "Tes impôts sur les placements, en Espagne",
      body: `
<p>Résident fiscal en Espagne, tu déclares tes revenus de placement dans ta déclaration annuelle (la <i>Renta</i>), dans une case à part : la « [[baseAhorro|base de l'épargne]] » (<i>base del ahorro</i>). Ce qui suit est un repère général ; pour ta situation, demande à ton gestor.</p>
<h3>Ce qui est imposé</h3>
<p>Les dividendes et intérêts reçus, et les [[plusValue|plus-values]] au moment où tu vends. Tant que tu ne vends pas un ETF capitalisant, il n'y a rien à payer sur sa hausse.</p>
<h3>Le barème (revenus 2025 et 2026)</h3>
<p>19 % jusqu'à 6 000 € de gains dans l'année, 21 % de 6 000 à 50 000 €, 23 % de 50 000 à 200 000 €, 27 % de 200 000 à 300 000 €, 30 % au-delà. Pour un débutant, c'est donc 19 % dans la grande majorité des cas. Les Pays basque et la Navarre ont leurs propres règles.</p>
<h3>Les moins-values</h3>
<p>Une perte réalisée en vendant compense les plus-values de la même année, et ce qui reste peut être reporté sur les quatre années suivantes. Attention : si tu rachètes le même titre dans les deux mois avant ou après une vente à perte, cette perte ne peut pas être utilisée tout de suite.</p>
<h3>Courtier espagnol ou étranger</h3>
<p>Certains courtiers (comme MyInvestor ou Trade Republic pour les résidents espagnols) retiennent l'impôt et transmettent les informations au fisc. Avec les autres, c'est à toi de déclarer chaque vente et chaque dividende. Si un jour tes avoirs à l'étranger dépassent 50 000 € dans une catégorie, une déclaration d'information spéciale (le <i>modelo 720</i>) s'ajoute.</p>
<h3>Bon à savoir</h3>
<p>En Espagne, on peut passer d'un fonds d'investissement à un autre sans payer d'impôt (le <i>traspaso</i>), mais les ETF cotés n'en profitent pas. Les dividendes d'actions étrangères peuvent subir une retenue dans leur pays d'origine, en partie récupérable dans ta déclaration.</p>
<p class="small">Sources : barème publié par l'Agencia Tributaria (loi 7/2024, tranche à 30 % applicable depuis les revenus 2025). Vérifié le 8 novembre 2026.</p>`,
      keep: "En Espagne : 19 % sur les premiers 6 000 € de gains annuels, impôt seulement à la vente pour un ETF capitalisant, pertes reportables 4 ans. Un courtier qui déclare à ta place simplifie beaucoup.",
      quiz: [
        { q: "Ton ETF capitalisant a pris 15 % mais tu n'as pas vendu. Impôt à payer ?", o: ["Oui, 19 % de la hausse", "Non, rien tant que tu ne vends pas"], a: 1, why: "La plus-value n'est imposée qu'à la vente." },
        { q: "Taux sur les 6 000 premiers euros de gains annuels ?", o: ["19 %", "30 %", "45 %"], a: 0, why: "Le barème de l'épargne commence à 19 %." },
        { q: "Tu vends à perte puis rachètes le même ETF un mois après. La perte…", o: ["Est utilisable tout de suite", "Ne peut pas être utilisée tout de suite (règle des deux mois)"], a: 1, why: "Le rachat dans les deux mois bloque l'utilisation de la perte tant que tu gardes le titre." },
      ],
      apply: { href: "#courtiers", label: "Voir quels courtiers déclarent à ta place" },
    },
    {
      id: "premier-achat", module: "toi", minutes: 6,
      title: "Ton premier achat, pas à pas",
      body: `
<p>Tu as ton matelas de précaution, tu sais ce qu'est un ETF monde et tu acceptes de le voir baisser parfois. Voici comment passer à l'acte.</p>
<h3>1. Choisir le courtier</h3>
<p>Un courtier régulé, avec des plans programmés gratuits, et idéalement qui gère les impôts espagnols à ta place. La page Courtiers calcule le coût annuel pour ton cas.</p>
<h3>2. Ouvrir le compte</h3>
<p>Pièce d'identité, justificatif de domicile, ton NIE ou NIF espagnol, et quelques questions sur ton expérience : c'est obligatoire, réponds honnêtement.</p>
<h3>3. Trouver l'ETF par son ISIN</h3>
<p>Par exemple <b>IE00B4L5Y983</b> (iShares Core MSCI World, capitalisant) ou <b>IE00BK5BQT80</b> (Vanguard FTSE All-World, capitalisant). Vérifie le nom complet, la mention « Acc » et les frais annuels.</p>
<h3>4. Mettre en place le plan programmé</h3>
<p>Choisis le montant (par exemple 80 €), le jour du mois (juste après ta rentrée d'argent) et active le virement automatique correspondant.</p>
<h3>5. Noter la décision</h3>
<p>Dans ton Journal : « Je commence un plan mensuel sur un ETF monde, pour X années. Je ne vends pas en cas de baisse de 30 %. » Tu relireras cette phrase le jour où ce sera difficile.</p>
<h3>6. Puis… ne rien faire</h3>
<p>C'est le plus dur. Regarde une fois par mois au plus. Le plan travaille pour toi.</p>`,
      keep: "Un courtier régulé, l'ISIN vérifié, un plan automatique, une décision écrite, puis la patience. C'est tout ce qu'il faut pour commencer.",
      quiz: [
        { q: "Quel est le moyen le plus sûr de trouver le bon ETF ?", o: ["Taper « monde » dans la recherche", "Chercher par son ISIN", "Prendre le premier proposé"], a: 1, why: "L'ISIN identifie le produit sans ambiguïté." },
        { q: "Quel jour fixer pour le plan programmé ?", o: ["Juste après ta rentrée d'argent", "Le jour où le marché baisse", "Peu importe, il faut changer chaque mois"], a: 0, why: "L'argent est là, et tu n'as rien à décider." },
        { q: "Après le premier achat, le plus important est…", o: ["Vérifier le cours tous les jours", "Laisser le plan travailler et regarder peu", "Changer d'ETF chaque trimestre"], a: 1, why: "Moins tu touches à un plan de long terme, mieux il se porte en général." },
      ],
      apply: { href: "#courtiers", label: "Choisir ton courtier" },
    },
  ];

  window.PYXIS_LEARN = { modules, lessons };
})();
