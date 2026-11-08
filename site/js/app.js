/* =========================================================================
   Pyxis — application (navigation + écrans)
   Une seule page, navigation par l'adresse (#scanner, #fiche-ASML…).
   ========================================================================= */
(function () {
  const M = window.MOCK, G = window.GLOSSARY, C = window.Charts;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const eur = (v, d = 0) => (v ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }) + " €";
  const pct = (v, d = 1) => v == null || isNaN(v) ? "—" : (v > 0 ? "+" : "") + v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "\u00a0%";
  const CUR = { EUR: "€", USD: "$", GBp: "p", GBP: "£", CHF: "CHF", DKK: "DKK" };
  const money = (v, cur = "EUR", d = 2) => v == null ? "—" : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }) + " " + (CUR[cur] || cur || "€");
  const num = (v, d = 1) => v == null ? "—" : v.toLocaleString("fr-FR", { maximumFractionDigits: d });
  const ex = (key, text) => `<span data-explain="${key}" tabindex="0">${text}</span>`;

  /* ---------- Stockage local (navigateur), toujours protégé ---------- */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem("investlab." + k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem("investlab." + k, JSON.stringify(v)); } catch { /* stockage indisponible : on garde en mémoire */ } },
  };
  const state = {
    profile: store.get("profile", { ...M.profile }),
    // Le plan n'existe que si la personne l'a réglé elle-même, dans son propre navigateur.
    hasPlan: !!store.get("profile", null),
    journal: store.get("journal", []),
    positions: store.get("positions", { real: [], simulated: [] }),
    book: "real",
    filter: "tout",
    query: "",
    scanView: window.innerWidth < 700 ? "liste" : "cercles",
    brokerSc: { plan: Math.round((M.profile.monthly * M.profile.core) / 100), n: 4, amt: 100, us: 50 },
    simpleTax: false,
    explain: store.get("explain", false),
    sim: { monthly: M.profile.monthly, years: M.profile.horizon },
  };

  /* ---------- Icônes ---------- */
  const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    home: I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
    scan: I('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6M11 8v6"/>'),
    macro: I('<path d="M3 17c3-6 5-6 7-3s4 3 5-1 3-6 6-4"/><path d="M3 21h18"/>'),
    wallet: I('<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18"/><circle cx="16" cy="15" r="1.2"/>'),
    journal: I('<path d="M6 3h11a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-3 2V5a2 2 0 0 1 2-2z"/><path d="M9 8h7M9 12h7"/>'),
    broker: I('<path d="M4 7h16M4 12h10M4 17h7"/><circle cx="18" cy="16" r="3"/>'),
    learn: I('<path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M7 10v5c3 2 7 2 10 0v-5"/>'),
    settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    more: I('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
  };
  const NAME = "Pyxis";
  const TOP = [["", "Aujourd'hui"], ["veille", "Veille"], ["scanner", "Scanner"], ["macro", "Macro"], ["apprendre", "Apprendre"], ["methode", "Méthode"]];
  const ACCOUNT = [["portefeuille", "Portefeuille"], ["journal", "Journal"], ["courtiers", "Courtiers"], ["reglages", "Réglages"]];

  /* ---------- Calculs du profil ---------- */
  function planSplit(p) {
    const core = Math.round((p.monthly * p.core) / 100);
    return { core, sat: p.monthly - core };
  }
  function book(kind) {
    const rows = (state.positions[kind] || []).map((r) => {
      const live = M.universe.find((u) => u.ticker === r.ticker);
      const price = live && live.price != null ? live.price : r.cost;
      return { ...r, name: live?.name || r.name || r.ticker, bucket: r.bucket || (live?.kind === "ETF" ? "coeur" : "satellite"), live: !!live, price, value: r.qty * price, invested: r.qty * r.cost };
    });
    const value = rows.reduce((a, r) => a + r.value, 0), invested = rows.reduce((a, r) => a + r.invested, 0);
    const core = rows.filter((r) => r.bucket === "coeur").reduce((a, r) => a + r.value, 0);
    const biggestSat = Math.max(0, ...rows.filter((r) => r.bucket !== "coeur").map((r) => r.value));
    return { rows, value, invested, pnl: value - invested, corePct: value ? (core / value) * 100 : 0, maxLinePct: value ? (biggestSat / value) * 100 : 0 };
  }

  /* ---------- Ossature : rail noir à gauche, onglets en haut (charte Syndicate) ---------- */
  const SEARCH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="M15.5 15.5L21 21"/></svg>`;
  function shell() {
    document.body.innerHTML = `
      <div class="mbar"><a class="wm" href="#accueil" aria-label="${NAME}, accueil">${Logo.lockup({ size: 30, color: "#f3cebb" })}</a><button type="button" id="menuBtn" aria-expanded="false" aria-controls="mmenu">Menu</button></div>
      <nav class="mmenu" id="mmenu" aria-label="Menu">
        ${[...TOP, ...ACCOUNT].map(([r, l]) => `<a href="#${r || "accueil"}" data-route="${r}">${l}</a>`).join("")}
        ${explainToggle()}
      </nav>
      <div class="shell">
        <aside class="rail" aria-label="Mon compte">
          <div class="wordmark"><a href="#accueil" aria-label="${NAME}, accueil">${Logo.lockup({ size: 48, color: "#f3cebb", vertical: true })}</a></div>
          <div class="rail-label"><span class="label">Mon compte</span></div>
          <nav>${ACCOUNT.map(([r, l]) => `<a href="#${r}" data-route="${r}">${l}</a>`).join("")}</nav>
          <div class="rail-foot">${explainToggle()}<p class="label" style="margin-top:14px;color:var(--on-ink-mute)">Souligne et explique chaque mot technique.</p></div>
        </aside>
        <div class="col">
          <nav class="tabs" aria-label="Navigation principale">
            ${TOP.map(([r, l]) => `<a href="#${r || "accueil"}" data-route="${r}">${l}</a>`).join("")}
            <span class="spacer"></span>
            <a class="account" href="#portefeuille" data-route="@account">Mon compte</a>
          </nav>
          <form class="searchrow" role="search" id="searchForm">
            <input type="text" id="globalSearch" placeholder="Trouver une entreprise, un ETF, un mot du lexique" aria-label="Rechercher">
            <button type="submit" style="background:none;border:0;padding:0;cursor:pointer;color:inherit" aria-label="Lancer la recherche">${SEARCH_ICON}</button>
          </form>
          <main class="main" id="main" tabindex="-1"></main>
          <footer class="footer">
            <div class="wm" aria-hidden="true">${Logo.lockup({ size: 56, color: "#f3cebb" })}</div>
          </footer>
        </div>
      </div>
      <div class="curtain" aria-hidden="true"></div>`;
    document.body.classList.toggle("explain-on", state.explain);
    $("#menuBtn").onclick = () => { const m = $("#mmenu"); m.classList.toggle("open"); $("#menuBtn").setAttribute("aria-expanded", m.classList.contains("open")); $("#menuBtn").textContent = m.classList.contains("open") ? "Fermer" : "Menu"; };
    $("#searchForm").onsubmit = (e) => { e.preventDefault(); state.query = $("#globalSearch").value; state.filter = "tout"; state.scanView = "liste"; if (location.hash === "#scanner") render(); else location.hash = "#scanner"; };
  }
  function explainToggle() {
    return `<button type="button" class="toggle" data-action="explain" aria-pressed="${state.explain}"><span class="sw"></span>Explique-moi</button>`;
  }
  function head(title, lede, extra = "", crumb = "") {
    return `${crumb ? `<div class="crumb label">${crumb}</div>` : ""}<header class="topbar"><div><h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ""}</div>
      <div class="row wrap">${extra}${dataChip()}</div></header>`;
  }
  const disclaimer = "";
  /* Pastille d'état des données : fictives, à jour, anciennes ou en échec. */
  function dataStatus() {
    if (M.dataError) return { text: "Données indisponibles", tone: "loss", tip: "Les fichiers de données n'ont pas pu être chargés. Réessaie dans quelques minutes." };
    if (M.isMock) return { text: "Aperçu hors ligne (exemple)", tone: "warn", tip: "Fichier ouvert sans connexion : les chiffres affichés sont un exemple." };
    const d = new Date(M.asOf + "T12:00:00");
    const days = Math.floor((Date.now() - d) / 864e5);
    const label = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    if (M.meta?.status === "echec") return { text: `Mise à jour échouée, données du ${label}`, tone: "loss", tip: M.meta.message };
    if (days > 4) return { text: `Données anciennes (${label})`, tone: "warn", tip: "La mise à jour automatique n'a pas tourné depuis plusieurs jours." };
    return { text: `Cours du ${label}`, tone: "gain", tip: `${M.meta?.ok ?? "?"} titres sur ${M.meta?.total ?? "?"} mis à jour. Sources : Yahoo Finance, FRED.` };
  }
  function dataChip(dark = false) {
    const st = dataStatus();
    return `<span class="mock-flag tone-${st.tone}" title="${esc(st.tip)}"${dark ? ' style="color:var(--on-ink);border-color:rgba(243,206,187,.4)"' : ""}>${esc(st.text)}</span>`;
  }

  /* ======================= ÉCRANS ======================= */

  /* Santé du marché sur la dernière séance, calculée sur tous les titres suivis. */
  function day1(o) {
    if (o.chg1d != null) return o.chg1d;
    const sp = o.spark || []; // repli : les deux derniers points de la courbe sont deux séances consécutives
    return sp.length > 1 && sp[sp.length - 2] ? (sp[sp.length - 1] / sp[sp.length - 2] - 1) * 100 : null;
  }
  function median(a) { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }
  function marketHealth() {
    const rows = M.universe.map((o) => ({ o, d: day1(o) })).filter((r) => r.d != null && isFinite(r.d));
    const n = rows.length || 1, up = rows.filter((r) => r.d > 0).length, down = rows.filter((r) => r.d < 0).length;
    const share = up / n, med = median(rows.map((r) => r.d));
    const title = share >= 0.68 ? "Séance nettement haussière." : share >= 0.55 ? "Séance plutôt positive." : share > 0.45 ? "Séance partagée." : share > 0.32 ? "Séance plutôt négative." : "Séance nettement baissière.";
    const ma = M.universe.filter((o) => o.dist_ma200 != null), w5 = M.universe.map((o) => o.chg5d).filter((v) => v != null);
    const sorted = [...rows].sort((a, b) => b.d - a.d);
    const world = M.universe.find((o) => o.ticker === "EUNL.DE");
    const when = M.asOf ? new Date(M.asOf + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "jour";
    return {
      n: rows.length, up, down, median: med, title, when,
      above200: ma.length ? Math.round((100 * ma.filter((o) => o.dist_ma200 > 0).length) / ma.length) : 0,
      week: w5.length ? median(w5) : null,
      world: world ? day1(world) : null,
      top: sorted.slice(0, 3), bottom: sorted.slice(-3).reverse(),
    };
  }
  const moverLink = (r) => `<a href="#fiche-${esc(r.o.ticker)}"><span>${esc(r.o.name)}</span><b class="num ${r.d >= 0 ? "gain" : "loss"}">${pct(r.d, 1)}</b></a>`;

  function viewHome() {
    const p = state.profile, sp = planSplit(p), b = book("real");
    const next = M.lessons.find((l) => !l.done);
    const hl = marketHealth();
    const day = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    return `
    <section class="pulse" aria-labelledby="pulse-t">
      <div class="pulse-top"><span class="label">${p.name && state.hasPlan ? `Bonjour ${esc(p.name)}, nous sommes` : "Nous sommes"} ${day}</span>${dataChip(true)}</div>
      <div class="pulse-grid">
        <div class="pulse-text">
          <span class="label">${ex("seance", "Séance")} du ${esc(hl.when)}, ${hl.n} titres suivis</span>
          <h1 class="pulse-title" id="pulse-t">${esc(hl.title)}</h1>
          <p class="pulse-sub">${hl.up} titres montent, ${hl.down} baissent. Variation médiane : <b class="${hl.median >= 0 ? "gain" : "loss"}">${pct(hl.median, 2)}</b>.${hl.world != null ? ` L'${ex("etfMonde", "ETF monde")} : <b class="${hl.world >= 0 ? "gain" : "loss"}">${pct(hl.world, 2)}</b>.` : ""}</p>
          <div class="health">
            <div class="hbar" role="img" aria-label="${hl.up} en hausse, ${hl.down} en baisse"><span class="up" style="width:${(100 * hl.up / (hl.n || 1)).toFixed(1)}%"></span><span class="dn" style="width:${(100 * hl.down / (hl.n || 1)).toFixed(1)}%"></span></div>
            <dl>
              <div><dt class="label">${ex("largeur", "Largeur")}</dt><dd class="num">${Math.round((100 * hl.up) / (hl.n || 1))} % en hausse</dd></div>
              <div><dt class="label">Tendance de fond</dt><dd class="num">${hl.above200} % au-dessus de leur ${ex("ma200", "moyenne 200 j")}</dd></div>
              ${hl.week != null ? `<div><dt class="label">Sur 5 séances</dt><dd class="num ${hl.week >= 0 ? "gain" : "loss"}">${pct(hl.week, 1)} (médiane)</dd></div>` : ""}
            </dl>
          </div>
          <div class="movers">
            <div><span class="label">Plus fortes hausses</span>${hl.top.map(moverLink).join("")}</div>
            <div><span class="label">Plus fortes baisses</span>${hl.bottom.map(moverLink).join("")}</div>
          </div>
        </div>
        <figure class="sky-box">
          <canvas id="pulseCanvas" aria-hidden="true"></canvas>
          <figcaption class="label">Chaque point est un titre suivi. À droite ceux qui ont monté pendant la séance, à gauche ceux qui ont baissé ; en haut ceux qui montent depuis un mois. Les plus fortes hausses et baisses du jour sont reliées. Survole un point, clique pour sa fiche.</figcaption>
        </figure>
      </div>
    </section>

    ${state.hasPlan ? `    <section class="plan-band" aria-label="Ton plan">
      <div><span class="label">Ton plan</span>
        <div class="pulse-amount num">${p.monthly} €<small>chaque mois</small></div></div>
      <div>
        <div class="split" role="img" aria-label="${sp.core} € en cœur, ${sp.sat} € en satellite"><span style="width:${p.core}%"></span><span style="width:${100 - p.core}%"></span></div>
        <div class="legend">
          <span><i style="background:var(--ink)"></i>${sp.core} € dans l'${ex("etfMonde", "ETF monde")}, via un ${ex("dca", "plan programmé")}</span>
          <span><i style="background:var(--gain)"></i>${sp.sat} € de côté pour le ${ex("coeur", "satellite")}</span>
        </div>
        <p class="pulse-note">Mets la part satellite de côté jusqu'à environ 100 € avant d'acheter une ${ex("action", "action")} seule : avec 1 € de ${ex("frais", "frais")}, un achat de 20 € coûte déjà 5 %.</p>
      </div>
      <a class="btn" href="#portefeuille">Voir la projection</a>
    </section>` : ""}

    ${M.brief ? `<section class="brief-home">
      <div><span class="label">La veille du ${new Date(M.brief.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>
        <h2 class="serif" style="font-size:clamp(26px,3vw,40px);line-height:1.08;letter-spacing:-.02em;margin:14px 0 10px;max-width:30ch">${esc(M.brief.headline)}</h2>
        <p class="muted" style="max-width:70ch">${esc(M.brief.summary)}</p></div>
      <a class="btn" href="#veille">Lire la veille</a></section>` : ""}
    <div class="grid g-home" style="margin-top:64px">
      <section class="panel" aria-labelledby="top-t">
        <div class="panel-head"><span class="label">Idées du jour</span><a class="label" href="#scanner">Tout le scanner</a></div>
        <h2 id="top-t" class="serif" style="font-size:34px;letter-spacing:-.02em;margin-bottom:8px">5 idées à étudier</h2>
        <p class="muted" style="margin-bottom:22px">Des pistes pour apprendre, pas des ordres d'achat. Le cercle montre le ${ex("score", "score et sa fourchette")}.</p>
        <ul class="opps">${M.opportunities.length ? M.opportunities.map(oppRow).join("") : `<li class="empty">Aucun signal net aujourd'hui. C'est aussi une information : rien ne presse.</li>`}</ul>
      </section>

      <div class="stack">
        <section class="panel" aria-labelledby="health-t">
          <div class="panel-head"><span class="label" id="health-t">Santé du portefeuille</span><a class="label" href="#portefeuille">Détail</a></div>
          ${b.rows.length ? `<div class="num" style="font-size:52px;letter-spacing:-.04em;line-height:1">${eur(b.value, 2)}</div>
          <p class="${b.pnl >= 0 ? "gain" : "loss"}" style="margin-top:8px">${b.pnl >= 0 ? "+" : ""}${eur(b.pnl, 2)} depuis tes achats (${pct(b.invested ? (b.pnl / b.invested) * 100 : 0)})</p>
          <p class="muted small" style="margin-top:4px">Ce que tes positions valent au dernier cours de clôture, comparé à ce que tu as payé.</p>
          <div style="margin-top:22px">
            ${ruleLine(b.corePct >= p.core - 10, `Cœur à ${Math.round(b.corePct)} % (objectif ${p.core} %)`, "La base diversifiée protège contre l'erreur sur une seule entreprise.")}
            ${ruleLine(b.maxLinePct <= p.maxLine, `Plus grosse action seule : ${Math.round(b.maxLinePct)} % (max ${p.maxLine} %)`, b.maxLinePct > p.maxLine ? "Une seule action pèse trop : si elle chute, tout ton portefeuille le sent." : "Aucune action seule ne peut faire trop de dégâts.")}
          </div>` : `<p class="serif" style="font-size:22px;line-height:1.3">Ton portefeuille est vide pour l'instant.</p>
          <p class="muted small" style="margin:8px 0 18px">Ajoute tes positions réelles, ou commence par un portefeuille simulé pour t'entraîner sans argent.</p>
          <a class="btn" href="#portefeuille">Ajouter une position</a>`}
        </section>

        ${next ? `<section class="hero" aria-labelledby="lesson-t">
          <div class="row between"><span class="label">À apprendre ensuite · ${esc(moduleOf(next).title)}</span><span class="label">${next.minutes} min</span></div>
          <h3 id="lesson-t" class="serif" style="font-size:30px;line-height:1.08;font-weight:400;letter-spacing:-.02em;margin:22px 0 12px">${esc(next.title)}</h3>
          <p class="muted" style="margin-bottom:22px">${learnDone()} leçon${learnDone() > 1 ? "s" : ""} terminée${learnDone() > 1 ? "s" : ""} sur ${M.lessons.length}.</p>
          <a class="btn" href="#apprendre-${next.id}">Commencer la leçon</a>
        </section>` : `<section class="hero"><span class="label">Parcours terminé</span><h3 class="serif" style="font-size:30px;font-weight:400;margin:22px 0 12px">Les ${M.lessons.length} leçons sont faites.</h3><a class="btn" href="#apprendre">Revoir une leçon</a></section>`}
      </div>
    </div>`;
  }
  function ruleLine(ok, title, meaning) {
    return `<div class="row" style="align-items:flex-start;padding:12px 0;border-top:1px solid var(--rule-soft)">
      <span style="flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px;${ok ? "background:var(--gain);color:var(--paper-2)" : "background:var(--warn);color:var(--paper-2)"}">${ok ? "✓" : "!"}</span>
      <div><div style="font-weight:500">${title}</div><div class="muted small">${meaning}</div></div></div>`;
  }
  const TYPE_LABEL = { valeur: "Valeur", contrarian: "Contrarian", momentum: "Momentum", anomalie: "Anomalie", coeur: "Cœur", neutre: "Neutre", couteau: "Couteau qui tombe" };
  function oppRow(o) {
    return `<li><a class="opp" href="#fiche-${o.ticker}">
      ${C.orb(o.score, o.low, o.high, 60)}
      <div><div class="t"><b>${esc(o.name)}</b><span class="tag ${o.type}">${TYPE_LABEL[o.type]}</span></div><p>${esc(o.thesis)}</p></div>
      ${C.sparkline(o.spark, { w: 110, h: 34 })}</a></li>`;
  }

  /* Constellation : chaque titre est un cercle, sa taille suit le score.
     Placement en spirale autour du centre, sans chevauchement. */
  function constellation(items) {
    const placed = [];
    const W = 1000;
    items.forEach((o, i) => {
      const r = Math.max(30, Math.min(130, 22 * Math.exp((o.score - 40) / 18)));
      if (!i) { placed.push({ o, r, x: W / 2, y: 0 }); return; }
      for (let k = 0; k < 20000; k++) {
        const a = k * 0.08, d = 1.6 * a;
        const x = W / 2 + d * Math.cos(a) * 1.5, y = d * Math.sin(a);
        if (x - r < 0 || x + r > W) continue;
        if (placed.every((p) => Math.hypot(p.x - x, p.y - y) > p.r + r + 10)) { placed.push({ o, r, x, y }); return; }
      }
    });
    const minY = Math.min(...placed.map((p) => p.y - p.r)) - 4, maxY = Math.max(...placed.map((p) => p.y + p.r)) + 4;
    return `<svg class="constellation" viewBox="0 ${minY.toFixed(0)} ${W} ${(maxY - minY).toFixed(0)}" role="list" aria-label="Titres classés par score, en cercles">
      ${placed.map(({ o, r, x, y }) => {
        // Le nom complet s'il tient dans le cercle, sinon le code du titre.
        let fs = Math.min(30, r / 3.4), name = o.name;
        while (name.length * fs * 0.56 > r * 1.7 && fs > 13) fs -= 1;
        if (name.length * fs * 0.56 > r * 1.7) { name = o.ticker; fs = Math.min(26, r / 3); }
        return `<a href="#fiche-${o.ticker}" role="listitem" aria-label="${esc(o.name)}, score ${o.score}">
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" class="${o.chg1m >= 0 ? "pos" : "neg"}"/>
          <text class="c-name" x="${x.toFixed(1)}" y="${(y + fs * 0.1).toFixed(1)}" font-size="${fs.toFixed(1)}">${esc(name)}</text>
          <text class="c-score" x="${x.toFixed(1)}" y="${(y + fs * 0.1 + 18).toFixed(1)}" font-size="11">${r < 48 ? o.score : `${o.score} [${o.low}–${o.high}]`}</text></a>`;
      }).join("")}</svg>`;
  }

  function viewScanner() {
    const types = ["tout", "valeur", "contrarian", "momentum", "anomalie"];
    const q = state.query.toLowerCase();
    const rows = M.universe
      .filter((o) => state.filter === "tout" || o.type === state.filter)
      .filter((o) => !q || (o.name + o.ticker + o.sector).toLowerCase().includes(q))
      .sort((a, b) => b.score - a.score);
    const empty = `<div class="empty">Aucun titre ne correspond. Essaie un autre filtre ou une autre recherche.</div>`;
    return head("Scanner", "Tout l'univers surveillé. Plus un cercle est grand, plus le score est élevé. Un contour pointillé signale un titre en baisse sur un mois.", "", `Marchés <span aria-hidden="true">/</span> Scanner`) + `
    <div class="row between wrap" style="margin-bottom:34px;gap:16px">
      <div class="chips" role="group" aria-label="Filtrer par type de signal">
        ${types.map((t) => `<button class="chip" data-filter="${t}" aria-pressed="${state.filter === t}">${t === "tout" ? "Tout" : TYPE_LABEL[t]}</button>`).join("")}
      </div>
      <div class="chips" role="group" aria-label="Choisir l'affichage">
        <button class="chip" data-scanview="cercles" aria-pressed="${state.scanView === "cercles"}">Cercles</button>
        <button class="chip" data-scanview="liste" aria-pressed="${state.scanView === "liste"}">Liste</button>
      </div>
    </div>
    ${q ? `<p style="margin:-14px 0 24px">Recherche : <b>${esc(state.query)}</b> · <button class="btn small" data-action="clear-search">Effacer</button></p>` : ""}
    ${!rows.length ? empty : state.scanView === "cercles" ? constellation(rows.slice(0, 32)) + (rows.length > 32 ? `<p class="label" style="margin-top:18px">Les 32 meilleurs scores. Les ${rows.length} titres sont dans la vue Liste.</p>` : "") : `
    <div class="table-scroll"><table class="table">
      <thead><tr><th>Titre</th><th class="hide-m">Tendance 3 mois</th><th class="r">1 mois</th><th class="r hide-m">${ex("rsi", "RSI")}</th><th class="r">${ex("score", "Score")}</th></tr></thead>
      <tbody>${rows.map((o) => `<tr data-go="#fiche-${o.ticker}" tabindex="0">
        <td class="who"><b>${esc(o.name)}</b><span>${esc(o.ticker)} / ${esc(o.sector)}</span></td>
        <td class="hide-m">${C.sparkline(o.spark, { w: 120, h: 30 })}</td>
        <td class="r num ${o.chg1m >= 0 ? "gain" : "loss"}">${pct(o.chg1m)}</td>
        <td class="r num hide-m ${o.rsi < 30 ? "warn" : ""}">${o.rsi}</td>
        <td class="r"><span class="num serif" style="font-size:22px">${o.score}</span> <span class="label nowrap">${o.low}–${o.high}</span></td>
      </tr>`).join("")}</tbody>
    </table></div>`}
    <p class="label" style="margin-top:28px">${M.isMock ? `Univers de démonstration de ${M.universe.length} titres.` : `${M.universe.length} titres suivis, mis à jour chaque soir de semaine. La liste se modifie dans pipeline/config.yaml.`}</p>`;
  }

  const FACTORS = [
    ["valuation", "Valorisation", 25, "pe", "Est-ce bon marché par rapport aux autres titres et à son secteur ? {peText}"],
    ["quality", "Qualité", 25, null, "L'entreprise est-elle solide ? Marges, rentabilité, dette et régularité des bénéfices."],
    ["momentum", "Tendance", 20, "momentum", "Le prix monte-t-il sur 12 mois ? Une tendance faible n'interdit pas d'acheter, mais demande plus de patience."],
    ["risk", "Stabilité", 15, "volatilite", "Plus c'est haut, moins le prix est agité. Volatilité actuelle : {vol} % par an."],
    ["macro", "Contexte économique", 15, "phase", "Le secteur profite-t-il de la phase actuelle du cycle ?"],
  ];
  function viewFiche(ticker) {
    const any = M.universe.find((x) => x.ticker === ticker) || M.opportunities.find((x) => x.ticker === ticker);
    const o = any && any.factors ? any : null;
    const lite = !o ? any : null;
    if (!o && !lite) return head("Titre introuvable") + `<div class="empty">Ce titre n'est pas dans l'univers surveillé. <a href="#scanner">Retour au scanner</a></div>`;
    if (lite) return head(esc(lite.name), `${esc(lite.ticker)} / ${esc(lite.sector)}`, "", `<a href="#scanner">Scanner</a> / ${esc(lite.name)}`) + `
      <section class="panel"><div class="fiche-head">${C.orb(lite.score, lite.low, lite.high, 150)}
      <p class="muted">Les détails de ce titre n'ont pas pu être calculés lors de la dernière mise à jour (données incomplètes). Ils reviendront à la prochaine mise à jour réussie.</p></div></section>`;

    const p = state.profile, b = book("real");
    const total = Math.max(b.value, p.capital || 0, 500);
    const maxAmount = Math.floor((total * p.maxLine) / 100);
    const amount = o.type === "coeur" ? planSplit(p).core : Math.min(maxAmount, 50);
    const limit = money(o.currency === "GBp" ? o.price * 0.99 / 100 : o.price * 0.99, o.currency === "GBp" ? "GBP" : o.currency);
    const scen = (arr, label) => `<div style="margin-bottom:14px"><div class="row between small" style="margin-bottom:6px"><span>${label}</span><span class="dim">vs ETF monde</span></div>
      <div class="scen" role="img" aria-label="${arr[0]} % mieux, ${arr[1]} % pareil, ${arr[2]} % moins bien">
      <span class="up" style="width:${arr[0]}%">${arr[0]} %</span><span class="flat" style="width:${arr[1]}%">${arr[1]} %</span><span class="down" style="width:${arr[2]}%">${arr[2]} %</span></div></div>`;

    return `${head(esc(o.name), `${esc(o.ticker)} / ${esc(o.sector)} / ${esc(o.country)}`, "", `<a href="#scanner">Scanner</a> / ${esc(o.name)}`)}
    <div class="stack">
      <section><div class="fiche-head">
        ${C.orb(o.score, o.low, o.high, 170)}
        <div>
          <span class="tag ${o.type}">${TYPE_LABEL[o.type]}</span>
          <p class="thesis">${esc(o.thesis)}</p>
          <p class="muted" style="max-width:60ch">Score de ${o.score} sur 100, probablement entre ${o.low} et ${o.high}. ${o.backtest ? (o.high - o.low > 20 ? "La fourchette est large : les cas passés similaires sont peu nombreux et assez dispersés." : "La fourchette est étroite : les données sont complètes et les cas passés cohérents.") : (o.high - o.low > 20 ? "La fourchette est large : des données manquent ou les facteurs se contredisent." : "La fourchette est assez étroite : les facteurs vont plutôt dans le même sens.") + " Seule la partie « prix » du score est testée sur le passé : voir la page " + `<a href="#methode">Méthode</a>.`}</p>
          <div class="facts">
            <div><div class="label">Cours actuel</div><div class="v num">${money(o.price, o.currency)}</div></div>
            <div><div class="label">Sur 1 mois</div><div class="v num ${o.chg1m >= 0 ? "gain" : "loss"}">${pct(o.chg1m)}</div></div>
            <div><div class="label">${ex("rsi", "RSI")}</div><div class="v num">${num(o.rsi, 0)}</div></div>
            <div><div class="label">${ex("pe", "PER")}</div><div class="v num">${num(o.pe)}</div></div>
          </div>
        </div></div>
      </section>

      <div class="grid g-2">
        <section class="panel">
          <div class="panel-head"><h2>D'où vient le score</h2><p>Clique sur un facteur</p></div>
          ${FACTORS.map(([k, label, w, gk, why]) => `<details class="fx"><summary>
              <span>${gk ? ex(gk, label) : label} <span class="dim small nowrap">${w}\u00a0%</span></span>
              <span class="bar ${k === "risk" ? "risk" : ""}"><span style="width:${o.factors[k]}%"></span></span>
              <span class="num" style="text-align:right">${o.factors[k]}</span></summary>
            <p class="why">${why.replace("{peText}", o.pe ? `PER de ${num(o.pe)}${o.pe_sector ? `, contre ${num(o.pe_sector)} en médiane dans son secteur.` : "."}` : o.kind === "ETF" ? "Pour un ETF, la valorisation compte peu : il contient tout le marché." : "PER indisponible pour ce titre.").replace("{vol}", num(o.vol, 0))}</p></details>`).join("")}
        </section>
        ${o.scenarios ? `<section class="panel">
          <div class="panel-head"><h2>Scénarios</h2></div>
          <p class="muted small" style="margin-bottom:16px">Parmi les cas passés qui ressemblaient à celui-ci, combien ont fait mieux que l'ETF monde (de plus de 5 %), à peu près pareil, ou moins bien. Ce n'est pas une prédiction.</p>
          ${scen(o.scenarios.m3, "Dans 3 mois")}${scen(o.scenarios.m12, "Dans 12 mois")}
          <div class="legend small"><span><i style="background:var(--gain)"></i>Mieux</span><span><i style="border:1px solid var(--ink)"></i>Pareil</span><span><i style="background:var(--ink)"></i>Moins bien</span></div>
        </section>` : `<section class="panel">
          <div class="panel-head"><h2>Le titre en chiffres</h2><p>Faits, pas prévisions</p></div>
          ${C.sparkline(o.spark, { w: 520, h: 90 }).replace('class="spark"', 'class="spark" style="width:100%;height:auto;margin-bottom:14px"')}
          ${[["Sur 3 mois", pct(o.chg3m)], ["Sur 12 mois", pct(o.chg12m)], [ex("volatilite", "Volatilité sur un an"), o.vol != null ? num(o.vol, 0) + " %" : "—"],
             [ex("drawdown", "Pire baisse sur un an"), pct(o.maxdd_1y)], ["Écart avec son plus haut sur un an", pct(o.dist_52w_high)]]
            .map(([l, v]) => `<div class="row between" style="padding:9px 0;border-bottom:1px solid var(--rule-soft)"><span>${l}</span><span class="num">${v}</span></div>`).join("")}
          ${M.backtest ? `<p class="muted small" style="margin-top:14px">Pour situer : sur ${M.backtest.months} mois, les actions les mieux classées sur la tendance et la stabilité ont fait mieux que la moyenne ${num(M.backtest.beat_all_pct, 0)} % des mois. <a href="#methode">Voir le test sur le passé</a>.</p>` : ""}
        </section>`}
      </div>

      ${(o.analysts || o.news?.length || M.brief?.ideas_notes?.[o.ticker]) ? `<div class="grid g-2">
        <section class="panel">
          <div class="panel-head"><h2>L'avis des analystes</h2><p>Consensus</p></div>
          ${o.analysts ? `<div class="row" style="gap:30px;align-items:flex-end;margin-bottom:14px">
              <div><div class="serif" style="font-size:40px;line-height:1">${esc(o.analysts.label)}</div><div class="label" style="margin-top:6px">${o.analysts.count} analystes</div></div>
              ${o.analysts.target ? `<div><div class="num" style="font-size:24px">${money(o.analysts.target, o.currency)}</div><div class="label">objectif moyen à 12 mois${o.analysts.upside != null ? `, soit ${pct(o.analysts.upside)}` : ""}</div></div>` : ""}</div>
            ${o.analysts.low && o.analysts.high ? `<p class="small">Fourchette des objectifs : de ${money(o.analysts.low, o.currency)} à ${money(o.analysts.high, o.currency)}. Plus elle est large, moins les analystes sont d'accord entre eux.</p>` : ""}
            ${staleTargets(o) ? `<p class="flag">Le cours (${money(o.price, o.currency)}) est ${o.price < o.analysts.low ? "sous l'objectif le plus bas" : "très loin sous l'objectif moyen"}. C'est souvent le signe que les objectifs n'ont pas encore été revus après une baisse récente : la hausse affichée est probablement trop optimiste.</p>` : ""}
            <p class="muted small" style="margin-top:10px">Ce sont les analystes des banques et bureaux d'études qui suivent le titre (via Yahoo Finance). Ils sont en moyenne trop optimistes et changent souvent d'avis : c'est un repère, pas un verdict.</p>`
          : `<p class="muted">Moins de trois analystes suivent ce titre${o.kind === "ETF" ? " (normal pour un ETF : il n'y a pas d'entreprise à analyser)" : ""}.</p>`}
          ${M.brief?.ideas_notes?.[o.ticker] ? `<div class="flag" style="border-color:var(--ink)">${esc(M.brief.ideas_notes[o.ticker])}</div>` : ""}
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Dans l'actualité</h2><p>Derniers articles</p></div>
          ${relevantNews(o).length ? relevantNews(o).map((n) => `<a href="${esc(n.url)}" target="_blank" rel="noopener" style="display:block;padding:11px 0;border-bottom:1px solid var(--rule-soft);text-decoration:none">
              <span class="serif" style="font-size:16px;line-height:1.35">${esc(n.title)}</span>
              <span class="label" style="display:block;margin-top:4px">${esc(n.publisher || "")}${n.date ? " / " + new Date(n.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</span></a>`).join("")
            : `<p class="muted">${o.news?.length ? "Aucun article récent ne parle directement de ce titre." : "Les articles sont récupérés pour les idées du jour et ta liste de surveillance."}</p>`}
        </section>
      </div>` : ""}

      <section class="panel wrong">
        <div class="panel-head"><h2>Pourquoi je pourrais avoir tort</h2></div>
        <ul>${o.wrong.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
        <p style="margin-top:14px"><b>Ce qui invaliderait la thèse :</b> <span class="muted">${esc(o.invalidation)}</span></p>
      </section>

      ${o.backtest ? `<section class="panel">
        <div class="panel-head"><h2>Ce que ce signal a donné par le passé</h2><p>${ex("backtest", "Backtest")} ${o.backtest.years}</p></div>
        <div class="kpis">
          <div class="kpi"><div class="v num">${o.backtest.cases}</div><div class="l">cas similaires trouvés</div></div>
          <div class="kpi"><div class="v num">${o.backtest.hit} %</div><div class="l">ont battu l'ETF monde à 12 mois</div></div>
          <div class="kpi"><div class="v num ${o.backtest.avg >= 0 ? "gain" : "loss"}">${pct(o.backtest.avg)}</div><div class="l">d'écart moyen avec l'ETF</div></div>
          <div class="kpi"><div class="v num loss">${o.backtest.maxdd} %</div><div class="l">${ex("drawdown", "pire baisse")} subie en route</div></div>
        </div>
        ${o.backtest.flags.map((f) => `<div class="flag">${{
          "peu de cas": "Moins de 30 cas : le résultat peut être dû au hasard. Prends-le comme un indice, pas une preuve.",
          "survivant": "Biais du survivant : seules les entreprises encore cotées aujourd'hui sont testées, ce qui embellit les chiffres.",
          "période favorable": "La période testée est surtout haussière : le signal n'a pas été éprouvé dans une vraie crise.",
        }[f]}</div>`).join("")}
      </section>` : `<section class="panel"><div class="panel-head"><h2>Ce que ce signal a donné par le passé</h2><p>${ex("backtest", "Backtest")}</p></div><p class="small" style="max-width:70ch">Pyxis ne teste pas chaque type de signal séparément : il y a trop peu de cas pour que ce soit fiable. Ce qui est testé, c'est la partie « prix » du score sur l'ensemble des actions suivies${M.backtest ? ` : le tiers le mieux classé a fait ${pct(M.backtest.strategies.top.annual)} par an contre ${pct(M.backtest.strategies.all.annual)} pour la moyenne, avec une pire baisse de ${pct(M.backtest.strategies.top.maxdd, 0)} contre ${pct(M.backtest.strategies.all.maxdd, 0)}` : ""}. <a href="#methode">Le détail et ses limites</a>.</p></section>`}

      <section class="panel">
        <div class="panel-head"><h2>Si tu veux passer à l'action</h2><p>Adapté à ton profil</p></div>
        <ol class="steps">
          <li><div><b>Montant : ${amount} €</b><div class="muted small">${o.type === "coeur" ? "C'est ta part mensuelle pour le cœur de portefeuille." : `Au maximum ${p.maxLine} % de ton portefeuille sur une seule action, soit ${maxAmount} €. On reste en dessous pour commencer.`}</div></div></li>
          <li><div><b>${o.type === "coeur" ? "Plan d'investissement programmé" : `${ex("ordreLimite", "Ordre à cours limité")} à ${limit}`}</b><div class="muted small">${o.type === "coeur" ? "Le même jour chaque mois, sans regarder le cours. C'est souvent gratuit chez les courtiers en ligne." : "Environ 1 % sous le cours actuel : tu n'achètes pas plus cher que prévu si le prix s'agite à l'ouverture."}</div></div></li>
          <li><div><b>Horizon : ${o.type === "coeur" ? "10 ans et plus" : "12 mois, puis revue"}</b><div class="muted small">${o.type === "coeur" ? "On ne vend pas dans les baisses : c'est là que le plan achète le moins cher." : "Une date de revue est ajoutée au journal pour vérifier si la thèse s'est réalisée."}</div></div></li>
          <li><div><b>Sortie</b><div class="muted small">${esc(o.invalidation)}</div></div></li>
        </ol>
        ${o.type !== "coeur" && 1 / amount > 0.01 ? `<div class="flag">Avec environ 1 € de frais, un achat de ${amount} € coûte ${((1 / amount) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % d'entrée. Ton capital est encore petit pour une action seule : teste d'abord cette idée en simulé, ou attends que ta cagnotte satellite atteigne 100 €.</div>` : ""}
        <div class="row wrap" style="margin-top:16px">
          <button class="btn primary" data-action="journal-new" data-ticker="${o.ticker}" data-amount="${amount}" data-thesis="${esc(o.thesis)}">Noter dans le journal</button>
          <button class="btn" data-action="sim-add" data-ticker="${o.ticker}" data-amount="${amount}">Tester en simulé (${amount} € fictifs)</button>
        </div>
      </section>
    </div>` + disclaimer;
  }

  /* ---------- La veille : synthèse quotidienne rédigée chaque matin (tâche Claude planifiée) ---------- */
  const srcLinks = (arr) => (arr || []).map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name || "source")}</a>`).join(", ");
  function viewVeille() {
    const b = M.brief;
    if (!b) return head("La veille", "Chaque matin de semaine, une synthèse de l'actualité des marchés et des analyses des grandes maisons, expliquée simplement.") +
      `<div class="empty">La première veille n'est pas encore publiée. Elle arrive chaque matin de semaine vers 7 h.</div>`;
    const d = new Date(b.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const STANCE = { positif: ["Plutôt confiant", "gain"], neutre: ["Neutre", "mute"], prudent: ["Prudent", "warn"] };
    return head("La veille", `${d.charAt(0).toUpperCase() + d.slice(1)}. Rédigée à partir de sources publiques, avec un lien vers chacune.`, "", `Veille / ${esc(b.date)}`) + `
    <section class="hero" style="padding:40px">
      <span class="label">L'essentiel</span>
      <h2 class="serif" style="font-size:clamp(30px,3.6vw,48px);line-height:1.05;letter-spacing:-.02em;margin:16px 0 18px;max-width:24ch">${esc(b.headline)}</h2>
      <p class="serif" style="font-size:19px;line-height:1.55;max-width:66ch;color:var(--on-ink)">${esc(b.summary)}</p>
    </section>
    <div class="grid g-home" style="margin-top:54px">
      <div class="stack">
        ${(b.sections || []).map((sec) => `<section class="panel">
          <div class="panel-head"><h2>${esc(sec.title)}</h2></div>
          ${(sec.points || []).map((p) => `<div style="padding:12px 0;border-bottom:1px solid var(--rule-soft)">
            <p class="serif" style="font-size:17px;line-height:1.5">${esc(p.text)}</p>
            ${p.sources?.length ? `<p class="label" style="margin-top:6px">Sources : ${srcLinks(p.sources)}</p>` : ""}</div>`).join("")}
        </section>`).join("")}
      </div>
      <div class="stack">
        ${b.for_you?.length ? `<section class="hero"><span class="label">Ce que ça change pour toi</span>
          <ul class="plain-list" style="margin-top:14px">${b.for_you.map((x) => `<li class="serif" style="font-size:16px;line-height:1.5;margin:8px 0">${esc(x)}</li>`).join("")}</ul></section>` : ""}
        ${b.houses?.length ? `<section class="panel"><div class="panel-head"><h2>Ce que disent les grandes maisons</h2></div>
          ${b.houses.map((h) => `<div style="padding:12px 0;border-bottom:1px solid var(--rule-soft)">
            <div class="row between"><b style="font-weight:500">${esc(h.name)}</b><span class="label" style="color:var(--${(STANCE[h.stance] || STANCE.neutre)[1]})">${(STANCE[h.stance] || STANCE.neutre)[0]}</span></div>
            <p class="small" style="margin-top:4px">${esc(h.view)}</p>
            <p class="label" style="margin-top:4px">${h.date ? esc(h.date) + " / " : ""}${h.url ? `<a href="${esc(h.url)}" target="_blank" rel="noopener">lire</a>` : ""}</p></div>`).join("")}
          <p class="muted small" style="margin-top:12px">Perspectives publiques de grands gérants et banques. Elles se trompent aussi : leur intérêt est de montrer où se situe le consensus.</p></section>` : ""}
      </div>
    </div>
    <p class="label" style="margin-top:40px">Synthèse rédigée par une IA (Claude) à partir des sources citées, relue par aucun humain : en cas de doute, la source fait foi.</p>` + disclaimer;
  }

  function viewMacro() {
    const m = M.macro;
    if (!m) return head("Contexte économique") + `<div class="empty">Les indicateurs économiques n'ont pas pu être chargés. Réessaie dans quelques minutes.</div>`;
    return head("Contexte économique", "Où en est l'économie, et quels secteurs ont tendance à mieux résister dans cette phase.") + `
    <div class="grid g-2">
      <section class="panel">
        <div class="panel-head"><h2>${ex("phase", "Phase du cycle")}</h2></div>
        ${C.cycleDial(m.phase)}
        <p class="muted" style="margin-top:10px">Nous serions en <b style="color:var(--ink)">${m.phase}</b>. ${esc(m.phase_text || "La croissance continue mais perd de la vitesse.")} C'est une estimation à partir de quelques indicateurs publics${m.confidence ? `, avec une confiance ${esc(m.confidence)}` : ""} : les phases ne se lisent clairement qu'après coup.</p>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Les indicateurs</h2></div>
        <div class="stack" style="gap:14px">${m.indicators.map((i) => `<div>
          <div class="row between"><span>${esc(i.label)}</span><span class="num" style="font-weight:600">${esc(i.value)} <span class="dim small">${esc(i.trend)}</span></span></div>
          <p class="muted small">${esc(i.meaning)}</p></div>`).join("")}</div>
      </section>
    </div>
    <section class="panel" style="margin-top:18px">
      <div class="panel-head"><h2>Secteurs adaptés à cette phase</h2><p>Historiquement, en moyenne</p></div>
      ${m.sectors.map((s) => `<div class="factor"><span>${esc(s.name)}</span><span class="bar"><span style="width:${s.fit}%"></span></span><span class="num" style="text-align:right">${s.fit}</span><p class="why" style="padding-top:0">${esc(s.note)}</p></div>`).join("")}
    </section>` + disclaimer;
  }

  function viewPortfolio() {
    const p = state.profile, b = book(state.book);
    const proj = C.project({ monthly: state.sim.monthly, initial: b.value, years: state.sim.years });
    const end = proj[proj.length - 1];
    return head("Portefeuille", "Tes positions au dernier cours de clôture, tes règles de risque et ce que ton plan pourrait donner. Tes positions restent dans ce navigateur : elles ne sont jamais publiées.") + `
    <div class="chips" role="group" aria-label="Choisir le portefeuille" style="margin-bottom:18px">
      <button class="chip" data-book="real" aria-pressed="${state.book === "real"}">Réel</button>
      <button class="chip" data-book="simulated" aria-pressed="${state.book === "simulated"}">Simulé (argent fictif)</button>
    </div>
    <div class="kpis" style="margin-bottom:18px">
      <div class="kpi"><div class="v num">${eur(b.value, 2)}</div><div class="l">Valeur actuelle</div></div>
      <div class="kpi"><div class="v num">${eur(b.invested, 2)}</div><div class="l">Montant investi</div></div>
      <div class="kpi"><div class="v num ${b.pnl >= 0 ? "gain" : "loss"}">${b.pnl >= 0 ? "+" : ""}${eur(b.pnl, 2)}</div><div class="l">${ex("latent", "Gain ou perte latente")}</div></div>
      <div class="kpi"><div class="v num">${Math.round(b.corePct)} %</div><div class="l">Part du cœur (objectif ${p.core} %)</div></div>
    </div>
    <div class="grid g-2">
      <section class="panel">
        <div class="panel-head"><h2>Positions</h2><div class="row" style="gap:8px"><button class="btn small" data-action="import-csv">Importer un relevé</button><button class="btn small" data-action="add-position">Ajouter une position</button></div></div>
        ${b.rows.length ? `<div class="table-scroll"><table class="table"><thead><tr><th>Titre</th><th class="r">Valeur</th><th class="r">Résultat</th><th></th></tr></thead><tbody>
          ${b.rows.map((r, i) => `<tr data-go="#fiche-${r.ticker}" tabindex="0"><td class="who"><b>${esc(r.name)}</b><span>${r.qty.toLocaleString("fr-FR")} part(s) / ${r.bucket === "coeur" ? "cœur" : "satellite"}${r.live ? "" : " / cours non suivi"}</span></td>
          <td class="r num">${eur(r.value, 2)}</td><td class="r num ${r.value >= r.invested ? "gain" : "loss"}">${pct(r.invested ? ((r.value - r.invested) / r.invested) * 100 : 0)}</td>
          <td class="r"><button class="btn small" data-action="del-position" data-i="${i}" aria-label="Retirer ${esc(r.name)}">Retirer</button></td></tr>`).join("")}
        </tbody></table></div>` : `<div class="empty">Aucune position${state.book === "simulated" ? " simulée" : ""}. Ajoute ce que tu possèdes : le titre, le nombre de parts et le prix payé.</div>`}
        <p class="muted small" style="margin-top:12px">Un ${ex("latent", "gain latent")} n'existe que sur le papier tant que tu ne vends pas.</p>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Tes règles</h2><a class="btn small" href="#reglages">Modifier</a></div>
        <div>
          ${ruleLine(b.corePct >= p.core - 10, `Cœur ETF ≥ ${p.core - 10} %`, `Actuellement ${Math.round(b.corePct)} %.`)}
          ${ruleLine(b.maxLinePct <= p.maxLine, `Aucune action seule au-dessus de ${p.maxLine} %`, `La plus grosse pèse ${Math.round(b.maxLinePct)} %.`)}
          ${ruleLine(true, "Frais sous 1 % par achat", "Avec 1 € de frais par ordre, n'achète pas une action seule pour moins de 100 €.")}
        </div>
        <p class="muted small" style="margin-top:18px">Pour reprendre tes positions sans tout saisir, utilise « Importer un relevé » avec l'export CSV des transactions de ton courtier.</p>
      </section>
    </div>
    <section class="panel" style="margin-top:18px">
      <div class="panel-head"><h2>Que pourrait donner ton plan ?</h2><p>${ex("interets", "Intérêts composés")}</p></div>
      <div class="grid g-2" style="margin-bottom:10px">
        <label class="field">Versement mensuel : <b class="num" style="color:var(--ink)" id="mOut">${state.sim.monthly} €</b><input type="range" min="25" max="1000" step="25" value="${state.sim.monthly}" data-sim="monthly"></label>
        <label class="field">Durée : <b class="num" style="color:var(--ink)" id="yOut">${state.sim.years} ans</b><input type="range" min="5" max="40" step="1" value="${state.sim.years}" data-sim="years"></label>
      </div>
      <div id="fan">${C.fanChart(proj)}</div>
      <div class="kpis" id="fanK" style="margin-top:14px">${fanKpis(end)}</div>
      <p class="muted small" style="margin-top:12px">600 trajectoires simulées avec un rendement moyen de 7 % par an et une volatilité de 15 %, proches de l'historique des actions mondiales. La bande foncée contient 8 trajectoires sur 10. La ligne pointillée, c'est ce que tu as versé. Rien de tout cela n'est garanti.</p>
    </section>` + disclaimer;
  }
  function fanKpis(end) {
    return `<div class="kpi"><div class="v num">${eur(end.paid)}</div><div class="l">Versé au total</div></div>
      <div class="kpi"><div class="v num warn">${eur(end.p10)}</div><div class="l">Cas défavorable (1 chance sur 10 de faire moins)</div></div>
      <div class="kpi"><div class="v num gain">${eur(end.p50)}</div><div class="l">Cas médian</div></div>
      <div class="kpi"><div class="v num">${eur(end.p90)}</div><div class="l">Cas favorable (1 chance sur 10 de faire mieux)</div></div>`;
  }

  /* Performance d'un titre depuis une date, d'après l'historique hebdomadaire. */
  function perfSince(ticker, date) {
    const h = M.history && M.history[ticker];
    if (!h || !h.closes?.length) return null;
    const weeks = Math.floor((new Date(date) - new Date(h.start)) / (7 * 864e5));
    if (weeks < 0 || weeks >= h.closes.length - 1) return null;
    return (h.closes[h.closes.length - 1] / h.closes[Math.max(0, weeks)] - 1) * 100;
  }
  function compareToBenchmark(entries) {
    const bench = M.benchmark || "EUNL.DE", pairs = [];
    entries.filter((e) => e.action === "achat").forEach((e) => {
      const t = M.universe.find((u) => u.ticker === e.ticker || u.ticker.split(".")[0] === e.ticker);
      const a = t && perfSince(t.ticker, e.date), b = perfSince(bench, e.date);
      if (a != null && b != null) pairs.push([a, b]);
    });
    if (!pairs.length) return null;
    const avg = (i) => pairs.reduce((s, p) => s + p[i], 0) / pairs.length;
    return { mine: avg(0), bench: avg(1), n: pairs.length };
  }
  function viewJournal() {
    const j = state.journal.slice().sort((a, b) => b.date.localeCompare(a.date));
    const n = j.length, need = 20;
    return head("Journal de décisions", "Chaque achat ou vente, avec ta raison du moment. C'est ce qui te permettra de savoir si ta méthode marche vraiment.",
      `<button class="btn primary" data-action="journal-new">Nouvelle décision</button>`) + `
    <section class="hero" style="margin-bottom:18px">
      <h2>Est-ce que ça marche ?</h2>
      <p class="muted" style="margin:6px 0 18px;max-width:62ch">Sur quelques mois, le hasard pèse plus que la méthode. Ce tableau te dira quand tu as assez de recul pour conclure.</p>
      <div class="grid g-3 jstats">
        <div><div class="num" style="font-size:30px;font-weight:600">${n} <span class="dim" style="font-size:16px">/ ${need}</span></div><div class="muted small">décisions notées. Il en faut une vingtaine pour commencer à juger.</div>
          <div class="bar" style="margin-top:10px"><span style="width:${Math.min(100, (n / need) * 100)}%"></span></div></div>
        ${(() => { const c = compareToBenchmark(j); return c
          ? `<div><div class="num" style="font-size:30px;font-weight:600">${pct(c.mine)} <span class="dim" style="font-size:16px">vs ${pct(c.bench)}</span></div><div class="muted small">Tes ${c.n} décision(s) comparées à l'ETF monde sur les mêmes dates, d'après les cours de clôture hebdomadaires.</div></div>`
          : `<div><div class="num" style="font-size:30px;font-weight:600">—</div><div class="muted small">Tes choix comparés à l'ETF monde sur les mêmes dates. Apparaît dès qu'une décision porte sur un titre suivi.</div></div>`; })()}
        <div><div class="num" style="font-size:30px;font-weight:600">—</div><div class="muted small">Thèses réalisées pour les raisons prévues. Rempli au fil des revues.</div></div>
      </div>
      <p style="margin-top:18px"><b>Verdict : pas encore assez de données.</b> <span class="muted">Continue de tout noter.</span></p>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Décisions</h2></div>
      ${n ? `<div class="stack" style="gap:0">${j.map((e) => `<article style="padding:14px 0;border-top:1px solid var(--line)">
        <div class="row between wrap"><div class="row"><b class="num">${esc(e.ticker)}</b><span class="tag ${e.action === "achat" ? "valeur" : "risk"}">${esc(e.action)}</span><span class="num">${eur(+e.amount)}</span></div>
        <span class="dim small">${new Date(e.date).toLocaleDateString("fr-FR")}${e.review ? ` · revue le ${new Date(e.review).toLocaleDateString("fr-FR")}` : ""}</span></div>
        <p class="muted" style="margin-top:6px">${esc(e.thesis)}</p></article>`).join("")}</div>`
        : `<div class="empty">Ton journal est vide. Note ta première décision, même un simple achat d'ETF.</div>`}
    </section>` + disclaimer;
  }

  /* ---------- Courtiers : comparatif vérifié + calcul du coût annuel dans ton cas ---------- */
  function brokerCost(b, sc) {
    const m = b.model;
    const etfFee = (amt) => (m.order_fixed || 0) + Math.max(m.order_min || 0, (m.order_pct || 0) / 100 * amt);
    const stockFee = (amt) => m.stock_fixed != null ? m.stock_fixed : (m.order_fixed || 0) + Math.max(m.stock_min ?? m.order_min ?? 0, (m.order_pct || 0) / 100 * amt);
    const plan = m.plan_free ? 0 : 12 * etfFee(sc.plan);
    const stocks = sc.n * (stockFee(sc.amt) + (m.fx_pct || 0) / 100 * sc.amt * sc.us / 100);
    const yearly = sc.us > 0 && sc.n > 0 ? (m.yearly || 0) : 0;
    return { total: plan + stocks + yearly, plan, stocks: stocks + yearly };
  }
  function brokerTable() {
    const B = M.brokers;
    if (!B) return `<div class="empty">Le comparatif se charge depuis le site en ligne.</div>`;
    const sc = state.brokerSc;
    const rows = B.brokers.map((b) => ({ b, c: brokerCost(b, sc) }))
      .filter((r) => !state.simpleTax || r.b.tax === "simple")
      .sort((x, y) => x.c.total - y.c.total);
    const max = Math.max(...rows.map((r) => r.c.total), 1);
    const invested = sc.plan * 12 + sc.n * sc.amt;
    const TAX = { simple: ["Impôts automatiques", "gain"], partial: ["Impôts en partie à déclarer", "warn"], declarative: ["Impôts à déclarer toi-même", "warn"] };
    return rows.map(({ b, c }, i) => `<details class="fx">
      <summary class="brk">
        <span class="num serif" style="font-size:18px">${i + 1}</span>
        <span><b style="font-weight:500">${esc(b.name)}</b><br><span class="label" style="color:var(--${TAX[b.tax][1] === "gain" ? "gain" : "mute"})">${TAX[b.tax][0]}</span></span>
        <span class="bar"><span style="width:${Math.max(1.5, (c.total / max) * 100)}%"></span></span>
        <span class="num nowrap" style="text-align:right">${money(c.total, "EUR")}<br><span class="label">${invested ? num((c.total / invested) * 100, 2) + " % investi" : ""}</span></span>
      </summary>
      <div class="grid g-2" style="gap:12px 40px;padding:16px 0 6px">
        <div>
          ${[["Type", b.kind], ["Régulateur", b.regulator], ["Achat d'ETF", b.etf_order], ["Achat d'action", b.stock_order], ["Plan programmé", b.plan], ["Fractions d'action", b.fractional ? "Oui" : "Non"], ["Change en dollars", b.fx]]
            .map(([l, v]) => `<div class="row between" style="padding:7px 0;border-bottom:1px solid var(--rule-soft);gap:20px"><span class="label">${l}</span><span style="text-align:right">${esc(v)}</span></div>`).join("")}
        </div>
        <div>
          <p class="small" style="margin-bottom:10px"><b>Fiscalité en Espagne.</b> ${esc(b.tax_text)}</p>
          <p class="label" style="margin-bottom:4px">Points forts</p><ul class="plain-list small">${b.pros.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <p class="label" style="margin:10px 0 4px">Points faibles</p><ul class="plain-list small">${b.cons.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <p class="label" style="margin-top:12px">Sources : ${b.sources.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>${x.lang === "es" ? " (ES)" : ""}`).join(", ")}</p>
        </div>
      </div></details>`).join("");
  }
  function viewBrokers() {
    const sc = state.brokerSc;
    const B = M.brokers;
    return head("Courtiers et exécution", "Où acheter, au coût le plus bas et avec le moins de paperasse, quand on est résident fiscal en Espagne.") + `
    <section class="panel">
      <div class="panel-head"><h2>Combien te coûterait chaque courtier, sur un an ?</h2><p>${B ? `Tarifs vérifiés le ${new Date(B.checked).toLocaleDateString("fr-FR")}` : ""}</p></div>
      <div class="grid g-2" style="gap:6px 40px;margin-bottom:24px">
        <label class="field">Plan programmé sur un ETF, chaque mois : <b class="num" id="sc-plan-o">${sc.plan} €</b><input type="range" min="0" max="1000" step="10" value="${sc.plan}" data-sc="plan"></label>
        <label class="field">Achats d'actions seules par an : <b class="num" id="sc-n-o">${sc.n}</b><input type="range" min="0" max="24" step="1" value="${sc.n}" data-sc="n"></label>
        <label class="field">Montant moyen d'un achat d'action : <b class="num" id="sc-amt-o">${sc.amt} €</b><input type="range" min="20" max="2000" step="10" value="${sc.amt}" data-sc="amt"></label>
        <label class="field">Part d'actions américaines (en dollars) : <b class="num" id="sc-us-o">${sc.us} %</b><input type="range" min="0" max="100" step="10" value="${sc.us}" data-sc="us"></label>
      </div>
      <div class="row wrap between" style="margin-bottom:14px">
        <button type="button" class="toggle" style="color:var(--ink)" data-action="simple-tax" aria-pressed="${state.simpleTax}"><span class="sw" style="border-color:var(--mute)"></span>Seulement ceux qui gèrent les impôts à ma place</button>
        <span class="label">Clique sur un courtier pour le détail et les sources</span>
      </div>
      <div id="brokerRows">${brokerTable()}</div>
      <p class="muted small" style="margin-top:16px">${B ? esc(B.note) : ""} Le calcul compte les frais d'achat et de change à l'achat ; la revente coûtera à peu près autant.</p>
    </section>
    <div class="grid g-2" style="margin-top:54px">
      <section class="panel">
        <div class="panel-head"><h2>Pour toi, en résumé</h2></div>
        <div class="stack" style="gap:14px">
          <p class="serif" style="font-size:18px;line-height:1.5">Pour un plan mensuel sur un ETF monde et peu d'achats d'actions, les courtiers à plans gratuits se valent presque : la différence se joue surtout sur la <b>simplicité fiscale</b>. En Espagne, Trade Republic et MyInvestor retiennent l'impôt et informent le fisc à ta place. Avec les autres, c'est toi qui déclares chaque vente.</p>
          <p class="muted small">Ton compte Revolut convient pour un plan ETF gratuit sur sa sélection. Mais depuis le 6 octobre 2026, chaque achat d'action y coûte 1 € en formule Standard.</p>
          <p class="muted small">Ce n'est pas un conseil personnalisé : vérifie les conditions officielles avant d'ouvrir un compte, et parles-en à ton gestor pour la déclaration.</p>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Passer un ordre, simplement</h2></div>
        <ol class="steps">
          <li><div><b>Cherche le titre par son ${ex("isin", "code ISIN")}</b><div class="muted small">Le code à 12 caractères (ex. IE00B4L5Y983) évite de confondre deux produits au nom proche.</div></div></li>
          <li><div><b>Choisis « ordre à cours limité »</b><div class="muted small">Tu fixes ton prix maximum. Évite l'ordre « au marché » sur les petites valeurs.</div></div></li>
          <li><div><b>Achète pendant les heures de bourse</b><div class="muted small">Entre 9 h et 17 h 30 pour les places européennes : l'écart entre prix d'achat et de vente y est plus faible.</div></div></li>
          <li><div><b>Note la décision dans le journal</b><div class="muted small">Avec ta raison du moment. Tu remercieras ton toi futur.</div></div></li>
        </ol>
        <div class="panel-head" style="margin-top:34px"><h2>Combien coûte un achat ?</h2></div>
        <div class="grid g-2" style="gap:12px">
          <label class="field">Montant de l'achat (€)<input type="number" min="1" value="50" id="feeAmt"></label>
          <label class="field">Frais fixes (€)<input type="number" min="0" step="0.5" value="1" id="feeFix"></label>
        </div>
        <div id="feeOut" style="margin-top:16px"></div>
      </section>
    </div>` + disclaimer;
  }
  function feeVerdict() {
    const a = +($("#feeAmt")?.value || 0), f = +($("#feeFix")?.value || 0);
    const out = $("#feeOut"); if (!out) return;
    if (a <= 0) { out.innerHTML = `<p class="muted">Indique un montant supérieur à 0.</p>`; return; }
    const c = (f / a) * 100;
    const [cls, msg] = c <= 1 ? ["gain", "Coût raisonnable."] : c <= 2 ? ["warn", "Acceptable de temps en temps, mais regroupe tes achats si tu peux."] : ["loss", "Trop cher : attends d'avoir un montant plus gros, ou utilise un plan programmé."];
    const minOk = Math.ceil(f * 100);
    out.innerHTML = `<div class="num ${cls}" style="font-size:34px;font-weight:600">${c.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %</div>
      <p>${msg}</p><p class="muted small" style="margin-top:6px">Tu perds ce pourcentage dès l'achat : le titre doit monter d'autant pour que tu retrouves ta mise. Avec ${eur(f, 2)} de frais, il faut acheter au moins ${eur(minOk)} pour rester sous 1 %.</p>`;
  }

  /* ======================= MÉTHODE : comment Pyxis note, et ce que ça aurait donné ======================= */
  function btChart(bt) {
    const narrow = window.innerWidth < 700, W = narrow ? 520 : 1000, H = narrow ? 340 : 300, P = narrow ? 30 : 34, keys = [["bench", "var(--mute)", "4 4"], ["all", "var(--ink)", "2 3"], ["bottom", "var(--loss)", ""], ["top", "var(--gain)", ""]].filter(([k]) => bt.curves[k]);
    const all = keys.flatMap(([k]) => bt.curves[k]), lo = Math.min(1, ...all), hi = Math.max(1, ...all), n = bt.dates.length;
    const X = (i) => P + (i / (n - 1)) * (W - 2 * P), Y = (v) => H - P - ((v - lo) / (hi - lo || 1)) * (H - 2 * P);
    const years = bt.dates.map((d, i) => [d.slice(0, 4), i]).filter(([y], i, a) => i > 0 && y !== a[i - 1][0]);
    return `<svg viewBox="0 0 ${W} ${H}" class="bt-chart" role="img" aria-label="Évolution de 1 € investi selon chaque stratégie">
      <line x1="${P}" x2="${W - P}" y1="${Y(1)}" y2="${Y(1)}" stroke="var(--rule-soft)"/>
      <text x="${P}" y="${Y(1) + 16}" class="bt-ax">1 € investi</text>
      ${years.map(([y, i]) => `<text x="${X(i)}" y="${H - 8}" class="bt-ax">${y}</text>`).join("")}
      ${keys.map(([k, c, dash]) => `<polyline fill="none" stroke="${c}" stroke-width="${k === "top" ? 2.4 : 1.5}" ${dash ? `stroke-dasharray="${dash}"` : ""} points="${bt.curves[k].map((v, i) => X(i).toFixed(1) + "," + Y(v).toFixed(1)).join(" ")}"/>`).join("")}
      ${(() => { // étiquettes de fin, écartées pour ne pas se chevaucher
        const ls = keys.map(([k, c]) => ({ c, v: bt.curves[k][n - 1], y: Y(bt.curves[k][n - 1]) + 4 })).sort((a, b) => a.y - b.y);
        ls.forEach((l, i) => { if (i && l.y - ls[i - 1].y < 14) l.y = ls[i - 1].y + 14; });
        return ls.map((l) => `<text x="${W - P + 4}" y="${l.y.toFixed(1)}" class="bt-ax" fill="${l.c}">${num(l.v, 2)} €</text>`).join("");
      })()}
    </svg>`;
  }
  function viewMethod() {
    const bt = M.backtest;
    const F = [["Valorisation", 25, "Le titre est-il bon marché par rapport à ses bénéfices et à son secteur ? (PER, PER prévisionnel, prix sur valeur comptable)"],
      ["Qualité", 25, "L'entreprise est-elle solide ? (marges, rentabilité des capitaux propres, dette)"],
      ["Momentum", 20, "Sa tendance sur un an, sans le dernier mois (qui a tendance à se retourner)."],
      ["Risque", 15, "Sa volatilité et sa pire baisse sur un an : moins c'est agité, mieux c'est noté."],
      ["Macro", 15, "Son secteur convient-il à la phase économique estimée ?"]];
    return head("Méthode", "Comment Pyxis note chaque titre, et ce que cette méthode aurait donné dans le passé. Sans rien cacher de ses limites.") + `
    <div class="grid g-2">
      <section class="panel">
        <div class="panel-head"><h2>Le score, en cinq critères</h2><p>Chacun classé de 0 à 100 par rapport aux autres titres</p></div>
        ${F.map(([n, w, d]) => `<div class="mt-row"><div class="mt-w num">${w}<small>%</small></div><div><b>${n}</b><p class="muted small">${d}</p></div></div>`).join("")}
        <p class="small" style="margin-top:16px">Les actions et les ETF sont classés séparément. Quand une donnée manque, le critère est ignoré et la fourchette autour du score s'élargit. ${ex("score", "En savoir plus sur le score")}.</p>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>D'où viennent les données</h2></div>
        <ul class="plain-list">
          <li><b>Cours</b> : Yahoo Finance, Stooq en secours, chaque soir de semaine vers 23 h.</li>
          <li><b>Chiffres des entreprises et avis d'analystes</b> : Yahoo Finance, actualisés chaque jour.</li>
          <li><b>Économie</b> : la base FRED de la Réserve fédérale de Saint-Louis (taux BCE, inflation et chômage de la zone euro, courbe des taux américaine).</li>
          <li><b>Veille</b> : rédigée chaque matin de semaine par une IA à partir de sources de référence citées (Reuters, Financial Times, Les Échos, banques centrales…).</li>
        </ul>
        <p class="muted small" style="margin-top:12px">Chaque titre passe des contrôles avant d'être noté : historique suffisant, cours récent, pas de prix aberrant. En dessous de la moitié des titres récupérés, Pyxis garde les données de la veille plutôt que d'afficher des chiffres douteux.</p>
      </section>
    </div>
    <section class="panel" style="margin-top:54px">
      <div class="panel-head"><h2>Le test sur le passé</h2><p>${bt ? `${bt.months} mois, de ${new Date(bt.start).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} à ${new Date(bt.end).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}` : ""}</p></div>
      ${bt ? `
      <p style="max-width:75ch">Chaque fin de mois, on classe les ${bt.stocks} actions suivies selon les deux critères qu'on peut recalculer dans le passé avec les seuls cours : <b>momentum</b> et <b>risque</b>. On « achète » à parts égales le tiers le mieux classé, on garde un mois, et on recommence. Voici ce qu'aurait donné 1 € investi.</p>
      ${btChart(bt)}
      <div class="bt-legend">${[["top", "var(--gain)"], ["all", "var(--ink)"], ["bottom", "var(--loss)"], ["bench", "var(--mute)"]].filter(([k]) => bt.strategies[k]).map(([k, c]) => `<span><i style="background:${c}"></i>${esc(bt.strategies[k].label)}</span>`).join("")}</div>
      <table class="bt-table"><thead><tr><th></th><th>Gain total</th><th>Par an</th><th>Volatilité</th><th>Pire baisse</th></tr></thead><tbody>
        ${["top", "all", "bottom", "bench"].filter((k) => bt.strategies[k]).map((k) => { const x = bt.strategies[k]; return `<tr><td>${esc(x.label)}</td><td class="num ${x.total >= 0 ? "gain" : "loss"}">${pct(x.total, 0)}</td><td class="num">${pct(x.annual)}</td><td class="num">${num(x.vol, 0)} %</td><td class="num loss">${pct(x.maxdd, 0)}</td></tr>`; }).join("")}
      </tbody></table>
      <div class="grid g-2" style="margin-top:28px;gap:24px 40px">
        <div><span class="label">Ce que ça dit</span>
          <p class="small" style="margin-top:6px">${(() => { const t = bt.strategies.top, a = bt.strategies.all, d = t.annual - a.annual;
            return `<b>${Math.abs(d) < 1.5 ? "Un rendement proche de la moyenne, avec moins de risque" : d > 0 ? "Un peu mieux que la moyenne" : "Moins bien que la moyenne"}</b> : ${pct(t.annual)} par an contre ${pct(a.annual)} pour toutes les actions suivies, avec une pire baisse de ${pct(t.maxdd, 0)} contre ${pct(a.maxdd, 0)}. Le tiers le moins bien classé a fait nettement moins bien (${pct(bt.strategies.bottom.annual)} par an). `; })()}Le tiers le mieux classé a fait mieux que la moyenne des actions suivies ${num(bt.beat_all_pct, 0)} % des mois${bt.beat_bench_pct != null ? `, et mieux que l'ETF monde ${num(bt.beat_bench_pct, 0)} % des mois` : ""}. Un mois typique, l'écart avec la moyenne allait de <b>${pct(bt.excess.p10, 1)}</b> à <b>${pct(bt.excess.p90, 1)}</b> (8 mois sur 10), avec un milieu à ${pct(bt.excess.median, 2)}. Autrement dit : même quand une méthode marche, elle se trompe souvent sur un mois donné.</p></div>
        <div><span class="label">Ce que ça ne dit pas</span>
          <ul class="plain-list small" style="margin-top:6px">
            <li><b>${ex("survivant", "Biais du survivant")}</b> : on teste la liste d'aujourd'hui. Les entreprises disparues ou sorties des indices n'y sont pas, ce qui embellit tous les résultats.</li>
            <li><b>Seulement 35 % du score</b> : valorisation, qualité et macro ne sont pas testées, faute d'historique gratuit des comptes.</li>
            <li><b>Sans frais, ni impôts, ni change</b> : changer de titres chaque mois coûterait des frais réels.</li>
            <li><b>Le passé ne garantit rien</b> : une méthode qui a marché peut cesser de marcher.</li>
          </ul></div>
      </div>` : `<div class="empty">Le test sur le passé se calcule lors de la prochaine mise à jour du soir.</div>`}
    </section>` + disclaimer;
  }

  /* ======================= APPRENDRE ======================= */
  const LEARN = window.PYXIS_LEARN || { modules: [], lessons: [] };
  function loadLearn() {
    const prog = store.get("learn", {});
    M.lessons = LEARN.lessons.map((l) => ({ ...l, done: !!prog[l.id], best: prog[l.id]?.score }));
  }
  loadLearn();
  const learnDone = () => M.lessons.filter((l) => l.done).length;
  const moduleOf = (l) => LEARN.modules.find((m) => m.id === l.module) || { title: "", n: 0 };
  // Pour chaque mot du lexique, la première leçon qui l'explique.
  const termLesson = {};
  LEARN.lessons.forEach((l) => (l.body.match(/\[\[(\w+)\|/g) || []).forEach((m) => { const k = m.slice(2, -1); if (!termLesson[k]) termLesson[k] = l; }));

  function viewLearn() {
    const nextL = M.lessons.find((l) => !l.done);
    const total = M.lessons.length, done = learnDone();
    const letters = {};
    Object.entries(G).sort((x, y) => x[1][0].localeCompare(y[1][0], "fr", { sensitivity: "base" }))
      .forEach(([k, v]) => { const L = v[0].normalize("NFD")[0].toUpperCase(); (letters[L] ||= []).push([k, v]); });
    return head("Apprendre", "Un parcours dans l'ordre, une notion à la fois. Chaque leçon prend quelques minutes et se termine par un petit quiz.") + `
    <section class="learn-top">
      <div><span class="label">Ta progression</span><div class="learn-count num">${done}<small>/ ${total} leçons</small></div>
        <div class="hbar learn-bar"><span class="up" style="width:${(100 * done) / (total || 1)}%"></span></div></div>
      ${nextL ? `<div class="learn-next"><span class="label">Prochaine leçon · module ${moduleOf(nextL).n}</span><b class="serif">${esc(nextL.title)}</b><a class="btn primary" href="#apprendre-${nextL.id}">${done ? "Continuer" : "Commencer"}</a></div>`
        : `<div class="learn-next"><span class="label">Bravo</span><b class="serif">Tout le parcours est fait.</b><a class="btn" href="#apprendre-lexique">Revoir le lexique</a></div>`}
    </section>
    <div class="modules">${LEARN.modules.map((m) => {
      const ls = M.lessons.filter((l) => l.module === m.id), d = ls.filter((l) => l.done).length;
      return `<section class="module">
        <header><span class="label">Module ${m.n} · ${d}/${ls.length}</span><h2 class="serif">${esc(m.title)}</h2><p class="muted">${esc(m.lede)}</p></header>
        <ol class="path">${ls.map((l) => `<li class="${l.done ? "done" : l === nextL ? "next" : ""}"><a href="#apprendre-${l.id}"><b>${esc(l.title)}</b><span class="dim small">${l.minutes} min${l.done && l.best != null ? ` · quiz ${l.best}/${l.quiz.length}` : ""}</span></a></li>`).join("")}</ol>
      </section>`;
    }).join("")}</div>
    <section class="panel lexique-panel" id="lexique">
      <div class="panel-head"><h2>Lexique du débutant</h2><p>${Object.keys(G).length} mots, de A à Z</p></div>
      <p class="muted small" style="margin:-6px 0 16px">Partout dans Pyxis, les mots soulignés en pointillé s'expliquent quand tu passes dessus. Active « Explique-moi » pour les voir tous.</p>
      <div class="lex-search">${SEARCH_ICON}<input type="text" id="lexQ" placeholder="Chercher un mot : ETF, dividende, PER…" autocomplete="off" aria-label="Chercher un mot du lexique"></div>
      <nav class="lex-letters" aria-label="Lettres">${Object.keys(letters).map((L) => `<a href="#apprendre-lexique" data-letter="${L}">${L}</a>`).join("")}</nav>
      <div class="lex-list">${Object.entries(letters).map(([L, items]) => `<div class="lex-group" data-l="${L}"><div class="lex-letter serif" id="lettre-${L}">${L}</div><dl>${items.map(([k, [t, d, e]]) => `
        <div class="lex-item" id="mot-${k}" data-s="${esc((t + " " + d).toLowerCase())}"><dt>${esc(t)}</dt><dd><p>${esc(d)}</p>${e ? `<p class="lex-ex">${esc(e)}</p>` : ""}</dd></div>`).join("")}</dl></div>`).join("")}
        <p class="empty lex-none" hidden>Aucun mot ne correspond. Essaie un autre terme.</p></div>
    </section>` + disclaimer;
  }

  /* Encadrés calculés sur les vraies données du jour. */
  // Objectifs d'analystes en retard sur le cours (après une forte baisse, ils sont révisés avec plusieurs semaines de décalage).
  const staleTargets = (o) => !!(o.analysts && o.price && ((o.analysts.low && o.price < o.analysts.low) || (o.analysts.upside != null && o.analysts.upside > 50)));
  // Ne garder que les articles dont le titre parle vraiment de l'entreprise (Yahoo mélange beaucoup d'articles généraux).
  function relevantNews(o) {
    const stop = new Set(["the", "inc", "plc", "group", "holding", "holdings", "company", "corporation", "sa", "se", "ag", "nv", "spa", "and", "co", "de"]);
    const keys = o.name.toLowerCase().replace(/[^a-z0-9àâçéèêëîïôûùüÿñ ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !stop.has(w)).slice(0, 2);
    keys.push(o.ticker.split(".")[0].toLowerCase());
    return (o.news || []).filter((n) => { const t = " " + (n.title || "").toLowerCase().replace(/[^a-z0-9àâçéèêëîïôûùüÿñ ]/g, " ") + " "; return keys.some((k) => t.includes(" " + k + " ") || t.includes(" " + k + "s ")); });
  }
  function live(name) {
    const U = M.universe || [], find = (t) => U.find((o) => o.ticker === t);
    const box = (title, body) => `<aside class="live"><span class="label">Dans les données Pyxis · ${esc(title)}</span>${body}</aside>`;
    if (!U.length) return "";
    if (name === "market") {
      const h = marketHealth();
      return box(`séance du ${h.when}`, `<p>Sur les ${h.n} titres suivis, <b>${h.up}</b> ont monté et <b>${h.down}</b> ont baissé. La moitié a fait mieux que <b class="${h.median >= 0 ? "gain" : "loss"}">${pct(h.median, 2)}</b>, l'autre moitié moins bien.${h.world != null ? ` L'ETF monde a fait <b class="${h.world >= 0 ? "gain" : "loss"}">${pct(h.world, 2)}</b>.` : ""}</p><a class="label" href="#">Voir la séance sur Aujourd'hui</a>`);
    }
    if (name === "world") {
      const w = find("EUNL.DE"); if (!w) return "";
      return box(w.name, `<p>Une part vaut <b>${money(w.price, w.currency)}</b>. Sur un an : <b class="${w.chg12m >= 0 ? "gain" : "loss"}">${pct(w.chg12m)}</b>. Frais annuels : <b>${num(w.expense_ratio, 2)} %</b>, soit ${eur((w.expense_ratio || 0.2) * 10, 2)} par an pour 1 000 € placés.</p><a class="label" href="#fiche-EUNL.DE">Ouvrir la fiche</a>`);
    }
    if (name === "vol") {
      const w = find("EUNL.DE"), st = U.filter((o) => o.kind !== "etf" && o.vol != null).sort((a, b) => b.vol - a.vol)[0];
      if (!w || !st) return "";
      return box("ETF monde contre action seule", `<p>Sur un an, l'ETF monde a une volatilité de <b>${num(w.vol, 0)} %</b> et sa pire chute a été de <b class="loss">${pct(w.maxdd_1y, 0)}</b>. L'action la plus agitée du Scanner, ${esc(st.name)}, a une volatilité de <b>${num(st.vol, 0)} %</b> et une pire chute de <b class="loss">${pct(st.maxdd_1y, 0)}</b>.</p><a class="label" href="#fiche-${esc(st.ticker)}">Ouvrir sa fiche</a>`);
    }
    if (name === "per" || name === "quality") {
      const o = U.filter((x) => x.kind !== "etf" && x.pe != null && x.pe_sector != null && x.margin != null).sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))[0];
      if (!o) return "";
      if (name === "per") return box(o.name, `<p>PER actuel : <b>${num(o.pe, 1)}</b>, contre <b>${num(o.pe_sector, 0)}</b> en moyenne pour son secteur.${o.forward_pe ? ` PER prévisionnel : <b>${num(o.forward_pe, 1)}</b> : les analystes attendent ${o.forward_pe < o.pe ? "une hausse" : "une baisse"} des bénéfices.` : ""} ${o.pe > o.pe_sector * 1.2 ? "Le marché paie donc nettement plus cher que la moyenne pour ses bénéfices." : o.pe < o.pe_sector * 0.8 ? "Le marché la paie donc moins cher que la moyenne : à creuser." : "Elle est payée à peu près comme son secteur."}</p><a class="label" href="#fiche-${esc(o.ticker)}">Ouvrir sa fiche</a>`);
      return box(o.name, `<p>Marge nette : <b>${num(o.margin * 100, 0)} %</b> (${eur(o.margin * 100, 0)} gardés sur 100 € de ventes).${o.roe != null ? ` Rentabilité des capitaux propres : <b>${num(o.roe * 100, 0)} %</b>.` : ""}${o.debt_to_equity != null ? ` Dette : <b>${num(o.debt_to_equity, 0)} %</b> de ses capitaux propres.` : ""} Facteur qualité Pyxis : <b>${o.factors?.quality ?? "—"}/100</b>.</p><a class="label" href="#fiche-${esc(o.ticker)}">Ouvrir sa fiche</a>`);
    }
    if (name === "analysts") {
      const o = U.filter((x) => x.analysts && x.analysts.count && x.currency === "USD").sort((a, b) => b.analysts.count - a.analysts.count)[0];
      if (!o) return "";
      const a = o.analysts;
      return box(o.name, `<p><b>${a.count}</b> analystes suivent ce titre. Leur avis moyen : <b>${esc(a.label)}</b>. Objectif moyen à 12 mois : <b>${money(a.target, o.currency)}</b> pour un cours de ${money(o.price, o.currency)}${a.upside != null ? ` (${pct(a.upside, 0)})` : ""}. Mais les objectifs vont de ${money(a.low, o.currency, 0)} à ${money(a.high, o.currency, 0)}.</p><a class="label" href="#fiche-${esc(o.ticker)}">Ouvrir sa fiche</a>`);
    }
    if (name === "score") {
      const o = M.opportunities?.[0] || U.filter((x) => x.score != null).sort((a, b) => b.score - a.score)[0];
      if (!o || !o.factors) return "";
      const F = [["valuation", "Valorisation"], ["quality", "Qualité"], ["momentum", "Momentum"], ["risk", "Risque"], ["macro", "Macro"]];
      return box(`${o.name}, première idée du jour`, `<p>Score <b>${o.score}</b>, fourchette ${o.low} à ${o.high}.</p><div class="live-bars">${F.map(([k, l]) => `<div><span class="label">${l}</span><span class="hbar"><span class="up" style="width:${o.factors[k] ?? 0}%"></span></span><span class="num small">${o.factors[k] ?? "—"}</span></div>`).join("")}</div><a class="label" href="#fiche-${esc(o.ticker)}">Lire sa thèse et ce qui pourrait la rendre fausse</a>`);
    }
    if (name === "macro") {
      const m = M.macro; if (!m) return "";
      const PH = { reprise: "Reprise", expansion: "Expansion", surchauffe: "Surchauffe", ralentissement: "Ralentissement" };
      return box("aujourd'hui", `<p>Phase estimée : <b>${PH[m.phase] || m.phase}</b> (confiance ${esc(m.confidence)}). ${esc(m.phase_text)}</p><ul class="plain-list small">${(m.indicators || []).slice(0, 3).map((i) => `<li>${esc(i.label)} : <b>${esc(i.value)}</b>, ${i.trend === "stable" ? "stable" : "en " + esc(i.trend)}</li>`).join("")}</ul><a class="label" href="#macro">Voir la page Macro</a>`);
    }
    return "";
  }

  /* Simulateurs */
  const SIMS = {
    compound: { fields: [["m", "Chaque mois", 100, 10, 1000, 10, " €"], ["r", "Rendement moyen supposé", 6, 0, 10, 0.5, " % / an"], ["y", "Durée", 20, 1, 40, 1, " ans"]],
      run: ({ m, r, y }) => { let v = 0; const g = Math.pow(1 + r / 100, 1 / 12); for (let i = 0; i < y * 12; i++) v = v * g + m; const put = m * 12 * y;
        return `<div class="sim-out"><div><span class="label">Tu auras versé</span><b class="num">${eur(put)}</b></div><div><span class="label">Valeur estimée</span><b class="num">${eur(v)}</b></div><div><span class="label">Dont gains</span><b class="num gain">${eur(v - put)}</b></div></div><p class="muted small">Hypothèse d'un rendement régulier, hors impôts. La réalité fera des hauts et des bas.</p>`; } },
    fees: { fields: [["m", "Chaque mois", 100, 10, 1000, 10, " €"], ["a", "Frais annuels du fonds A", 0.2, 0, 3, 0.05, " %"], ["b", "Frais annuels du fonds B", 1.8, 0, 3, 0.05, " %"], ["y", "Durée", 20, 1, 40, 1, " ans"]],
      run: ({ m, a, b, y }) => { const sim = (f) => { let v = 0; const g = Math.pow(1 + (6 - f) / 100, 1 / 12); for (let i = 0; i < y * 12; i++) v = v * g + m; return v; };
        const va = sim(a), vb = sim(b);
        return `<div class="sim-out"><div><span class="label">Fonds A</span><b class="num">${eur(va)}</b></div><div><span class="label">Fonds B</span><b class="num">${eur(vb)}</b></div><div><span class="label">Écart</span><b class="num loss">${eur(Math.abs(va - vb))}</b></div></div><p class="muted small">Avec le même rendement de 6 % par an avant frais pour les deux fonds. L'écart représente ${num((Math.abs(va - vb) / Math.max(va, vb)) * 100, 0)} % de la somme finale.</p>`; } },
  };
  function sim(name) {
    const S = SIMS[name]; if (!S) return "";
    return `<div class="sim" data-sim="${name}">${S.fields.map(([k, l, v, mn, mx, st, u]) => `<label class="field">${l} : <b class="num" data-out="${k}">${num(v, 2)}${u}</b><input type="range" min="${mn}" max="${mx}" step="${st}" value="${v}" data-k="${k}" data-u="${u}"></label>`).join("")}<div class="sim-res"></div></div>`;
  }
  function runSims(root = document) {
    root.querySelectorAll(".sim").forEach((el) => {
      const vals = {}; el.querySelectorAll("input[data-k]").forEach((i) => { vals[i.dataset.k] = +i.value; el.querySelector(`[data-out="${i.dataset.k}"]`).textContent = num(+i.value, 2) + i.dataset.u; });
      el.querySelector(".sim-res").innerHTML = SIMS[el.dataset.sim].run(vals);
    });
  }

  function lessonHTML(body) {
    return body.replace(/\[\[(\w+)\|([^\]]+)\]\]/g, (_, k, t) => (G[k] ? ex(k, t) : t))
      .replace(/\{\{live:(\w+)\}\}/g, (_, n) => live(n))
      .replace(/\{\{sim:(\w+)\}\}/g, (_, n) => sim(n));
  }

  function viewLesson(id) {
    if (id === "lexique") { setTimeout(() => document.getElementById("lexique")?.scrollIntoView(), 0); return viewLearn(); }
    const l = M.lessons.find((x) => x.id === id);
    if (!l) return viewLearn();
    const i = M.lessons.indexOf(l), nxt = M.lessons[i + 1], prv = M.lessons[i - 1], mod = moduleOf(l);
    return head(esc(l.title), `Module ${mod.n} · ${esc(mod.title)} · leçon ${i + 1} sur ${M.lessons.length} · ${l.minutes} min`, "", `<a href="#apprendre">Apprendre</a> / ${esc(mod.title)}`) + `
    <article class="lesson">
      ${lessonHTML(l.body)}
      <div class="keep"><span class="label">À retenir</span><p>${esc(l.keep)}</p></div>
      <section class="quiz" data-lesson="${l.id}">
        <span class="label">Petit quiz · ${l.quiz.length} questions</span>
        ${l.quiz.map((q, qi) => `<div class="q" data-q="${qi}"><p class="q-t">${qi + 1}. ${esc(q.q)}</p><div class="q-o">${q.o.map((o, oi) => `<button type="button" data-qa="${qi}:${oi}">${esc(o)}</button>`).join("")}</div><p class="q-why" hidden></p></div>`).join("")}
        <p class="quiz-end" hidden></p>
      </section>
      ${l.apply ? `<a class="apply" href="${l.apply.href}"><span class="label">Mettre en pratique</span>${esc(l.apply.label)} →</a>` : ""}
      <nav class="lesson-nav">${prv ? `<a class="btn" href="#apprendre-${prv.id}">← ${esc(prv.title)}</a>` : `<a class="btn" href="#apprendre">← Le parcours</a>`}${nxt ? `<a class="btn primary" href="#apprendre-${nxt.id}">Leçon suivante : ${esc(nxt.title)} →</a>` : `<a class="btn primary" href="#apprendre">Retour au parcours</a>`}</nav>
    </article>` + disclaimer;
  }
  function answerQuiz(btn) {
    const quiz = btn.closest(".quiz"), l = M.lessons.find((x) => x.id === quiz.dataset.lesson);
    const [qi, oi] = btn.dataset.qa.split(":").map(Number), q = l.quiz[qi], box = quiz.querySelector(`[data-q="${qi}"]`);
    if (box.dataset.done) return;
    box.dataset.done = oi === q.a ? "ok" : "ko";
    box.querySelectorAll("button").forEach((b, j) => { b.disabled = true; if (j === q.a) b.classList.add("right"); else if (j === oi) b.classList.add("wrong"); });
    const why = box.querySelector(".q-why"); why.hidden = false;
    why.innerHTML = `<b class="${oi === q.a ? "gain" : "loss"}">${oi === q.a ? "Exact." : "Pas tout à fait."}</b> ${esc(q.why)}`;
    const all = [...quiz.querySelectorAll(".q")];
    if (all.every((x) => x.dataset.done)) {
      const score = all.filter((x) => x.dataset.done === "ok").length, prog = store.get("learn", {});
      prog[l.id] = { score: Math.max(score, prog[l.id]?.score || 0), date: new Date().toISOString().slice(0, 10) };
      store.set("learn", prog); l.done = true; l.best = prog[l.id].score;
      const end = quiz.querySelector(".quiz-end"); end.hidden = false;
      end.innerHTML = `<b>${score} sur ${all.length}.</b> ${score === all.length ? "Parfait, leçon validée." : "Leçon validée. Relis les explications ci-dessus, elles valent mieux qu'un score."}`;
    }
  }

  function viewSettings() {
    const p = state.profile;
    return head("Réglages", "Ton profil et tes règles. Elles servent à calculer les montants suggérés et les alertes.") + `
    <section class="panel" style="max-width:640px">
      <form id="profileForm" class="stack">
        <label class="field">Prénom<input type="text" name="name" value="${esc(p.name)}"></label>
        <div class="grid g-2">
          <label class="field">Capital investi (€)<input type="number" min="0" name="capital" value="${p.capital}"></label>
          <label class="field">Versement mensuel (€)<input type="number" min="0" name="monthly" value="${p.monthly}"></label>
          <label class="field">Part du cœur ETF (%)<input type="number" min="0" max="100" name="core" value="${p.core}"></label>
          <label class="field">Maximum par action seule (%)<input type="number" min="1" max="100" name="maxLine" value="${p.maxLine}"></label>
        </div>
        <div class="row wrap"><button class="btn primary" type="submit">Enregistrer</button>
          <button class="btn" type="button" data-action="onboard">Refaire mon profil</button></div>
        <p class="muted small" id="saved" aria-live="polite"></p>
      </form>
    </section>
    <section class="panel" style="max-width:640px;margin-top:54px">
      <div class="panel-head"><h2>Tes données</h2></div>
      <p class="muted small" style="margin-bottom:16px">Ton profil, tes positions, ton journal et ta progression sont enregistrés uniquement dans ce navigateur. Fais une sauvegarde de temps en temps : si tu vides ton navigateur ou changes d'appareil, tu pourras tout récupérer.</p>
      <div class="row wrap"><button class="btn" type="button" data-action="backup">Télécharger une sauvegarde</button>
        <label class="btn" style="cursor:pointer">Restaurer une sauvegarde<input type="file" accept=".json,application/json" id="restoreFile" hidden></label></div>
      <p class="muted small" id="backupMsg" aria-live="polite" style="margin-top:10px"></p>
    </section>`;
  }

  /* ======================= SAUVEGARDE ======================= */
  function backup() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith("investlab.")) data[k] = localStorage.getItem(k); }
    const blob = new Blob([JSON.stringify({ app: "pyxis", version: 1, date: new Date().toISOString(), data }, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `pyxis-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function restore(file) {
    const msg = $("#backupMsg");
    file.text().then((txt) => {
      const j = JSON.parse(txt);
      if (j.app !== "pyxis" || !j.data) throw new Error("format");
      Object.entries(j.data).forEach(([k, v]) => { if (k.startsWith("investlab.")) localStorage.setItem(k, v); });
      msg.textContent = "Sauvegarde restaurée. La page se recharge…"; setTimeout(() => location.reload(), 800);
    }).catch(() => { msg.textContent = "Ce fichier n'est pas une sauvegarde Pyxis."; });
  }

  /* ======================= IMPORT D'UN RELEVÉ (CSV) ======================= */
  // Accepte l'export des transactions de la plupart des courtiers : on reconnaît les colonnes par leur nom
  // (français, anglais, espagnol, allemand), puis on montre un aperçu à valider avant d'importer.
  const COLS = {
    date: ["date", "fecha", "datum", "time", "executed"],
    isin: ["isin"],
    sym: ["ticker", "symbol", "symbole", "símbolo", "simbolo", "code"],
    name: ["name", "nom", "instrument", "produit", "product", "titre", "security", "valor", "nombre", "description"],
    type: ["type", "side", "sens", "operation", "opération", "operación", "tipo", "transaction"],
    qty: ["quantity", "qty", "quantité", "quantite", "shares", "parts", "cantidad", "títulos", "titulos", "anzahl", "stück"],
    price: ["price per share", "price", "prix", "precio", "cours", "kurs", "unit price"],
    total: ["total amount", "amount", "total", "montant", "importe", "betrag", "value"],
  };
  function parseCSV(txt) {
    const first = txt.split(/\r?\n/)[0] || "";
    const sep = [";", "\t", ","].map((c) => [c, first.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
    const rows = []; let cur = [""], q = false;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (q) { if (ch === '"' && txt[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; } else if (ch === '"') q = false; else cur[cur.length - 1] += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) cur.push("");
      else if (ch === "\n") { rows.push(cur); cur = [""]; }
      else if (ch !== "\r") cur[cur.length - 1] += ch;
    }
    if (cur.length > 1 || cur[0]) rows.push(cur);
    return rows.filter((r) => r.some((c) => c.trim()));
  }
  const toNum = (v) => {
    if (v == null) return NaN;
    let s = String(v).replace(/[^\d,.\-]/g, "");
    if (s.includes(",") && s.includes(".")) s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    else s = s.replace(",", ".");
    return parseFloat(s);
  };
  function matchItem(r) {
    const U = M.universe, sym = (r.sym || "").toUpperCase().trim(), nm = (r.name || "").toLowerCase();
    if (sym) { const u = U.find((o) => o.ticker.toUpperCase() === sym || o.ticker.split(".")[0].toUpperCase() === sym); if (u) return u.ticker; }
    if (nm) {
      const words = nm.replace(/[^a-z0-9àâçéèêëîïôûùüÿñ ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !["inc", "the", "plc", "corp", "ucits", "etf", "acc", "dist", "usd", "eur"].includes(w));
      let best = null, bs = 0;
      U.forEach((o) => { const on = o.name.toLowerCase(); const sc = words.filter((w) => on.includes(w)).length; if (sc > bs) { bs = sc; best = o.ticker; } });
      if (bs >= 1) return best;
    }
    return "";
  }
  function readStatement(txt) {
    const rows = parseCSV(txt); if (rows.length < 2) return null;
    const hdr = rows[0].map((h) => h.trim().toLowerCase());
    const col = {}; Object.entries(COLS).forEach(([k, names]) => { const i = hdr.findIndex((h) => names.some((n) => h === n || h.includes(n))); if (i >= 0 && !Object.values(col).includes(i)) col[k] = i; });
    if (col.qty == null || (col.price == null && col.total == null)) return { error: "Je ne trouve pas les colonnes de quantité et de prix. Exporte l'historique des transactions (pas un relevé PDF) au format CSV." };
    const agg = {};
    rows.slice(1).forEach((r) => {
      const get = (k) => (col[k] != null ? (r[col[k]] || "").trim() : "");
      const type = get("type").toLowerCase();
      const isSell = /sell|vente|venta|verkauf|sale/.test(type);
      if (type && !isSell && !/buy|achat|compra|kauf|purchase|savings|plan|ahorro|order|market|limit/.test(type)) return; // dividendes, frais, virements…
      const qty = Math.abs(toNum(get("qty"))); if (!qty) return;
      const price = col.price != null ? Math.abs(toNum(get("price"))) : Math.abs(toNum(get("total"))) / qty;
      if (!isFinite(price) || !price) return;
      const key = get("isin") || get("sym") || get("name"); if (!key) return;
      const a = (agg[key] ||= { key, sym: get("sym"), name: get("name") || get("sym") || key, qty: 0, cost: 0 });
      if (isSell) { const avg = a.qty ? a.cost / a.qty : 0; a.qty = Math.max(0, a.qty - qty); a.cost = avg * a.qty; }
      else { a.qty += qty; a.cost += qty * price; }
    });
    const list = Object.values(agg).filter((a) => a.qty > 1e-9).map((a) => ({ ...a, avg: a.cost / a.qty, ticker: matchItem(a) }));
    return list.length ? { list } : { error: "Aucun achat reconnu dans ce fichier." };
  }
  function importModal() {
    const opts = (sel) => `<option value="">Ne pas importer</option>` + M.universe.slice().sort((a, b) => a.name.localeCompare(b.name)).map((u) => `<option value="${esc(u.ticker)}"${u.ticker === sel ? " selected" : ""}>${esc(u.name)}</option>`).join("");
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<div class="modal stack" role="dialog" aria-modal="true" aria-labelledby="it" style="gap:16px;max-width:720px">
      <h2 id="it">Importer un relevé de transactions</h2>
      <p class="muted small">Exporte l'historique de tes transactions depuis ton courtier au format CSV, puis choisis le fichier. Pyxis additionne les achats, retire les ventes, et te montre le résultat avant d'importer. Le fichier n'est envoyé nulle part.</p>
      <label class="btn" style="cursor:pointer;align-self:flex-start">Choisir un fichier CSV<input type="file" accept=".csv,text/csv,.txt" hidden id="csvFile"></label>
      <div id="csvOut"></div>
      <div class="row"><button class="btn primary" type="button" id="csvGo" disabled>Importer dans le portefeuille ${state.book === "simulated" ? "simulé" : "réel"}</button><button class="btn" type="button" data-close>Annuler</button></div>
    </div>`;
    document.body.appendChild(back);
    let res = null;
    back.querySelector("[data-close]").onclick = () => back.remove();
    back.querySelector("#csvFile").onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((txt) => {
        res = readStatement(txt); const out = back.querySelector("#csvOut");
        if (!res || res.error) { out.innerHTML = `<p class="flag">${esc(res?.error || "Fichier illisible.")}</p>`; back.querySelector("#csvGo").disabled = true; return; }
        out.innerHTML = `<table class="bt-table"><thead><tr><th>Dans le relevé</th><th>Parts</th><th>Prix moyen</th><th>Titre Pyxis</th></tr></thead><tbody>${res.list.map((a, i) => `<tr><td>${esc(a.name)}</td><td class="num">${num(a.qty, 4)}</td><td class="num">${num(a.avg, 2)}</td><td><select data-imp="${i}">${opts(a.ticker)}</select></td></tr>`).join("")}</tbody></table>
          <p class="muted small" style="margin-top:8px">Vérifie la dernière colonne : seuls les titres suivis par Pyxis peuvent être importés. Les positions déjà présentes ne sont pas modifiées.</p>`;
        back.querySelector("#csvGo").disabled = false;
      });
    };
    back.querySelector("#csvGo").onclick = () => {
      if (!res?.list) return;
      let n = 0;
      back.querySelectorAll("[data-imp]").forEach((sel) => { const a = res.list[+sel.dataset.imp]; if (!sel.value) return; state.positions[state.book].push({ ticker: sel.value, qty: +a.qty.toFixed(6), cost: +a.avg.toFixed(4) }); n++; });
      store.set("positions", state.positions); back.remove(); render();
    };
  }

  /* ======================= ONBOARDING ======================= */
  const ONB = [
    { key: "goal", q: "Qu'attends-tu d'abord de cette application ?", opts: [["apprendre", "Apprendre comment fonctionnent les marchés", "Le rendement viendra ensuite"], ["rendement", "Faire fructifier mon épargne", "En comprenant ce que je fais"]] },
    { key: "capital", q: "Combien as-tu investi ou comptes-tu investir au départ ?", opts: [[450, "Moins de 500 €"], [1500, "500 à 2 000 €"], [5000, "2 000 à 10 000 €"], [15000, "Plus de 10 000 €"]] },
    { key: "monthly", q: "Combien peux-tu investir chaque mois, sans te priver ?", opts: [[50, "Environ 50 €"], [100, "Environ 100 €"], [250, "Environ 250 €"], [500, "500 € ou plus"]] },
    { key: "risk", q: "Ton portefeuille perd 25 % en 3 mois. Tu fais quoi ?", opts: [["faible", "Je vends pour arrêter les pertes"], ["moyenne", "J'attends, stressé"], ["élevée", "Je continue mes achats"]] },
  ];
  function onboarding(step = 0, draft = { ...state.profile }) {
    const s = ONB[step];
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="onbq">
      <div class="row between"><div class="dots">${ONB.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>
      <button class="btn small" data-close>Passer</button></div>
      <h2 id="onbq" style="margin-top:22px;font-size:22px">${s.q}</h2>
      <div class="opts">${s.opts.map(([v, l, d]) => `<button class="opt" data-v="${v}" aria-pressed="${String(draft[s.key]) === String(v)}">${l}${d ? `<span>${d}</span>` : ""}</button>`).join("")}</div>
      <p class="dim small">Question ${step + 1} sur ${ONB.length}. Tu pourras tout modifier dans les réglages.</p></div>`;
    document.body.appendChild(back);
    const close = () => back.remove();
    back.querySelector("[data-close]").onclick = () => { close(); store.set("onboarded", true); };
    back.querySelectorAll(".opt").forEach((b) => (b.onclick = () => {
      const v = b.dataset.v; draft[s.key] = isNaN(+v) ? v : +v; close();
      if (step + 1 < ONB.length) onboarding(step + 1, draft);
      else {
        if (draft.risk === "faible") { draft.core = 90; draft.maxLine = 5; } else if (draft.risk === "moyenne") { draft.core = 80; draft.maxLine = 8; } else { draft.core = 80; draft.maxLine = 10; }
        state.profile = draft; state.sim.monthly = draft.monthly; store.set("profile", draft); state.hasPlan = true; store.set("onboarded", true); render();
      }
    }));
    back.querySelector(".opt").focus();
  }

  /* ======================= PORTEFEUILLE : ajout d'une position ======================= */
  function positionModal() {
    const opts = M.universe.slice().sort((a, b) => a.name.localeCompare(b.name))
      .map((u) => `<option value="${esc(u.ticker)}">${esc(u.name)} (${esc(u.ticker)})</option>`).join("");
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<form class="modal stack" role="dialog" aria-modal="true" aria-labelledby="pt" style="gap:16px">
      <h2 id="pt">Ajouter une position ${state.book === "simulated" ? "simulée" : "réelle"}</h2>
      <label class="field">Titre<select name="ticker" required>${opts}</select></label>
      <div class="grid g-2" style="gap:12px">
        <label class="field">Nombre de parts<input type="number" name="qty" min="0" step="any" required></label>
        <label class="field">Prix moyen payé par part<input type="number" name="cost" min="0" step="any" required></label>
      </div>
      <label class="field">Rôle dans le portefeuille<select name="bucket"><option value="">Automatique (ETF = cœur)</option><option value="coeur">Cœur</option><option value="satellite">Satellite</option></select></label>
      <p class="dim small">Les fractions de parts sont acceptées (ex. 0,35). Tout reste enregistré dans ce navigateur uniquement.</p>
      <div class="row"><button class="btn primary" type="submit">Ajouter</button><button class="btn" type="button" data-close>Annuler</button></div>
    </form>`;
    document.body.appendChild(back);
    back.querySelector("[data-close]").onclick = () => back.remove();
    back.querySelector("form").onsubmit = (ev) => {
      ev.preventDefault();
      const d = Object.fromEntries(new FormData(ev.target));
      state.positions[state.book].push({ ticker: d.ticker, qty: +d.qty, cost: +d.cost, bucket: d.bucket || undefined });
      store.set("positions", state.positions); back.remove(); render();
    };
  }

  /* ======================= JOURNAL : saisie ======================= */
  function journalModal(prefill = {}) {
    const today = new Date().toISOString().slice(0, 10);
    const review = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<form class="modal stack" role="dialog" aria-modal="true" aria-labelledby="jt">
      <h2 id="jt">Nouvelle décision</h2>
      <div class="grid g-2" style="gap:12px">
        <label class="field">Titre<input type="text" name="ticker" required value="${esc(prefill.ticker || "")}"></label>
        <label class="field">Action<select name="action"><option>achat</option><option>vente</option></select></label>
        <label class="field">Montant (€)<input type="number" name="amount" min="1" required value="${esc(prefill.amount || "")}"></label>
        <label class="field">Date<input type="date" name="date" value="${today}"></label>
      </div>
      <label class="field">Pourquoi je le fais (ma thèse)<textarea name="thesis" required>${esc(prefill.thesis || "")}</textarea></label>
      <label class="field">Ce qui me prouverait que j'ai tort<textarea name="wrong" placeholder="Ex. : si les ventes baissent deux trimestres de suite"></textarea></label>
      <label class="field">Date de revue<input type="date" name="review" value="${review}"></label>
      <div class="row"><button class="btn primary" type="submit">Enregistrer la décision</button><button class="btn" type="button" data-close>Annuler</button></div>
    </form>`;
    document.body.appendChild(back);
    back.querySelector("[data-close]").onclick = () => back.remove();
    back.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      state.journal.push({ id: Date.now(), ...d, ticker: d.ticker.toUpperCase().trim(), amount: +d.amount });
      store.set("journal", state.journal); back.remove(); location.hash = "#journal"; render();
    };
    back.querySelector("input").focus();
  }

  /* ======================= Explique-moi ======================= */
  let pop;
  function showPop(el) {
    const g = G[el.dataset.explain]; if (!g) return;
    hidePop();
    pop = document.createElement("div"); pop.className = "pop"; pop.setAttribute("role", "tooltip");
    pop.innerHTML = `<b>${esc(g[0])}</b>${esc(g[1])}${g[2] ? `<em>${esc(g[2])}</em>` : ""}`;
    document.body.appendChild(pop);
    const r = el.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = Math.min(Math.max(10, r.left), innerWidth - pw - 10);
    let y = r.bottom + 8; if (y + ph > innerHeight - 10) y = r.top - ph - 8;
    pop.style.left = x + "px"; pop.style.top = y + "px";
  }
  function hidePop() { if (pop) { pop.remove(); pop = null; } }

  /* ======================= Routeur ======================= */
  let stopPulse = null, firstRender = true;
  /* Change d'écran derrière un rideau d'encre (désactivé si « réduire les animations »). */
  function go() {
    const c = $(".curtain");
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (firstRender || calm || !c) { firstRender = false; render(); window.scrollTo(0, 0); return; }
    c.classList.remove("go"); void c.offsetWidth; c.classList.add("go");
    setTimeout(() => { render(); window.scrollTo(0, 0); }, 300);
  }
  function render() {
    // Adresses simples : #scanner, #fiche-ASML, #apprendre-bases (compatibles avec les liens partagés).
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const cut = h.indexOf("-");
    const parts = cut > 0 && ["fiche", "apprendre"].includes(h.slice(0, cut)) ? [h.slice(0, cut), h.slice(cut + 1)] : [h];
    let r = parts[0] || "";
    if (r === "accueil") r = "";
    const views = { "": viewHome, veille: viewVeille, scanner: viewScanner, macro: viewMacro, portefeuille: viewPortfolio, journal: viewJournal, courtiers: viewBrokers, reglages: viewSettings, methode: viewMethod };
    let html;
    if (r === "fiche") html = viewFiche(parts[1] || "");
    else if (r === "apprendre") html = parts[1] ? viewLesson(parts[1]) : viewLearn();
    else html = (views[r] || viewHome)();
    const main = $("#main");
    if (stopPulse) { stopPulse(); stopPulse = null; }
    main.innerHTML = `<div class="view">${html}</div>`;
    window.Logo && Logo.align();
    runSims();
    const inAccount = ACCOUNT.some(([k]) => k === r);
    document.querySelectorAll("[data-route]").forEach((a) => {
      const k = a.dataset.route;
      const active = k === r || (r === "fiche" && k === "scanner") || (k === "@account" && inAccount);
      a.removeAttribute("aria-current"); if (active) a.setAttribute("aria-current", "page");
    });
    const mm = $("#mmenu"); if (mm?.classList.contains("open")) { mm.classList.remove("open"); $("#menuBtn").textContent = "Menu"; $("#menuBtn").setAttribute("aria-expanded", "false"); }
    const cv = $("#pulseCanvas");
    if (cv && window.Sky) {
      stopPulse = window.Sky.mount(cv, {
        items: M.universe.map((o) => ({ ...o, chg1d: day1(o) })),
        onPick: (t) => { location.hash = "#fiche-" + t; },
      });
    }
    hidePop();
    if (r === "courtiers") feeVerdict();
    const titles = { "": "Aujourd'hui", veille: "Veille", scanner: "Scanner", macro: "Macro", portefeuille: "Portefeuille", journal: "Journal", courtiers: "Courtiers", apprendre: "Apprendre", reglages: "Réglages", methode: "Méthode", fiche: parts[1] || "" };
    document.title = (titles[r] ?? NAME) + " · " + NAME;
  }

  function bindLearn() {
    document.addEventListener("change", (e) => { if (e.target.id === "restoreFile" && e.target.files[0]) restore(e.target.files[0]); });
    document.addEventListener("click", (e) => {
      const qa = e.target.closest("[data-qa]"); if (qa) { answerQuiz(qa); return; }
      const lt = e.target.closest("[data-letter]");
      if (lt) { e.preventDefault(); document.getElementById("lettre-" + lt.dataset.letter)?.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
    document.addEventListener("input", (e) => {
      if (e.target.matches(".sim input[data-k]")) runSims(e.target.closest(".sim").parentElement);
      if (e.target.id === "lexQ") {
        const q = e.target.value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let any = false;
        document.querySelectorAll(".lex-group").forEach((g) => {
          let n = 0;
          g.querySelectorAll(".lex-item").forEach((it) => { const hit = !q || it.dataset.s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q); it.hidden = !hit; n += hit; });
          g.hidden = !n; any ||= !!n;
        });
        document.querySelector(".lex-none").hidden = any;
      }
    });
  }
  bindLearn();

  function bind() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-action],[data-filter],[data-book],[data-go],[data-scanview]");
      if (!t) { if (!e.target.closest("[data-explain]")) hidePop(); return; }
      if (t.dataset.go) { location.hash = t.dataset.go; return; }
      if (t.dataset.filter) { state.filter = t.dataset.filter; render(); return; }
      if (t.dataset.book) { state.book = t.dataset.book; render(); return; }
      if (t.dataset.scanview) { state.scanView = t.dataset.scanview; render(); return; }
      const a = t.dataset.action;
      if (a === "explain") {
        state.explain = !state.explain; store.set("explain", state.explain);
        document.body.classList.toggle("explain-on", state.explain);
        document.querySelectorAll('[data-action="explain"]').forEach((b) => b.setAttribute("aria-pressed", state.explain));
      }
      if (a === "journal-new") journalModal({ ticker: t.dataset.ticker, amount: t.dataset.amount, thesis: t.dataset.thesis });
      if (a === "onboard") onboarding(0);
      if (a === "add-position") positionModal();
      if (a === "import-csv") importModal();
      if (a === "sim-add") {
        const u = M.universe.find((x) => x.ticker === t.dataset.ticker);
        if (u && u.price) { state.positions.simulated.push({ ticker: u.ticker, qty: +(+t.dataset.amount / u.price).toFixed(6), cost: u.price }); store.set("positions", state.positions); state.book = "simulated"; location.hash = "portefeuille"; }
      }
      if (a === "backup") backup();
      if (a === "del-position") { e.stopPropagation(); state.positions[state.book].splice(+t.dataset.i, 1); store.set("positions", state.positions); render(); }
      if (a === "simple-tax") { state.simpleTax = !state.simpleTax; t.setAttribute("aria-pressed", state.simpleTax); $("#brokerRows").innerHTML = brokerTable(); }
      if (a === "clear-search") { state.query = ""; const g = $("#globalSearch"); if (g) g.value = ""; render(); }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.dataset?.go) location.hash = e.target.dataset.go;
      if (e.key === "Escape") { hidePop(); document.querySelector(".modal-back")?.remove(); }
    });
    document.addEventListener("mouseover", (e) => { const el = e.target.closest("[data-explain]"); if (el) showPop(el); });
    document.addEventListener("mouseout", (e) => { if (e.target.closest("[data-explain]")) hidePop(); });
    document.addEventListener("focusin", (e) => { const el = e.target.closest("[data-explain]"); if (el) showPop(el); });
    document.addEventListener("input", (e) => {
      if (e.target.id === "q") {
        state.query = e.target.value; const pos = e.target.selectionStart; render();
        const q = $("#q"); q.focus(); q.setSelectionRange(pos, pos);
      }
      if (e.target.id === "feeAmt" || e.target.id === "feeFix") feeVerdict();
      if (e.target.dataset.sc) {
        const k = e.target.dataset.sc; state.brokerSc[k] = +e.target.value;
        $("#sc-" + k + "-o").textContent = state.brokerSc[k] + ({ plan: " €", amt: " €", us: " %" }[k] || "");
        $("#brokerRows").innerHTML = brokerTable();
      }
      if (e.target.dataset.sim) {
        state.sim[e.target.dataset.sim] = +e.target.value;
        $("#mOut").textContent = state.sim.monthly + " €"; $("#yOut").textContent = state.sim.years + " ans";
        const proj = C.project({ monthly: state.sim.monthly, initial: book(state.book).value, years: state.sim.years });
        $("#fan").innerHTML = C.fanChart(proj); $("#fanK").innerHTML = fanKpis(proj[proj.length - 1]);
      }
    });
    document.addEventListener("submit", (e) => {
      if (e.target.id !== "profileForm") return;
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      ["capital", "monthly", "core", "maxLine"].forEach((k) => (d[k] = +d[k]));
      state.profile = { ...state.profile, ...d }; state.sim.monthly = d.monthly; store.set("profile", state.profile); state.hasPlan = true;
      $("#saved").textContent = "Profil enregistré.";
    });
    window.addEventListener("hashchange", go);
  }

  /* ======================= Démarrage ======================= */
  /* Charge les vraies données produites chaque soir par GitHub Actions (site/data/*.json).
     Si elles manquent (fichier ouvert en local, premier déploiement…), on garde l'exemple fictif. */
  async function loadData() {
    if (location.protocol === "file:") return;
    const get = (f) => fetch(`data/${f}?v=${Date.now() / 36e5 | 0}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const getC = (f) => fetch(`content/${f}?v=${Date.now() / 36e5 | 0}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [uni, mac, meta, hist, brokers, brief] = await Promise.all([get("universe.json"), get("macro.json"), get("meta.json"), get("history.json"), getC("brokers.json"), get("brief.json")]);
    get("backtest.json").then((bt) => { if (bt) { M.backtest = bt; if (location.hash === "#methode") render(); } });
    if (meta) M.meta = meta;
    if (brokers) M.brokers = brokers;
    if (brief) M.brief = brief;
    if (!uni || !uni.items?.length) {
      // Sur le site en ligne, on n'affiche jamais de données inventées.
      M.dataError = true; M.isMock = false; M.universe = []; M.opportunities = []; M.macro = mac || null;
      return;
    }
    M.isMock = false;
    M.asOf = uni.as_of;
    M.benchmark = uni.benchmark;
    M.universe = uni.items;
    M.opportunities = (uni.ideas || []).map((t) => uni.items.find((i) => i.ticker === t)).filter(Boolean);
    if (mac) M.macro = mac;
    if (hist) M.history = hist;
  }
  shell(); bind(); window.Logo && Logo.align();
  loadData().finally(go);
  if (!store.get("onboarded", false)) setTimeout(() => onboarding(0), 400);
})();
