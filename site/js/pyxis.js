/* =========================================================================
   Pyxis, l'intelligence de la plateforme.
   - Un bouton (le signe Pyxis) à côté de chaque section : il ouvre une conversation
     sur ce sujet précis, avec le contenu de la section comme contexte.
   - Le modèle se règle dans Réglages : fournisseur, modèle, clé. La clé reste dans
     ce navigateur et n'est jamais publiée ni incluse dans les sauvegardes.
   - « Ajouter au Journal » demande au modèle la conclusion de l'échange, datée.
   Fournisseurs : Anthropic (Claude), Mistral, Google Gemini, OpenAI, ou tout service
   compatible OpenAI (adresse à renseigner).
   ========================================================================= */
(function () {
  const KEY = "investlab.ai";
  const PROVIDERS = {
    anthropic: { label: "Claude (Anthropic)", model: "claude-sonnet-5-5", keyUrl: "https://console.anthropic.com/settings/keys" },
    mistral: { label: "Mistral", model: "mistral-large-latest", keyUrl: "https://console.mistral.ai/api-keys" },
    gemini: { label: "Gemini (Google)", model: "gemini-flash-latest", keyUrl: "https://aistudio.google.com/app/apikey" },
    openai: { label: "OpenAI", model: "gpt-4.1-mini", keyUrl: "https://platform.openai.com/api-keys" },
    compatible: { label: "Autre (compatible OpenAI)", model: "", keyUrl: "" },
  };
  const getCfg = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const setCfg = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} };

  const ready = () => { const c = getCfg(); return !!(c.provider && c.key && (c.model || PROVIDERS[c.provider]?.model) && (c.provider !== "compatible" || c.base)); };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Appel du modèle (depuis le navigateur) ---------- */
  async function call(system, messages, { json = false, max = 1200 } = {}) {
    const c = getCfg(), p = c.provider, model = c.model || PROVIDERS[p]?.model;
    let r, j;
    if (p === "anthropic") {
      r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": c.key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model, max_tokens: max, system, messages }),
      });
      j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error?.message || `erreur ${r.status}`);
      return (j.content || []).map((b) => b.text || "").join("");
    }
    if (p === "gemini") {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(c.key)}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
          generationConfig: { maxOutputTokens: max, ...(json ? { responseMimeType: "application/json" } : {}) },
        }),
      });
      j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error?.message || `erreur ${r.status}`);
      return j.candidates?.[0]?.content?.parts?.map((x) => x.text || "").join("") || "";
    }
    const base = { openai: "https://api.openai.com/v1", mistral: "https://api.mistral.ai/v1" }[p] || c.base;
    r = await fetch(`${String(base).replace(/\/$/, "")}/chat/completions`, {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${c.key}` },
      body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...messages], max_tokens: max, ...(json ? { response_format: { type: "json_object" } } : {}) }),
    });
    j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error?.message || j.message || `erreur ${r.status}`);
    return j.choices?.[0]?.message?.content || "";
  }

  /* ---------- Mise en forme légère des réponses ---------- */
  function fmt(t) {
    const lines = esc(t.trim()).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").split(/\n/);
    let html = "", list = false;
    lines.forEach((l) => {
      const m = l.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)/);
      if (m) { if (!list) { html += "<ul>"; list = true; } html += `<li>${m[1]}</li>`; return; }
      if (list) { html += "</ul>"; list = false; }
      if (l.trim()) html += `<p>${l}</p>`;
    });
    return html + (list ? "</ul>" : "");
  }

  /* ---------- La fenêtre de conversation ---------- */
  let panel = null, convo = null;
  function systemPrompt(ctx, env) {
    return `Tu es Pyxis, l'intelligence de la plateforme Pyxis, qui aide ${env.name ? env.name : "un investisseur débutant"} à apprendre à investir et à garder le cap.
Profil : ${env.profile}
Nous sommes le ${env.today}.

Comment tu réponds :
- En français, en tutoyant, simplement. Chaque terme technique est expliqué en quelques mots la première fois.
- Court par défaut : 150 mots au plus, sauf si on te demande plus. Des phrases, pas de titres.
- Honnête sur l'incertitude : tu distingues les faits, les estimations et les opinions. Tu ne promets aucun rendement.
- Tu peux donner ton analyse et dire ce que tu ferais à sa place pour apprendre, mais tu rappelles la décision qui lui revient et ce qui pourrait te donner tort. Pas de jargon de vendeur.
- Tu t'appuies d'abord sur le contexte ci-dessous (ce que la personne regarde dans Pyxis). Si tu ajoutes des connaissances générales, dis-le ; si une information récente te manque, dis-le aussi plutôt que d'inventer.
- Résidence fiscale espagnole : pour les impôts, donne le principe et renvoie vers un gestor pour son cas.

Données Pyxis du jour : ${env.market}

Ce que la personne regarde (${ctx.where}) :
"""
${ctx.text.slice(0, 6000)}
"""`;
  }

  function open(ctx, env) {
    close();
    convo = { ctx, env, messages: [], busy: false };
    panel = document.createElement("div");
    panel.className = "pyx-back";
    panel.innerHTML = `<aside class="pyx" role="dialog" aria-modal="true" aria-label="Conversation avec Pyxis">
      <header class="pyx-head">
        <span class="pyx-mark">${window.Logo ? Logo.mark({ size: 26 }) : ""}</span>
        <div><b>Pyxis</b><span class="label">À propos : ${esc(ctx.topic)}</span></div>
        <button type="button" class="pyx-x" data-pyx="close" aria-label="Fermer">Fermer</button>
      </header>
      <div class="pyx-body">
      <div class="pyx-log" aria-live="polite"></div>
      ${ready() ? `
      <form class="pyx-form"><textarea rows="2" placeholder="Ta question…" aria-label="Ta question"></textarea><button type="submit" class="btn primary">Envoyer</button></form>
      <footer class="pyx-foot">
        <button type="button" class="btn" data-pyx="journal" disabled>Ajouter au Journal</button></footer>`
      : `<div class="pyx-setup"><p>Pyxis a besoin d'une clé d'API pour répondre.</p><a class="btn primary" href="#reglages" data-pyx="close">Ajouter la clé</a></div>`}
      </div>
    </aside>`;
    document.body.appendChild(panel);
    requestAnimationFrame(() => panel.classList.add("on"));
    panel.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);

    const f = panel.querySelector(".pyx-form");
    if (f) {
      const ta = f.querySelector("textarea");
      f.addEventListener("submit", (e) => { e.preventDefault(); send(ta.value); ta.value = ""; });
      ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); f.requestSubmit(); } });
      setTimeout(() => ta.focus(), 50);
    }
    document.addEventListener("keydown", onKey);
  }
  function close() {
    if (!panel) return;
    const p = panel; panel = null; convo = null;
    p.classList.remove("on"); setTimeout(() => p.remove(), 200);
    document.removeEventListener("keydown", onKey);
  }
  const onKey = (e) => { if (e.key === "Escape") close(); };
  function onClick(e) {
    if (e.target === panel) return close();
    const a = e.target.closest("[data-pyx]");
    if (a?.dataset.pyx === "close") return close();
    if (a?.dataset.pyx === "journal") return toJournal(a);

    const q = e.target.closest("[data-pyx-q]");
    if (q) send(q.dataset.pyxQ);
  }
  function add(role, html) {
    const log = panel.querySelector(".pyx-log");
    const el = document.createElement("div");
    el.className = `pyx-msg ${role}`;
    el.innerHTML = html;
    log.appendChild(el); log.scrollTop = log.scrollHeight;
    return el;
  }
  async function send(text) {
    text = (text || "").trim();
    if (!text || !convo || convo.busy) return;
    convo.busy = true;
    panel.querySelector(".pyx-sugg")?.remove();
    add("me", `<p>${esc(text)}</p>`);
    convo.messages.push({ role: "user", content: text });
    const wait = add("ai", `<p class="pyx-wait">Pyxis réfléchit…</p>`);
    try {
      const out = await call(systemPrompt(convo.ctx, convo.env), convo.messages);
      if (!convo) return;
      convo.messages.push({ role: "assistant", content: out });
      wait.innerHTML = fmt(out);
      panel.querySelector('[data-pyx="journal"]').disabled = false;
    } catch (err) {
      convo.messages.pop();
      wait.innerHTML = `<p class="pyx-err">Pyxis n'a pas pu répondre : ${esc(err.message)}. Vérifie la clé et le modèle dans les Réglages.</p>`;
    }
    if (convo) convo.busy = false;
  }
  async function toJournal(btn) {
    if (!convo || convo.busy || !convo.messages.length) return;
    convo.busy = true; btn.disabled = true; btn.textContent = "Rédaction de la conclusion…";
    const transcript = convo.messages.map((m) => `${m.role === "user" ? "Moi" : "Pyxis"} : ${m.content}`).join("\n\n");
    try {
      const raw = await call("Tu rédiges des notes de journal d'investissement, en français, à la deuxième personne, sobres et factuelles.",
        [{ role: "user", content: `Voici une conversation entre moi et Pyxis à propos de « ${convo.ctx.topic} ».\n\n${transcript}\n\nRédige la conclusion à garder dans mon journal : ce que j'ai compris, ce que je décide ou ce que je dois surveiller. Réponds uniquement en JSON : {"title": "titre de 8 mots au plus", "conclusion": "2 à 4 phrases"}` }],
        { json: true, max: 500 });
      const m = raw.match(/\{[\s\S]*\}/);
      const j = m ? JSON.parse(m[0]) : { title: convo.ctx.topic, conclusion: raw.trim() };
      convo.env.save({ kind: "conversation", topic: convo.ctx.topic, ticker: convo.ctx.ticker || "", title: String(j.title || convo.ctx.topic).slice(0, 90), conclusion: String(j.conclusion || "").trim(), exchanges: convo.messages.length / 2 });
      btn.textContent = "Ajouté au Journal";
      add("ai", `<p class="pyx-note"><b>Ajouté au Journal.</b> ${esc(j.conclusion || "")}</p>`);
    } catch (err) {
      btn.disabled = false; btn.textContent = "Ajouter au Journal";
      add("ai", `<p class="pyx-err">Impossible de rédiger la conclusion : ${esc(err.message)}.</p>`);
    }
    if (convo) convo.busy = false;
  }

  /* ---------- Réglages ---------- */
  function settingsHTML() {
    const c = getCfg(), p = c.provider || "";
    return `<section class="panel" style="max-width:640px;margin-top:54px" id="pyxis-ai">
      <div class="panel-head"><h2>Pyxis, ton assistant</h2></div>
      <p class="muted small" style="margin-bottom:8px">Choisis le fournisseur et colle ta clé. Elle reste dans ce navigateur.</p>
      <form id="aiForm" class="stack">
        <label class="field">Fournisseur<select name="provider"><option value="">Choisir…</option>${Object.entries(PROVIDERS).map(([k, v]) => `<option value="${k}"${k === p ? " selected" : ""}>${v.label}</option>`).join("")}</select></label>
        <label class="field">Clé d'API<input type="password" name="key" value="${esc(c.key || "")}" autocomplete="off" spellcheck="false"></label>
        <details class="pyx-adv"><summary class="label">Réglages avancés</summary>
          <label class="field">Modèle<input type="text" name="model" value="${esc(c.model || "")}" placeholder="${esc(PROVIDERS[p]?.model || "nom du modèle")}" autocomplete="off"></label>
          <label class="field" data-base ${p === "compatible" ? "" : "hidden"}>Adresse du service<input type="url" name="base" value="${esc(c.base || "")}" placeholder="https://…/v1"></label>
        </details>
        <p class="muted small" data-keyhelp>${PROVIDERS[p]?.keyUrl ? `Où trouver ta clé : <a href="${PROVIDERS[p].keyUrl}" target="_blank" rel="noopener">${PROVIDERS[p].keyUrl.replace("https://", "")}</a>` : "Mistral et Gemini proposent une offre gratuite ; Claude et OpenAI coûtent quelques euros par mois pour un usage personnel."}</p>
        <div class="row wrap"><button class="btn primary" type="submit">Enregistrer et tester</button>${c.key ? `<button class="btn" type="button" data-action="ai-forget">Effacer la clé</button>` : ""}</div>
        <p class="small" id="aiMsg" aria-live="polite"></p>
      </form>
    </section>`;
  }
  function bindSettings(root) {
    const f = root.querySelector("#aiForm"); if (!f) return;
    f.provider.addEventListener("change", () => {
      const p = f.provider.value;
      f.model.placeholder = PROVIDERS[p]?.model || "nom du modèle";
      root.querySelector("[data-base]").hidden = p !== "compatible";
      const h = root.querySelector("[data-keyhelp]");
      if (PROVIDERS[p]?.keyUrl) h.innerHTML = `Où trouver ta clé : <a href="${PROVIDERS[p].keyUrl}" target="_blank" rel="noopener">${PROVIDERS[p].keyUrl.replace("https://", "")}</a>`;
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      setCfg({ provider: d.provider, model: (d.model || "").trim(), key: (d.key || "").trim(), base: (d.base || "").trim() });
      const msg = root.querySelector("#aiMsg");
      if (!ready()) { msg.textContent = "Il manque le fournisseur, la clé ou l'adresse du service."; return; }
      msg.textContent = "Test en cours…";
      try { await call("Réponds en un mot.", [{ role: "user", content: "Dis OK." }], { max: 20 }); msg.innerHTML = `<b class="gain">Pyxis est prêt.</b> Clique sur son signe à côté de n'importe quelle section.`; }
      catch (err) { msg.innerHTML = `<b class="loss">Échec du test :</b> ${esc(err.message)}`; }
    });
    root.querySelector('[data-action="ai-forget"]')?.addEventListener("click", () => { setCfg({}); root.querySelector("#aiMsg").textContent = "Clé effacée."; f.key.value = ""; });
  }

  /* ---------- Les boutons « Demander à Pyxis » ----------
     Placés à côté des actions et des étiquettes (« Lire la veille », « Momentum », en-têtes de section),
     soit dans un emplacement prévu (.pyx-slot), soit au bout des rangées d'en-tête. */
  const btnHTML = (scope) => `<span role="button" tabindex="0" class="pyx-ask" data-ask data-scope="${scope}" aria-label="Demander à Pyxis" title="Demander à Pyxis">${window.Logo ? Logo.mark({ size: 18 }) : "P"}</span>`;
  const HOSTS = [
    [".pyx-point > .label:last-child", "point"],
    [".lex-item dt", "lex"],
  ];
  function decorate(root) {
    root.querySelectorAll(".pyx-slot:empty").forEach((el) => el.insertAdjacentHTML("beforeend", btnHTML(el.dataset.scope || "section")));
    HOSTS.forEach(([sel, scope]) => root.querySelectorAll(sel).forEach((h) => {
      if (h.querySelector(":scope > .pyx-ask, :scope > .pyx-slot")) return;
      h.insertAdjacentHTML(scope === "page" ? "afterbegin" : "beforeend", btnHTML(scope));
    }));
  }
  const SCOPES = { panel: ".panel", point: ".pyx-point", lex: ".lex-item", opp: ".opp", brief: ".brief-home", hero: ".hero", row: "tr", mover: ".mover", news: ".news-item", house: "div", lesson: "article", section: "section" };
  const firstLine = (el) => (el?.innerText || "").trim().split("\n")[0].trim();
  function contextOf(btn) {
    const scope = btn.dataset.scope || "section";
    const main = document.querySelector("#main");
    const unit = scope === "page" ? main : btn.closest(SCOPES[scope] || "section") || main;
    const clone = unit.cloneNode(true);
    clone.querySelectorAll(".pyx-ask, script, svg, canvas, button, .pyx-slot").forEach((n) => n.remove());
    const text = clone.innerText.replace(/\n{3,}/g, "\n\n").trim();
    const h1 = firstLine(main.querySelector(".topbar h1"));
    let topic = {
      page: h1,
      panel: firstLine(unit.querySelector(".panel-head")),
      opp: firstLine(unit.querySelector(".t b")),
      brief: "La veille : " + firstLine(unit.querySelector("h2")),
      pulse: "La séance du jour",
      lex: firstLine(unit.querySelector("dt")),
      hero: firstLine(unit.querySelector("h3, h2")),
      row: firstLine(unit.querySelector(".who b")),
      mover: firstLine(unit.querySelector("span")),
      news: firstLine(unit),
      house: firstLine(unit.querySelector("b")),
      lesson: h1,
    }[scope] || firstLine(unit);
    if (scope === "point") topic = text.slice(0, 90) + (text.length > 90 ? "…" : "");
    return { topic: (topic || h1 || "Pyxis").slice(0, 120), text, where: document.title.replace(/ · Pyxis| — Pyxis/, "") };
  }

  window.PyxisAI = { open, close, ready, decorate, contextOf, settingsHTML, bindSettings, KEY };
})();
