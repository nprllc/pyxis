/* =========================================================================
   Le pouls du marché — un relief de lignes de niveau dessiné en WebGL.
   Plus le marché est agité (volatilité), plus le relief se tord et bouge vite.
   La tendance incline le terrain. Le curseur creuse une petite vallée.
   Sans WebGL 2 ou avec « réduire les animations », une image fixe est dessinée.
   ========================================================================= */
(function () {
  const VERT = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

  const FRAG = `#version 300 es
  precision highp float;
  uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uVol; uniform float uTrend;
  out vec4 outColor;
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes.y;
    float t = uTime * (0.025 + 0.06 * uVol);
    vec2 q = vec2(fbm(uv * 1.4 + t), fbm(uv * 1.4 - t + 3.1));
    float h = fbm(uv * 1.7 + q * (0.9 + 1.6 * uVol) + vec2(t * 0.6, 0.0));
    h += uTrend * (uv.x / (uRes.x / uRes.y) - 0.5) * 0.35;           // la tendance incline le terrain
    vec2 m = uMouse / uRes.y;
    h -= 0.16 * exp(-9.0 * dot(uv - m, uv - m));                        // le curseur creuse une vallée
    float k = h * 22.0;
    float w = fwidth(k);
    float line = 1.0 - smoothstep(0.0, w * 1.2, 0.5 - abs(fract(k) - 0.5));
    float k5 = k / 5.0, w5 = fwidth(k5);
    float major = 1.0 - smoothstep(0.0, w5 * 1.8, 0.5 - abs(fract(k5) - 0.5));
    vec3 ink = vec3(0.118, 0.106, 0.102);
    vec3 peach = vec3(0.953, 0.808, 0.733);
    float fade = smoothstep(0.0, 0.9, gl_FragCoord.x / uRes.x) * 0.75 + 0.25; // plus calme à gauche, sous le texte
    vec3 col = ink + peach * (0.10 * line + 0.22 * major) * fade;
    outColor = vec4(col, 1.0);
  }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  /** Monte le relief dans un canvas. Renvoie une fonction pour l'arrêter. */
  function mount(canvas, { vol = 0.5, trend = 0 } = {}) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) { canvas.style.background = "radial-gradient(80% 90% at 80% 30%, #3d3634, #1e1b1a)"; return () => {}; }
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { console.warn("Pouls du marché indisponible :", e); return () => {}; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(prog, n);
    const uRes = U("uRes"), uTime = U("uTime"), uMouse = U("uMouse"), uVol = U("uVol"), uTrend = U("uTrend");

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let mouse = [-9999, -9999], target = [-9999, -9999], raf = 0, visible = true, alive = true;
    const t0 = performance.now();

    function size() {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function frame(now) {
      if (!alive) return;
      mouse[0] += (target[0] - mouse[0]) * 0.08; mouse[1] += (target[1] - mouse[1]) * 0.08;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 12.0 : (now - t0) / 1000);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.uniform1f(uVol, vol); gl.uniform1f(uTrend, trend);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    }
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      target = [(e.clientX - r.left) * dpr, (r.bottom - e.clientY) * dpr];
      if (mouse[0] < -9000) mouse = target.slice();
    };
    const onLeave = () => { target = [-9999, -9999]; };
    const host = canvas.parentElement;
    host.addEventListener("pointermove", onMove); host.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(() => { size(); if (reduce) frame(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting; cancelAnimationFrame(raf);
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    size(); raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave); };
  }

  window.Pulse = { mount };
})();
