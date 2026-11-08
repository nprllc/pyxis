/* =========================================================================
   Ton compte Pyxis : connexion par code reçu par e-mail, session gardée,
   et synchronisation de tes données entre appareils (profil, portefeuille,
   journal, progression, réglages et clé de Pyxis).

   Service : Supabase (gratuit), configuré dans js/cloud-config.js.
   Les données sont dans une seule ligne par compte, protégée par les règles
   d'accès de la base : chacun ne lit et n'écrit que la sienne.
   ========================================================================= */
(function () {
  const CFG = window.PYXIS_CLOUD || {};
  const PREFIX = "investlab.", SYNCED = "pyxis.synced";
  let sb = null, user = null, timer = null, listeners = [];

  const configured = () => !!(CFG.url && CFG.anonKey);
  const available = () => configured() && !!window.supabase?.createClient;
  const notify = () => listeners.forEach((f) => { try { f(); } catch {} });

  function localData() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(PREFIX)) out[k] = localStorage.getItem(k); }
    return out;
  }
  function apply(data) {
    Object.keys(localData()).forEach((k) => { if (!(k in data)) localStorage.removeItem(k); });
    Object.entries(data || {}).forEach(([k, v]) => { if (k.startsWith(PREFIX) && typeof v === "string") localStorage.setItem(k, v); });
  }

  async function push() {
    if (!user) return;
    const now = new Date().toISOString();
    const { error } = await sb.from("user_data").upsert({ user_id: user.id, data: localData(), updated_at: now });
    if (error) throw error;
    localStorage.setItem(SYNCED, now);
    notify();
  }
  /* Récupère la version en ligne. Renvoie true si elle a remplacé les données de cet appareil. */
  async function pull() {
    const { data, error } = await sb.from("user_data").select("data, updated_at").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (!data) { await push(); return false; }            // premier appareil : on envoie ce qu'il y a ici
    const last = localStorage.getItem(SYNCED) || "";
    if (data.updated_at > last) { apply(data.data); localStorage.setItem(SYNCED, data.updated_at); return true; }
    return false;
  }

  async function init() {
    if (!available()) return;
    sb = window.supabase.createClient(CFG.url, CFG.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "pyxis.auth" },
    });
    const { data } = await sb.auth.getSession();
    user = data.session?.user || null;
    sb.auth.onAuthStateChange((_e, s) => { user = s?.user || null; notify(); });
    if (user) {
      try { if (await pull()) { location.reload(); return new Promise(() => {}); } } catch (e) { console.warn("Synchronisation impossible :", e.message); }
    }
    // Quand on revient sur l'onglet, on regarde si l'autre appareil a changé quelque chose.
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "visible" && user) { try { if (await pull()) location.reload(); } catch {} }
    });
  }

  function changed() {
    if (!user) return;
    clearTimeout(timer);
    timer = setTimeout(() => push().catch((e) => console.warn("Envoi impossible :", e.message)), 1200);
  }

  async function sendCode(email) {
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
  }
  async function verify(email, token) {
    const { data, error } = await sb.auth.verifyOtp({ email, token: token.replace(/\s/g, ""), type: "email" });
    if (error) throw error;
    user = data.user;
    return pull();       // true : les données du compte ont remplacé celles de cet appareil
  }
  async function signOut() { await sb.auth.signOut(); user = null; localStorage.removeItem(SYNCED); notify(); }

  window.PyxisSync = {
    configured, available, init, changed, sendCode, verify, signOut, push,
    user: () => user,
    lastSync: () => localStorage.getItem(SYNCED),
    onChange: (f) => listeners.push(f),
  };
})();
