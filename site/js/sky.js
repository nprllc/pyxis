/* =========================================================================
   La carte du ciel des marchés.
   Chaque étoile est un titre réellement suivi :
     - à droite ceux qui ont monté sur un mois, à gauche ceux qui ont baissé ;
     - en haut les meilleurs scores ;
     - l'éclat suit le score.
   Les idées du jour sont reliées entre elles et forment la constellation,
   comme les étoiles de Pyxis, la Boussole. Survol : nom et chiffres ; clic : la fiche.
   ========================================================================= */
(function () {
  const PEACH = [243, 206, 187], GREEN = [111, 154, 78];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  function mount(canvas, { items = [], ideas = [], onPick } = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => {};
    const host = canvas.parentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0, alive = true, visible = true;
    let mouse = { x: -1e4, y: -1e4 }, par = { x: 0, y: 0 }, hover = null;
    const t0 = performance.now();

    // Étoiles : position fixe calculée à partir des données, petite variation pour éviter les superpositions.
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pool = items.filter((o) => o.score != null && o.chg1m != null);
    const stars = pool.map((o) => ({
      o, idea: ideas.includes(o.ticker),
      fx: Math.max(-15, Math.min(15, o.chg1m)) / 15, // -1 .. 1
      fy: Math.max(0, Math.min(1, (o.score - 30) / 50)), // 0 .. 1
      jx: (rnd() - 0.5) * 0.03, jy: (rnd() - 0.5) * 0.05,
      phase: rnd() * Math.PI * 2, speed: 0.6 + rnd() * 1.2,
    }));
    // Champ d'étoiles de fond (purement décoratif, très discret).
    const dust = Array.from({ length: 220 }, () => ({ x: rnd(), y: rnd(), r: rnd() * 0.9 + 0.2, a: rnd() * 0.25 + 0.05, p: rnd() * 6 }));

    function place(s) {
      const left = W * 0.30, right = W * 0.97, top = H * 0.10, bottom = H * 0.86;
      return {
        x: left + ((s.fx + 1) / 2 + s.jx) * (right - left) + par.x * (0.5 + s.fy),
        y: bottom - (s.fy + s.jy) * (bottom - top) + par.y * (0.5 + s.fy),
      };
    }

    function size() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function grid() {
      // Planisphère : cercles concentriques et rayons autour d'un pôle hors cadre, à droite.
      const cx = W * 0.82, cy = H * 1.25;
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(PEACH, 0.07);
      for (let k = 1; k <= 9; k++) { ctx.beginPath(); ctx.arc(cx, cy, k * Math.max(W, H) * 0.16, Math.PI, 2 * Math.PI); ctx.stroke(); }
      for (let a = 0; a < 18; a++) {
        const ang = Math.PI + (a / 18) * Math.PI;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * W * 2, cy + Math.sin(ang) * W * 2); ctx.stroke();
      }
      // Axe zéro (variation nulle sur un mois)
      const zx = W * 0.30 + 0.5 * (W * 0.67);
      ctx.setLineDash([2, 6]); ctx.strokeStyle = rgba(PEACH, 0.18);
      ctx.beginPath(); ctx.moveTo(zx, H * 0.06); ctx.lineTo(zx, H * 0.9); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.fillStyle = rgba(PEACH, 0.38); ctx.textAlign = "center";
      ctx.fillText("0 %", zx, H * 0.05);
    }

    function frame(now) {
      if (!alive) return;
      const t = reduce ? 3 : (now - t0) / 1000;
      // Parallaxe douce vers la souris
      const tx = mouse.x > -1e3 ? (mouse.x / W - 0.5) * -10 : 0, ty = mouse.y > -1e3 ? (mouse.y / H - 0.5) * -6 : 0;
      par.x += (tx - par.x) * 0.05; par.y += (ty - par.y) * 0.05;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#1e1b1a"; ctx.fillRect(0, 0, W, H);
      dust.forEach((d) => {
        ctx.fillStyle = rgba(PEACH, d.a * (0.7 + 0.3 * Math.sin(t * 0.8 + d.p)));
        ctx.beginPath(); ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2); ctx.fill();
      });
      grid();

      const pts = stars.map((s) => ({ s, ...place(s) }));
      // Constellation des idées du jour, tracée progressivement à l'ouverture
      const chain = ideas.map((tk) => pts.find((p) => p.s.o.ticker === tk)).filter(Boolean);
      const draw = reduce ? 1 : Math.min(1, Math.max(0, (t - 0.4) / 2.2));
      if (chain.length > 1) {
        ctx.strokeStyle = rgba(PEACH, 0.55); ctx.lineWidth = 1;
        const segs = chain.length - 1, upto = draw * segs;
        ctx.beginPath(); ctx.moveTo(chain[0].x, chain[0].y);
        for (let i = 1; i <= segs; i++) {
          const f = Math.min(1, Math.max(0, upto - (i - 1)));
          if (f <= 0) break;
          ctx.lineTo(chain[i - 1].x + (chain[i].x - chain[i - 1].x) * f, chain[i - 1].y + (chain[i].y - chain[i - 1].y) * f);
        }
        ctx.stroke();
      }
      // Étoiles
      hover = null; let best = 18;
      pts.forEach((p) => {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (d < best) { best = d; hover = p; }
      });
      pts.forEach((p) => {
        const { s } = p;
        const fade = p.x < W * 0.46 ? 0.45 : 1; // plus discret sous le texte
        const tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * s.speed + s.phase);
        const r = 0.8 + s.fy * 2.6 + (s.idea ? 1.4 : 0);
        const a = (0.25 + s.fy * 0.6) * tw * fade;
        const col = s.idea ? GREEN.map((c, i) => Math.round(c * 0.35 + PEACH[i] * 0.65)) : PEACH;
        if (s.idea || p === hover) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 7);
          g.addColorStop(0, rgba(col, 0.35 * tw)); g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 7, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = rgba(col, Math.min(1, a + (s.idea ? 0.3 : 0)));
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        if (s.idea && draw >= 1) {
          ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.textAlign = "left"; ctx.fillStyle = rgba(PEACH, 0.7);
          ctx.fillText(s.o.ticker.split(".")[0], p.x + r + 6, p.y + 3);
        }
      });
      // Étiquette de survol
      if (hover) {
        const o = hover.s.o, lines = [o.name, `score ${o.score} / ${o.chg1m > 0 ? "+" : ""}${o.chg1m.toFixed(1).replace(".", ",")} % sur 1 mois`];
        ctx.font = "500 13px 'Instrument Sans', sans-serif";
        const w = Math.max(ctx.measureText(lines[0]).width, 170) + 20;
        let bx = hover.x + 14, by = hover.y - 46;
        if (bx + w > W - 8) bx = hover.x - w - 14;
        if (by < 8) by = hover.y + 14;
        ctx.fillStyle = "rgba(243,206,187,0.96)"; ctx.fillRect(bx, by, w, 42);
        ctx.fillStyle = "#1e1b1a"; ctx.textAlign = "left"; ctx.fillText(lines[0], bx + 10, by + 17);
        ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.fillStyle = "#7d6359"; ctx.fillText(lines[1], bx + 10, by + 32);
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
    const onClick = (e) => {
      if (e.target.closest("a,button")) return;
      if (hover && onPick) onPick(hover.s.o.ticker);
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("click", onClick);
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
      host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave); host.removeEventListener("click", onClick);
    };
  }

  window.Sky = { mount };
})();
