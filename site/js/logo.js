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

  /** Icône d'onglet du navigateur (favicon), en data URI. */
  function favicon() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#1e1b1a"/><g transform="translate(9 9) scale(.82)">${mark({ size: 100, small: true, color: "#f3cebb" }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  window.Logo = { mark, favicon, STARS };
})();
