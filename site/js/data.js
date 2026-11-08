/* =========================================================================
   Exemple utilisé UNIQUEMENT quand le site est ouvert hors ligne (fichier local).
   Sur le site en ligne, ce sont toujours les vraies données de site/data/*.json.
   Elles servent uniquement à dessiner l'interface. À l'étape 3, elles seront
   remplacées par les vraies données (yfinance, FRED) servies par le backend.
   ========================================================================= */
(function () {
  // Petit générateur pseudo-aléatoire déterministe : mêmes courbes à chaque chargement.
  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  function series(seed, n, drift, vol, start) {
    const r = rng(seed);
    const out = [start];
    for (let i = 1; i < n; i++) {
      const shock = (r() + r() + r() - 1.5) * vol;
      out.push(Math.max(1, out[i - 1] * (1 + drift + shock)));
    }
    return out.map((v) => Math.round(v * 100) / 100);
  }

  const opportunities = [
    {
      ticker: "ASML", name: "ASML Holding", sector: "Semi-conducteurs", country: "Pays-Bas",
      score: 71, low: 58, high: 80, type: "valeur",
      thesis: "Recul de 24 % alors que les marges restent parmi les meilleures du secteur.",
      price: 612.4, chg1m: -6.8, rsi: 34, pe: 29.1, peHist: 38.4, vol: 31,
      spark: series(11, 60, -0.003, 0.03, 690),
      factors: { valuation: 74, quality: 91, momentum: 38, risk: 52, macro: 66 },
      scenarios: { m3: [38, 37, 25], m12: [46, 28, 26] },
      wrong: [
        "Le cycle des semi-conducteurs se retourne et les commandes chutent pendant 2 à 3 trimestres.",
        "De nouvelles restrictions d'export vers la Chine réduisent durablement le chiffre d'affaires.",
        "La valorisation reste élevée : même après la baisse, un PER de 29 laisse peu de marge d'erreur.",
      ],
      invalidation: "La thèse tombe si la marge brute passe sous 48 % ou si le carnet de commandes recule deux trimestres de suite.",
      backtest: { cases: 41, hit: 58, avg: 6.2, maxdd: -27, years: "2013–2025", flags: ["survivant"] },
    },
    {
      ticker: "NOVO-B", name: "Novo Nordisk", sector: "Santé", country: "Danemark",
      score: 66, low: 49, high: 77, type: "contrarian",
      thesis: "Forte baisse sur la concurrence, mais bilan solide et croissance encore positive.",
      price: 48.9, chg1m: -11.2, rsi: 27, pe: 14.2, peHist: 31.0, vol: 38,
      spark: series(23, 60, -0.006, 0.035, 66),
      factors: { valuation: 88, quality: 84, momentum: 12, risk: 41, macro: 58 },
      scenarios: { m3: [33, 34, 33], m12: [42, 25, 33] },
      wrong: [
        "La concurrence sur les traitements contre l'obésité fait baisser les prix plus vite que prévu.",
        "Le momentum reste très négatif : historiquement, ce type de chute continue souvent quelques mois.",
        "Les prévisions de la direction ont déjà été abaissées : un nouvel avertissement est possible.",
      ],
      invalidation: "La thèse tombe si la croissance des ventes devient négative ou si la marge opérationnelle passe sous 35 %.",
      backtest: { cases: 26, hit: 54, avg: 4.1, maxdd: -34, years: "2015–2025", flags: ["peu de cas", "survivant"] },
    },
    {
      ticker: "SAP", name: "SAP", sector: "Logiciels", country: "Allemagne",
      score: 63, low: 54, high: 71, type: "momentum",
      thesis: "Tendance haussière régulière, portée par la migration vers le cloud.",
      price: 241.7, chg1m: 4.1, rsi: 61, pe: 41.8, peHist: 33.5, vol: 22,
      spark: series(37, 60, 0.004, 0.018, 205),
      factors: { valuation: 32, quality: 79, momentum: 86, risk: 70, macro: 61 },
      scenarios: { m3: [41, 39, 20], m12: [44, 33, 23] },
      wrong: [
        "La valorisation est au-dessus de son historique : une déception sur les résultats coûterait cher.",
        "Le momentum s'essouffle souvent après 12 mois de hausse continue.",
        "Un ralentissement des budgets informatiques des entreprises freinerait la croissance du cloud.",
      ],
      invalidation: "La thèse tombe si le cours repasse sous sa moyenne mobile à 200 jours.",
      backtest: { cases: 64, hit: 57, avg: 3.8, maxdd: -19, years: "2010–2025", flags: [] },
    },
    {
      ticker: "IWDA", name: "iShares Core MSCI World", sector: "ETF monde", country: "Irlande",
      score: 60, low: 55, high: 64, type: "coeur",
      thesis: "Ton cœur de portefeuille : environ 1 400 entreprises de 23 pays développés, frais bas.",
      price: 104.2, chg1m: 1.2, rsi: 55, pe: 21.3, peHist: 19.8, vol: 14,
      spark: series(41, 60, 0.0015, 0.009, 98),
      factors: { valuation: 45, quality: 70, momentum: 64, risk: 85, macro: 55 },
      scenarios: { m3: [30, 50, 20], m12: [35, 45, 20] },
      wrong: [
        "Les actions américaines pèsent environ 70 % de l'indice : une baisse des États-Unis le touche directement.",
        "La valorisation globale est au-dessus de sa moyenne historique.",
      ],
      invalidation: "Pas de « sortie » prévue : c'est une détention à long terme, alimentée chaque mois.",
      backtest: { cases: 120, hit: 66, avg: 7.4, maxdd: -34, years: "2010–2025", flags: [] },
    },
    {
      ticker: "AI", name: "Air Liquide", sector: "Chimie / gaz industriels", country: "France",
      score: 58, low: 47, high: 66, type: "anomalie",
      thesis: "Volume deux fois supérieur à la normale sans nouvelle fondamentale visible.",
      price: 168.3, chg1m: -3.4, rsi: 42, pe: 27.6, peHist: 28.9, vol: 18,
      spark: series(53, 60, -0.0008, 0.012, 175),
      factors: { valuation: 55, quality: 82, momentum: 44, risk: 78, macro: 40 },
      scenarios: { m3: [31, 44, 25], m12: [37, 38, 25] },
      wrong: [
        "Un volume anormal peut refléter une information que le marché connaît et pas nous.",
        "Le secteur est sensible au ralentissement industriel en Europe.",
      ],
      invalidation: "La thèse tombe si le volume reste élevé et que le prix casse son plus bas sur 6 mois.",
      backtest: { cases: 19, hit: 47, avg: 1.1, maxdd: -15, years: "2016–2025", flags: ["peu de cas", "période favorable"] },
    },
  ];

  const more = [
    ["MC", "LVMH", "Luxe", 52, -2.1, 44], ["TTE", "TotalEnergies", "Énergie", 49, 1.4, 52],
    ["SU", "Schneider Electric", "Industrie", 61, 3.2, 63], ["OR", "L'Oréal", "Consommation", 47, -1.6, 41],
    ["SAN", "Banco Santander", "Banques", 55, 5.8, 68], ["ITX", "Inditex", "Distribution", 57, 2.2, 58],
    ["IBE", "Iberdrola", "Services publics", 54, 0.9, 54], ["AAPL", "Apple", "Technologie", 50, -0.7, 48],
    ["MSFT", "Microsoft", "Logiciels", 59, 1.9, 57], ["VWCE", "Vanguard FTSE All-World", "ETF monde", 60, 1.1, 54],
  ].map(([ticker, name, sector, score, chg1m, rsi], i) => ({
    ticker, name, sector, score, low: score - 11, high: score + 8, chg1m, rsi,
    type: "neutre", spark: series(100 + i * 7, 60, chg1m / 2000, 0.015, 100),
  }));

  window.MOCK = {
    isMock: true,
    profile: { name: "", capital: 450, monthly: 100, risk: "élevée", maxLine: 10, core: 80, horizon: 20 },
    opportunities,
    universe: [...opportunities, ...more],
    macro: {
      phase: "ralentissement", // expansion | surchauffe | ralentissement | reprise
      indicators: [
        { key: "taux", label: "Taux directeur BCE", value: "2,00 %", trend: "stable", meaning: "Le coût de l'argent ne bouge plus : bon pour les entreprises endettées et l'immobilier." },
        { key: "inflation", label: "Inflation zone euro", value: "2,1 %", trend: "baisse", meaning: "Les prix montent à peu près au rythme visé par la BCE." },
        { key: "chomage", label: "Chômage zone euro", value: "6,3 %", trend: "stable", meaning: "L'emploi tient : la consommation ne s'effondre pas." },
        { key: "courbe", label: "Écart taux 10 ans – 2 ans (US)", value: "+0,45 pt", trend: "hausse", meaning: "Une courbe qui se repentifie suit souvent une phase de ralentissement." },
      ],
      sectors: [
        { name: "Santé", fit: 72, note: "Défensif : résiste souvent en ralentissement." },
        { name: "Services publics", fit: 68, note: "Profite de taux stables ou en baisse." },
        { name: "Consommation de base", fit: 64, note: "On continue d'acheter du dentifrice en ralentissement." },
        { name: "Technologie", fit: 51, note: "Sensible aux taux et aux attentes de croissance." },
        { name: "Industrie", fit: 42, note: "Souffre quand l'activité ralentit." },
        { name: "Énergie", fit: 38, note: "Dépend du prix du pétrole, lui-même lié à la demande." },
      ],
    },
    lessons: [
      { id: "bases", title: "Les mots de base : action, ETF, bourse, courtier", minutes: 5, done: false },
      { id: "etf", title: "Ce qu'il y a vraiment dans un ETF monde", minutes: 5, done: false },
      { id: "diversification", title: "Pourquoi ne pas mettre tous ses œufs dans le même panier", minutes: 4, done: false },
      { id: "frais", title: "Ce que les frais coûtent vraiment sur 20 ans", minutes: 3, done: false },
      { id: "premier-achat", title: "Ton premier achat, pas à pas", minutes: 6, done: false },
      { id: "volatilite", title: "Volatilité : pourquoi ça monte et ça descend", minutes: 4, done: false },
      { id: "biais", title: "Les 5 pièges qui font perdre de l'argent aux débutants", minutes: 6, done: false },
      { id: "valorisation", title: "Une action est-elle chère ? Lire un PER", minutes: 5, done: false },
      { id: "bilan", title: "Lire les comptes d'une entreprise en 10 minutes", minutes: 8, done: false },
      { id: "fiscalite", title: "Les impôts sur les placements quand on réside en Espagne", minutes: 6, done: false },
    ],
  };

  /* Glossaire du mode « Explique-moi », écrit pour quelqu'un qui débute de zéro.
     Chaque terme : [nom, définition simple, image du quotidien ou exemple]. Ordre = ordre d'apprentissage. */
  window.GLOSSARY = {
    action: ["Action", "Un tout petit morceau d'une entreprise. Si l'entreprise gagne plus d'argent, ton morceau vaut en général plus cher ; si elle va mal, il perd de la valeur.", "Acheter une action Inditex, c'est devenir propriétaire d'une minuscule part de Zara."],
    bourse: ["Bourse", "Le marché où l'on achète et vend des actions, comme un grand marché où les prix changent toute la journée selon l'offre et la demande.", "Plus il y a d'acheteurs que de vendeurs, plus le prix monte."],
    courtier: ["Courtier", "L'intermédiaire qui passe tes ordres d'achat et de vente en bourse. Tu ne peux pas acheter directement : tu passes par lui, via une application.", "Revolut et Trade Republic sont des courtiers."],
    etf: ["ETF", "Un panier tout prêt qui contient des dizaines ou des centaines d'actions. Tu achètes une « part du panier » et tu possèdes un petit bout de chaque entreprise dedans. Le panier se gère tout seul et coûte très peu.", "Au lieu d'acheter 1 400 actions une par une, tu achètes un seul ETF."],
    etfMonde: ["ETF monde (MSCI World)", "Un ETF qui contient les grandes entreprises d'une vingtaine de pays riches, environ 1 400 sociétés. « MSCI World » est le nom de la liste qu'il copie.", "Avec 80 €, tu possèdes un bout d'Apple, de Nestlé, de Toyota, de LVMH… en même temps."],
    indice: ["Indice", "Une liste d'entreprises suivie pour mesurer la santé d'un marché. Le CAC 40, c'est la liste des 40 plus grandes entreprises françaises. Un ETF copie un indice.", ""],
    diversification: ["Diversification", "Ne pas mettre tous ses œufs dans le même panier. Si tu possèdes beaucoup d'entreprises différentes, la chute de l'une d'elles ne te fait presque pas de mal.", ""],
    frais: ["Frais", "Ce que le courtier ou le fonds te prend pour son service. Ils paraissent petits, mais sur 20 ans ils peuvent coûter des milliers d'euros.", "1 € de frais sur un achat de 20 €, c'est 5 % de perdus tout de suite."],
    dividende: ["Dividende", "Une partie des bénéfices que l'entreprise reverse à ses actionnaires, souvent une ou deux fois par an. Certains ETF le réinvestissent automatiquement (on les dit « capitalisants »).", ""],
    dca: ["Investissement programmé (DCA)", "Investir la même somme à date fixe, quel que soit le prix. Quand c'est bas, tu achètes plus de parts ; quand c'est haut, moins. Ça évite d'essayer de deviner le bon moment.", "100 € automatiquement le 5 de chaque mois."],
    interets: ["Intérêts composés", "Tes gains rapportent eux-mêmes des gains, comme une boule de neige qui grossit en roulant. L'effet est faible au début, très fort après 15 ou 20 ans.", ""],
    coeur: ["Cœur et satellite", "Le cœur (70 à 80 %) est un ETF monde qu'on garde longtemps sans y toucher. Le satellite (20 à 30 %) sert à tester tes idées sur des actions choisies, pour apprendre.", ""],
    volatilite: ["Volatilité", "À quel point le prix bouge, à la hausse comme à la baisse. Une action très volatile, c'est des montagnes russes ; un ETF monde, c'est plutôt une route de campagne.", "30 % de volatilité : une variation de ±30 % dans l'année n'a rien d'exceptionnel."],
    drawdown: ["Pire baisse (drawdown)", "La plus grosse chute entre un sommet et le creux qui suit. C'est ce que tu aurais vécu dans le pire moment.", "-34 % : tes 100 € seraient tombés à 66 € à un moment, avant de remonter (ou non)."],
    ordreLimite: ["Ordre à cours limité", "Tu dis au courtier : « achète, mais pas plus cher que tel prix ». Si le prix ne descend pas jusque-là, rien ne se passe et tu ne paies rien.", ""],
    score: ["Score", "Une note de 0 à 100 calculée par l'app pour résumer plusieurs critères. La fourchette entre crochets montre l'incertitude : plus elle est large, moins on est sûr.", "64 [51–73] : probablement entre 51 et 73."],
    pe: ["PER", "Le prix d'une action comparé à ce que l'entreprise gagne. Il répond à la question : combien d'années de bénéfices je paie en achetant ?", "PER de 20 : tu paies l'équivalent de 20 ans de bénéfices actuels. Plus c'est bas, moins c'est cher (en apparence)."],
    rsi: ["RSI", "Un indicateur de 0 à 100 qui dit si le prix a beaucoup monté ou beaucoup baissé ces dernières semaines. Sous 30 : forte baisse récente. Au-dessus de 70 : forte hausse récente.", "Un RSI bas ne veut pas dire « acheter » : la baisse peut continuer."],
    momentum: ["Tendance (momentum)", "La direction du prix sur les 12 derniers mois. Ce qui a monté a un peu plus tendance à continuer… jusqu'au jour où ça s'arrête.", ""],
    phase: ["Phase du cycle", "L'économie alterne des périodes de reprise, de croissance, de surchauffe et de ralentissement, un peu comme des saisons. Certains secteurs résistent mieux selon la saison.", ""],
    backtest: ["Backtest", "Tester une règle sur le passé pour voir ce qu'elle aurait donné. Utile pour éliminer les mauvaises idées, mais le passé ne garantit rien.", ""],
    survivant: ["Biais du survivant", "On ne teste que des entreprises qui existent encore aujourd'hui. Celles qui ont fait faillite manquent, ce qui rend les résultats plus beaux qu'en vrai.", ""],
    latent: ["Gain ou perte latente", "Un gain ou une perte qui n'existe que sur le papier tant que tu n'as pas vendu. Il peut encore changer.", ""],
    isin: ["Code ISIN", "La « plaque d'immatriculation » d'un produit en bourse : 12 caractères uniques. Il évite de confondre deux produits au nom proche.", "IE00B4L5Y983 = iShares Core MSCI World."],
    seance: ["Séance", "Une journée de bourse, de l'ouverture à la fermeture. Les bourses sont fermées le week-end : le lundi, la dernière séance est donc celle du vendredi."],
    largeur: ["Largeur du marché", "Combien de titres montent et combien baissent sur la séance. Un indice peut monter grâce à quelques géants pendant que la majorité baisse : compter les hausses et les baisses dit si le mouvement est large ou concentré."],
    ma200: ["Moyenne 200 jours", "La moyenne des cours des 200 dernières séances, soit environ dix mois. Un titre au-dessus de cette moyenne est dans une tendance de fond plutôt saine ; en dessous, il est à la peine. Plus il y a de titres au-dessus, plus le marché est solide."],
    plusValue: ["Plus-value et moins-value", "La différence entre le prix de vente et le prix d'achat. Positive, c'est une plus-value (un gain) ; négative, une moins-value (une perte). Elle n'existe fiscalement qu'au moment où tu vends.", "Acheté 100 €, revendu 130 € : 30 € de plus-value."],
    capitalisant: ["Capitalisant (Acc) ou distribuant (Dist)", "Un fonds capitalisant réinvestit lui-même les dividendes qu'il reçoit ; un fonds distribuant te les verse. Le capitalisant est le plus simple pour faire grossir une petite épargne.", "« Acc » dans le nom d'un ETF veut dire capitalisant."],
    spread: ["Écart achat-vente (spread)", "La différence entre le prix auquel tu peux acheter et celui auquel tu peux vendre au même instant. C'est un coût caché, plus faible quand beaucoup de monde échange le titre.", ""],
    inflation: ["Inflation", "La hausse générale des prix. Avec 3 % d'inflation, la même somme achète environ 3 % de moins un an plus tard.", "Un compte qui ne rapporte rien perd chaque année du pouvoir d'achat."],
    tauxDirecteur: ["Taux directeur", "Le taux auquel la banque centrale (la BCE pour l'euro) prête ou rémunère l'argent des banques. Elle le monte pour freiner l'inflation, le baisse pour soutenir l'économie.", ""],
    chiffreAffaires: ["Chiffre d'affaires", "Tout ce qu'une entreprise a vendu sur une période, avant de retirer le moindre coût.", ""],
    marge: ["Marge nette", "La part des ventes qui reste en bénéfice une fois tout payé. 20 % de marge, c'est 20 € gardés sur 100 € vendus.", "Un supermarché a des marges faibles, un éditeur de logiciels des marges élevées."],
    roe: ["Rentabilité des capitaux propres (ROE)", "Ce que l'entreprise gagne chaque année par rapport à l'argent de ses actionnaires. Élevée, c'est bon signe, sauf si elle vient d'une grosse dette.", ""],
    fcf: ["Flux de trésorerie disponible", "L'argent réellement encaissé qui reste une fois payés le fonctionnement et les investissements. C'est avec lui qu'on rembourse, verse des dividendes ou rachète des actions.", ""],
    consensus: ["Consensus des analystes", "La moyenne des avis (acheter, conserver, vendre) et des objectifs de cours publiés par les analystes qui suivent une entreprise.", "Ces avis penchent souvent vers l'optimisme."],
    precaution: ["Épargne de précaution", "L'argent gardé disponible pour les coups durs, souvent 3 à 6 mois de dépenses, davantage pour un indépendant. Il ne va pas en bourse.", ""],
    baseAhorro: ["Base de l'épargne (base del ahorro)", "En Espagne, la case de la déclaration où l'on regroupe dividendes, intérêts et plus-values. Elle est imposée à part, à partir de 19 %.", ""],
    couteau: ["Couteau qui tombe", "Une action qui chute fort et dont les fondamentaux se dégradent. Elle peut sembler « pas chère », mais elle peut continuer de baisser longtemps.", "Le dicton : ne jamais essayer de rattraper un couteau qui tombe."],
    contrarian: ["Contrarian", "Aller contre la foule : s'intéresser à ce que tout le monde vend. Ça ne marche que si l'entreprise est solide et que la chute s'arrête.", ""],
    kelly: ["Critère de Kelly", "Une formule qui calcule combien miser selon ton avantage estimé. On n'en prend qu'un quart, plafonné, car on surestime presque toujours son avantage.", ""],
  };
})();
