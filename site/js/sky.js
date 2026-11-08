/* =========================================================================
   La carte du ciel de la séance.
   Chaque point est un titre réellement suivi :
     - à droite ceux qui ont monté pendant la dernière séance, à gauche ceux qui ont baissé ;
     - en haut ceux qui montent depuis un mois, en bas ceux qui baissent ;
     - vert = hausse du jour, rouge = baisse ; plus le mouvement est fort, plus le point est gros.
   Les trois plus fortes hausses et les trois plus fortes baisses sont reliées
   en deux petites constellations. Survol : nom et chiffres ; clic : la fiche.
   La carte vit dans son propre cadre, à côté du texte : elle ne passe jamais dessous.
   ========================================================================= */
(function () {
  const PEACH = [243, 206, 187], GREEN = [124, 176, 86], RED = [222, 92, 70], INK = "#1e1b1a";
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const MONTH = 15; // ±15 % sur un mois
  // Échelle de la séance : comprimée (arcsinus hyperbolique) pour que les petits mouvements
  // restent lisibles au centre et que les très gros (+11 %) tiennent dans le cadre sans s'écraser au bord.
  const K = 0.8;
  const fmt = (v, d = 1) => (v > 0 ? "+" : "") + v.toFixed(d).replace(".", ",") + " %";

  function mount(canvas, { items = [], onPick } = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => {};
    const host = canvas.parentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0, alive = true, visible = true;
    let mouse = { x: -1e4, y: -1e4 }, hover = null;
    const t0 = performance.now();

    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pool = items.filter((o) => o.chg1d != null && isFinite(o.chg1d) && o.chg1m != null);
    const byDay = [...pool].sort((a, b) => b.chg1d - a.chg1d);
    const MAX = Math.min(15, Math.max(2, ...pool.map((o) => Math.abs(o.chg1d))));
    const sx = (d) => Math.asinh(Math.max(-MAX, Math.min(MAX, d)) / K) / Math.asinh(MAX / K); // -1 .. 1
    const ticks = [1, 2, 5, 10].filter((k) => k <= MAX * 0.98);
    const top = byDay.slice(0, 3).map((o) => o.ticker), bottom = byDay.slice(-3).map((o) => o.ticker);
    const stars = pool.map((o) => ({
      o,
      fx: sx(o.chg1d),
      fy: Math.max(-MONTH, Math.min(MONTH, o.chg1m)) / MONTH,
      mag: Math.min(1, Math.abs(o.chg1d) / 4),
      jx: 0, jy: (rnd() - 0.5) * 0.03,
      phase: rnd() * Math.PI * 2, speed: 0.5 + rnd(),
      group: top.includes(o.ticker) ? "top" : bottom.includes(o.ticker) ? "bottom" : null,
    }));
    const dust = Array.from({ length: 90 }, () => ({ x: rnd(), y: rnd(), r: rnd() * 0.8 + 0.2, a: rnd() * 0.12 + 0.03, p: rnd() * 6 }));

    const box = () => ({ l: 38, r: W - 24, t: 34, b: H - 52 });
    function place(s) {
      const B = box();
      return {
        x: B.l + ((s.fx + 1) / 2 + s.jx) * (B.r - B.l),
        y: B.b - ((s.fy + 1) / 2 + s.jy) * (B.b - B.t),
      };
    }
    function size() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function axes() {
      const B = box(), zx = (B.l + B.r) / 2, zy = (B.t + B.b) / 2;
      const tk = W < 560 ? ticks.filter((k) => k === 2 || k === 10 || k === ticks[ticks.length - 1]) : ticks; // moins de repères sur petit écran
      // Demi-plans teintés : moitié droite verte, moitié gauche rouge, très léger.
      let g = ctx.createLinearGradient(B.l, 0, B.r, 0);
      g.addColorStop(0, rgba(RED, 0.07)); g.addColorStop(0.5, rgba(PEACH, 0)); g.addColorStop(1, rgba(GREEN, 0.07));
      ctx.fillStyle = g; ctx.fillRect(B.l, B.t, B.r - B.l, B.b - B.t);
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(PEACH, 0.08);
      tk.forEach((k) => [k, -k].forEach((v) => {
        const x = zx + sx(v) * (zx - B.l);
        ctx.beginPath(); ctx.moveTo(x, B.t); ctx.lineTo(x, B.b); ctx.stroke();
      }));
      ctx.strokeStyle = rgba(PEACH, 0.3);
      ctx.beginPath(); ctx.moveTo(zx, B.t); ctx.lineTo(zx, B.b); ctx.stroke();
      ctx.setLineDash([2, 5]); ctx.strokeStyle = rgba(PEACH, 0.2);
      ctx.beginPath(); ctx.moveTo(B.l, zy); ctx.lineTo(B.r, zy); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.fillStyle = rgba(PEACH, 0.6);
      ctx.textAlign = "left"; ctx.fillText("← baisse sur la séance", B.l, B.b + 34);
      ctx.textAlign = "right"; ctx.fillText("hausse sur la séance →", B.r, B.b + 34);
      ctx.textAlign = "center";
      tk.forEach((k) => [k, -k].forEach((v) => ctx.fillText(fmt(v, 0), zx + sx(v) * (zx - B.l), B.t - 12)));
      ctx.fillText("0 %", zx, B.t - 12);
      ctx.save(); ctx.translate(B.l - 16, zy); ctx.rotate(-Math.PI / 2);
      ctx.fillText("↓ baisse sur un mois · hausse sur un mois ↑", 0, 0); ctx.restore();
    }

    function chain(list, col, draw) {
      if (list.length < 2) return;
      ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 1.2;
      const segs = list.length - 1, upto = draw * segs;
      ctx.beginPath(); ctx.moveTo(list[0].x, list[0].y);
      for (let i = 1; i <= segs; i++) {
        const f = Math.min(1, Math.max(0, upto - (i - 1)));
        if (f <= 0) break;
        ctx.lineTo(list[i - 1].x + (list[i].x - list[i - 1].x) * f, list[i - 1].y + (list[i].y - list[i - 1].y) * f);
      }
      ctx.stroke();
    }

    function frame(now) {
      if (!alive) return;
      const t = reduce ? 3 : (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
      dust.forEach((d) => {
        ctx.fillStyle = rgba(PEACH, d.a * (0.7 + 0.3 * Math.sin(t * 0.7 + d.p)));
        ctx.beginPath(); ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2); ctx.fill();
      });
      axes();

      const pts = stars.map((s) => ({ s, ...place(s) }));
      const draw = reduce ? 1 : Math.min(1, Math.max(0, (t - 0.3) / 1.8));
      chain(top.map((tk) => pts.find((p) => p.s.o.ticker === tk)).filter(Boolean), GREEN, draw);
      chain(bottom.map((tk) => pts.find((p) => p.s.o.ticker === tk)).filter(Boolean), RED, draw);

      hover = null; let best = 16;
      pts.forEach((p) => { const d = Math.hypot(p.x - mouse.x, p.y - mouse.y); if (d < best) { best = d; hover = p; } });
      pts.forEach((p) => {
        const { s } = p, d = s.o.chg1d;
        const col = Math.abs(d) < 0.05 ? PEACH : d > 0 ? GREEN : RED;
        const tw = reduce ? 1 : 0.8 + 0.2 * Math.sin(t * s.speed + s.phase);
        const r = 1.6 + s.mag * 4.2;
        if (s.group || p === hover) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
          g.addColorStop(0, rgba(col, 0.4 * tw)); g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = rgba(col, (0.45 + 0.55 * s.mag) * tw);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      });
      // Étiquettes des plus forts mouvements : on essaie plusieurs positions et on garde la première libre.
      if (draw >= 1) {
        const taken = [];
        ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.textAlign = "left";
        pts.filter((p) => p.s.group).sort((a, b) => Math.abs(b.s.o.chg1d) - Math.abs(a.s.o.chg1d)).forEach((p) => {
          const d = p.s.o.chg1d, col = d > 0 ? GREEN : RED, r = 1.6 + p.s.mag * 4.2;
          const label = `${p.s.o.ticker.split(".")[0]} ${fmt(d)}`, w = ctx.measureText(label).width + 6, h = 15;
          const tries = [[p.x + r + 6, p.y - 8], [p.x - w / 2, p.y - r - 6 - h], [p.x - w / 2, p.y + r + 6], [p.x - r - 6 - w, p.y - 8],
            [p.x + r + 6, p.y - 8 - h - 2], [p.x + r + 6, p.y + h - 6], [p.x - r - 6 - w, p.y - 8 - h - 2], [p.x - r - 6 - w, p.y + h - 6]];
          const fits = ([x, y]) => x >= 2 && y >= 2 && x + w <= W - 2 && y + h <= H - 30 &&
            !taken.some((q) => x < q[0] + q[2] && x + w > q[0] && y < q[1] + q[3] && y + h > q[1]);
          const spot = tries.find(fits);
          if (!spot) return; // pas de place libre : le titre reste dans la liste à gauche et au survol
          const [x, y] = spot;
          taken.push([x, y, w, h]);
          ctx.fillStyle = "rgba(30,27,26,.9)"; ctx.fillRect(x, y, w, h);
          ctx.fillStyle = rgba(col, 1); ctx.fillText(label, x + 3, y + 11);
        });
      }

      if (hover) {
        const o = hover.s.o, lines = [o.name, `séance ${fmt(o.chg1d, 2)} · 1 mois ${fmt(o.chg1m)}`];
        ctx.font = "500 13px 'Instrument Sans', sans-serif";
        const w = Math.max(ctx.measureText(lines[0]).width, 190) + 20;
        let bx = hover.x + 14, by = hover.y - 48;
        if (bx + w > W - 8) bx = hover.x - w - 14;
        if (by < 8) by = hover.y + 14;
        ctx.fillStyle = "rgba(243,206,187,0.97)"; ctx.fillRect(bx, by, w, 42);
        ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.fillText(lines[0], bx + 10, by + 17);
        ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.fillStyle = "#6b5249"; ctx.fillText(lines[1], bx + 10, by + 32);
        host.style.cursor = "pointer";
      } else host.style.cursor = "";

      if (!reduce && visible) raf = requestAnimationFrame(frame);
    }

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (reduce) frame(performance.now());
    };
    const onLeave = () => { mouse = { x: -1e4, y: -1e4 }; if (reduce) frame(performance.now()); };
    const onClick = () => { if (hover && onPick) onPick(hover.s.o.ticker); };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);
    const ro = new ResizeObserver(() => { size(); frame(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting; cancelAnimationFrame(raf);
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    size(); raf = requestAnimationFrame(frame);
    return () => {
      alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); canvas.removeEventListener("click", onClick);
    };
  }

  window.Sky = { mount };
})();
