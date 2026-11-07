/* Petits graphiques en SVG, sans bibliothèque externe. */
(function () {
  const NS = 'xmlns="http://www.w3.org/2000/svg"';

  function sparkline(values, { w = 120, h = 36, stroke } = {}) {
    if (!values || values.length < 2) return "";
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => [
      (i / (values.length - 1)) * w,
      h - 3 - ((v - min) / span) * (h - 6),
    ]);
    const up = values[values.length - 1] >= values[0];
    const color = stroke || (up ? "var(--gain)" : "var(--loss)");
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const id = "g" + Math.random().toString(36).slice(2, 8);
    return `<svg ${NS} class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${d} L ${w} ${h} L 0 ${h} Z" fill="url(#${id})"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  }

  /* Le « halo » de score : l'anneau montre la fourchette (incertitude),
     le point lumineux montre l'estimation centrale. */
  function orb(score, low, high, size = 64) {
    const r = size / 2 - 5, c = size / 2;
    const START = -220, SWEEP = 260; // arc ouvert vers le bas
    const ang = (v) => ((START + (v / 100) * SWEEP) * Math.PI) / 180;
    const pt = (v, rad = r) => [c + rad * Math.cos(ang(v)), c + rad * Math.sin(ang(v))];
    const arc = (a, b) => {
      const [x1, y1] = pt(a), [x2, y2] = pt(b);
      const large = ((b - a) / 100) * SWEEP > 180 ? 1 : 0;
      return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
    };
    const [dx, dy] = pt(score);
    const big = size >= 120;
    return `<svg ${NS} class="orb" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img"
        aria-label="Score ${score} sur 100, fourchette de ${low} à ${high}">
      <path d="${arc(0, 100)}" class="orb-track" stroke-width="${big ? 6 : 4}" fill="none" stroke-linecap="round"/>
      <path d="${arc(low, high)}" class="orb-band" stroke-width="${big ? 6 : 4}" fill="none" stroke-linecap="round"/>
      <circle cx="${dx.toFixed(2)}" cy="${dy.toFixed(2)}" r="${big ? 7 : 4}" class="orb-dot"/>
      <text x="${c}" y="${c + (big ? 12 : 5)}" text-anchor="middle" class="orb-num" font-size="${big ? 40 : 17}">${score}</text>
      ${big ? `<text x="${c}" y="${c + 34}" text-anchor="middle" class="orb-range" font-size="13">${low} – ${high}</text>` : ""}
    </svg>`;
  }

  /* Projection d'un investissement mensuel : simulation Monte-Carlo simple
     (rendement annuel moyen mu, volatilité sigma), percentiles 10 / 50 / 90. */
  function project({ monthly, initial = 0, years, mu = 0.07, sigma = 0.15, paths = 600 }) {
    const months = years * 12;
    const m = Math.log(1 + mu) / 12 - (sigma * sigma) / 24; // dérive mensuelle log
    const s = sigma / Math.sqrt(12);
    let seed = 42;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const gauss = () => {
      const u = Math.max(rand(), 1e-9), v = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const yearly = Array.from({ length: years + 1 }, () => []);
    for (let p = 0; p < paths; p++) {
      let v = initial;
      yearly[0].push(v);
      for (let k = 1; k <= months; k++) {
        v = v * Math.exp(m + s * gauss()) + monthly;
        if (k % 12 === 0) yearly[k / 12].push(v);
      }
    }
    const q = (arr, t) => { const a = [...arr].sort((x, y) => x - y); return a[Math.floor(t * (a.length - 1))]; };
    return yearly.map((arr, y) => ({ y, p10: q(arr, 0.1), p50: q(arr, 0.5), p90: q(arr, 0.9), paid: initial + monthly * 12 * y }));
  }

  function fanChart(data, { w = 1100, h = 340 } = {}) {
    const pad = { l: 8, r: 8, t: 12, b: 24 };
    const max = Math.max(...data.map((d) => d.p90)) || 1;
    const X = (y) => pad.l + (y / (data.length - 1)) * (w - pad.l - pad.r);
    const Y = (v) => h - pad.b - (v / max) * (h - pad.t - pad.b);
    const line = (k) => data.map((d, i) => (i ? "L" : "M") + X(d.y).toFixed(1) + " " + Y(d[k]).toFixed(1)).join(" ");
    const band = data.map((d, i) => (i ? "L" : "M") + X(d.y).toFixed(1) + " " + Y(d.p90).toFixed(1)).join(" ") +
      " " + [...data].reverse().map((d) => "L" + X(d.y).toFixed(1) + " " + Y(d.p10).toFixed(1)).join(" ") + " Z";
    const ticks = data.filter((d) => d.y % 5 === 0 || d.y === data.length - 1).map((d) =>
      `<text x="${X(d.y)}" y="${h - 6}" text-anchor="${d.y === 0 ? "start" : d.y === data.length - 1 ? "end" : "middle"}" class="axis">${d.y === 0 ? "Aujourd'hui" : d.y + " ans"}</text>`).join("");
    return `<svg ${NS} class="fan" viewBox="0 0 ${w} ${h}" role="img" aria-label="Projection de la valeur du portefeuille">
      <path d="${band}" class="fan-band"/>
      <path d="${line("paid")}" class="fan-paid" fill="none"/>
      <path d="${line("p50")}" class="fan-mid" fill="none"/>
      ${ticks}
    </svg>`;
  }

  /* Cadran du cycle économique : 4 phases, la phase actuelle est allumée. */
  function cycleDial(phase) {
    const phases = [["reprise", "Reprise"], ["expansion", "Expansion"], ["surchauffe", "Surchauffe"], ["ralentissement", "Ralentissement"]];
    // Courbe sinusoïdale : creux à gauche, sommet au milieu, creux à droite.
    const W = 350, H = 170, x0 = 20, x1 = 280;
    const P = (t) => [x0 + t * (x1 - x0), 95 - 55 * Math.sin(-Math.PI / 2 + t * 2 * Math.PI)];
    let d = "";
    for (let i = 0; i <= 60; i++) { const [x, y] = P(i / 60); d += (i ? " L " : "M ") + x.toFixed(1) + " " + y.toFixed(1); }
    const at = { reprise: 0.2, expansion: 0.38, surchauffe: 0.5, ralentissement: 0.72 };
    return `<svg ${NS} viewBox="0 0 ${W} ${H}" class="cycle" role="img" aria-label="Phase actuelle : ${phase}">
      <path d="${d}" class="cycle-wave" fill="none"/>
      ${phases.map(([k, l]) => {
        const [x, y] = P(at[k]); const on = k === phase;
        const off = { reprise: [14, 6, "start"], expansion: [-14, 0, "end"], surchauffe: [0, -18, "middle"], ralentissement: [4, 26, "start"] }[k];
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 8 : 4.5}" class="${on ? "cycle-on" : "cycle-off"}"/>
          <text x="${(x + off[0]).toFixed(1)}" y="${(y + off[1] + 4).toFixed(1)}" text-anchor="${off[2]}" class="${on ? "cycle-lbl on" : "cycle-lbl"}">${l}</text>`;
      }).join("")}
    </svg>`;
  }

  window.Charts = { sparkline, orb, project, fanChart, cycleDial };
})();
