/* =========================================================================
   Logo Pyxis — dessiné d'après la vraie constellation de la Boussole.
   Les trois étoiles principales (β, α, γ Pyxidis) sont presque alignées :
   placées à leurs positions réelles dans le ciel, elles forment une aiguille
   légèrement inclinée. Le cercle autour est le boîtier de la boussole.
   Taille de chaque étoile = son éclat (α est la plus brillante).
   ========================================================================= */
(function () {
  // Positions réelles (ascension droite × cos(déclinaison), déclinaison), ramenées à β = origine.
  // β Pyx : 8h40m, −35,3° ; α Pyx : 8h43m, −33,2° ; γ Pyx : 8h50m, −27,7°.
  const STARS = [
    { id: "β", x: 58.4, y: 78.9, r: 4.6, mag: 3.97 },
    { id: "α", x: 52.3, y: 62.9, r: 6.2, mag: 3.68 },
    { id: "γ", x: 41.7, y: 21.1, r: 4.4, mag: 4.01 },
  ];

  /* Segment entre deux étoiles, avec un petit vide autour de chacune.
     Si les étoiles sont trop proches pour qu'un trait lisible tienne entre elles, on n'en dessine pas. */
  function seg(a, b, gap) {
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L;
    const s = a.r + gap, e = b.r + gap;
    if (L - s - e < 12) return "";
    return `M${(a.x + ux * s).toFixed(2)} ${(a.y + uy * s).toFixed(2)}L${(b.x - ux * e).toFixed(2)} ${(b.y - uy * e).toFixed(2)}`;
  }

  /**
   * Le signe Pyxis.
   * size : taille en pixels ; small : version simplifiée pour les petites tailles (favicon) ;
   * ring : dessiner le boîtier de boussole (un cercle simple, sans repère) ; color : couleur du trait.
   */
  function mark({ size = 48, small = size < 28, ring = true, color = "currentColor", title = "Pyxis" } = {}) {
    const sw = small ? 5 : 2.2, lw = small ? 4 : 1.4, gap = small ? 3 : 3.2;
    const k = small ? 1.25 : 1;
    const lines = [seg(STARS[0], STARS[1], gap), seg(STARS[1], STARS[2], gap)].join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${title}">
      ${ring ? `<circle cx="50" cy="50" r="${48 - sw / 2}" fill="none" stroke="${color}" stroke-width="${sw}"/>
` : ""}
      <path d="${lines}" fill="none" stroke="${color}" stroke-width="${lw}" stroke-linecap="round"/>
      ${STARS.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${(s.r * k).toFixed(2)}" fill="${color}"/>`).join("")}
    </svg>`;
  }

  /** Icône d'application : le signe sur un carré encre arrondi (identique à la première version). */
  function appIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#1e1b1a"/><g transform="translate(9 9) scale(.82)">${mark({ size: 100, small: true, color: "#f3cebb" }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g></svg>`;
  }
  const favicon = () => "data:image/svg+xml," + encodeURIComponent(appIcon());

  /* ------------------------------------------------------------------
     Logotype : signe + « Pyxis », mêmes proportions partout, à partir du
     diamètre D du signe :
       - le nom a une hauteur de capitale égale à 0,52 D ;
       - il est placé à 0,28 D du cercle ;
       - le centre des capitales est aligné sur le centre du cercle
         (à l'horizontale comme à la verticale).
     Les mesures exactes de la police sont relevées une fois chargée.
     ------------------------------------------------------------------ */
  const CAP = 0.52, GAPR = 0.28, FONT = "'Instrument Sans','Helvetica Neue',Arial,sans-serif";
  let metrics = { cap: 0.7, width: 2.25 }; // estimation avant chargement de la police (en em)

  function geometry(D, vertical) {
    const fs = (CAP * D) / metrics.cap, capH = CAP * D, gap = GAPR * D, tw = metrics.width * fs;
    return vertical
      // À la verticale, le cercle est en bas et le nom monte au-dessus de lui (lecture de bas en haut) :
      // le signe précède toujours le nom.
      ? { fs, w: D, h: D + gap + tw, tx: D / 2 + capH / 2, ty: tw, my: tw + gap, rot: true }
      : { fs, w: D + gap + tw, h: D, tx: D + gap, ty: D / 2 + capH / 2, my: 0, rot: false };
  }
  function lockup({ size = 48, color = "currentColor", vertical = false } = {}) {
    const g = geometry(size, vertical);
    const inner = mark({ size: 100, color, title: "" }).replace(/^<svg[^>]*>|<\/svg>$/g, "");
    return `<svg class="lockup" data-d="${size}" data-v="${vertical ? 1 : 0}" xmlns="http://www.w3.org/2000/svg" width="${g.w.toFixed(1)}" height="${g.h.toFixed(1)}" viewBox="0 0 ${g.w.toFixed(1)} ${g.h.toFixed(1)}" role="img" aria-label="Pyxis" style="display:block;overflow:visible">
      <svg class="lk-mark" x="0" y="${g.my.toFixed(2)}" width="${size}" height="${size}" viewBox="0 0 100 100" overflow="visible">${inner}</svg>
      <text x="${g.tx.toFixed(2)}" y="${g.ty.toFixed(2)}" ${g.rot ? `transform="rotate(-90 ${g.tx.toFixed(2)} ${g.ty.toFixed(2)})"` : ""} fill="${color}" font-family="${FONT.replace(/"/g, "")}" font-weight="500" font-size="${g.fs.toFixed(2)}" letter-spacing="${(-0.035 * g.fs).toFixed(2)}">Pyxis</text>
    </svg>`;
  }
  /** Recalcule l'alignement avec les vraies mesures de la police, une fois chargée. */
  function align(root = document) {
    try {
      const c = document.createElement("canvas").getContext("2d");
      c.font = `500 100px ${FONT}`;
      if ("letterSpacing" in c) c.letterSpacing = "-3.5px";
      const m = c.measureText("Pyxis"), h = c.measureText("H");
      if (h.actualBoundingBoxAscent > 40) metrics = { cap: h.actualBoundingBoxAscent / 100, width: m.width / 100 };
    } catch { return; }
    root.querySelectorAll("svg.lockup").forEach((el) => {
      const D = +el.dataset.d, v = el.dataset.v === "1", g = geometry(D, v), t = el.querySelector("text");
      el.setAttribute("width", g.w.toFixed(1)); el.setAttribute("height", g.h.toFixed(1));
      el.setAttribute("viewBox", `0 0 ${g.w.toFixed(1)} ${g.h.toFixed(1)}`);
      t.setAttribute("x", g.tx.toFixed(2)); t.setAttribute("y", g.ty.toFixed(2));
      t.setAttribute("font-size", g.fs.toFixed(2)); t.setAttribute("letter-spacing", (-0.035 * g.fs).toFixed(2));
      if (v) t.setAttribute("transform", `rotate(-90 ${g.tx.toFixed(2)} ${g.ty.toFixed(2)})`);
      const mk = el.querySelector(".lk-mark"); if (mk) mk.setAttribute("y", g.my.toFixed(2));
    });
  }
  if (typeof document !== "undefined" && document.fonts) document.fonts.ready.then(() => align());

  window.Logo = { mark, lockup, align, appIcon, favicon, STARS };
})();
