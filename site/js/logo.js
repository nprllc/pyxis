/* =========================================================================
   Logo Pyxis — une seule géométrie, utilisée partout et à toutes les tailles.

   Le signe : les trois étoiles principales de la constellation de la Boussole
   (β, α, γ Pyxidis) placées d'après leurs positions réelles dans le ciel,
   légèrement agrandies autour du centre pour respirer, dans un cercle.
   Un seul trait relie γ à α. Cercle et trait ont la même épaisseur.

   Le logotype : le signe + « Pyxis », toujours dans les mêmes proportions,
   construites à partir du diamètre D du signe :
     - horizontal : texte de hauteur 0,62 D, espace 0,32 D ;
     - vertical (rail) : texte de hauteur 0,74 D, espace 0,36 D, axes centrés.
   Version de référence : pêche sur encre. Sur fond clair : encre pleine.
   ========================================================================= */
(function () {
  const C = [50, 50], K = 1.15; // agrandissement autour du centre
  const at = (x, y) => [C[0] + (x - C[0]) * K, C[1] + (y - C[1]) * K];
  // Positions réelles (β = origine), voir la planche d'identité.
  const STARS = [
    { id: "β", p: at(58.4, 78.9), r: 6.4, mag: 3.97 },
    { id: "α", p: at(52.3, 62.9), r: 8.6, mag: 3.68 },
    { id: "γ", p: at(41.7, 21.1), r: 6.2, mag: 4.01 },
  ].map((s) => ({ ...s, x: +s.p[0].toFixed(2), y: +s.p[1].toFixed(2) }));
  const STROKE = 4.6, GAP = 5;

  function line(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const s = a.r + GAP, e = b.r + GAP;
    return `M${(a.x + ux * s).toFixed(2)} ${(a.y + uy * s).toFixed(2)}L${(b.x - ux * e).toFixed(2)} ${(b.y - uy * e).toFixed(2)}`;
  }

  /** Le signe seul. */
  function mark({ size = 48, color = "currentColor", title = "" } = {}) {
    const [b, a, g] = STARS;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}"${title ? ` role="img" aria-label="${title}"` : ' aria-hidden="true"'} style="display:block;flex:none">
      <circle cx="50" cy="50" r="${(50 - STROKE / 2).toFixed(2)}" fill="none" stroke="${color}" stroke-width="${STROKE}"/>
      <path d="${line(g, a)}" stroke="${color}" stroke-width="${STROKE}" stroke-linecap="round" fill="none"/>
      ${[b, a, g].map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${color}"/>`).join("")}
    </svg>`;
  }

  /** Le logotype complet (signe + nom), toujours dans les mêmes proportions. */
  function lockup({ size = 48, color = "currentColor", vertical = false } = {}) {
    const fs = (vertical ? 0.74 : 0.62) * size, gap = (vertical ? 0.36 : 0.32) * size;
    const text = `<span style="font:500 ${fs.toFixed(1)}px/1 'Instrument Sans','Helvetica Neue',Arial,sans-serif;letter-spacing:-0.035em;color:${color};${vertical ? "writing-mode:vertical-rl;transform:rotate(180deg);" : ""}white-space:nowrap">Pyxis</span>`;
    return `<span class="lockup" style="display:inline-flex;${vertical ? "flex-direction:column;" : ""}align-items:center;gap:${gap.toFixed(1)}px">${mark({ size, color })}${text}</span>`;
  }

  /** Icône d'application : le signe pêche sur un carré encre arrondi. */
  function appIcon() {
    const inner = mark({ size: 100, color: "#f3cebb" }).replace(/^<svg[^>]*>|<\/svg>$/g, "");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#1e1b1a"/><g transform="translate(16 16) scale(.68)">${inner}</g></svg>`;
  }
  const favicon = () => "data:image/svg+xml," + encodeURIComponent(appIcon());

  window.Logo = { mark, lockup, appIcon, favicon, STARS };
})();
