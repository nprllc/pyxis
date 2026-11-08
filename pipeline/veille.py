"""Relais de la veille du matin.

La veille est d'abord écrite par la tâche Claude planifiée (abonnement de Nico), qui pousse
site/data/brief.json vers 7 h. Ce script tourne plus tard dans la matinée sur GitHub et ne fait
rien si cette veille du jour est déjà là. Sinon :

  1. il récupère les articles récents des sources de référence (flux RSS listés dans config.yaml) ;
  2. si une clé d'API est configurée pour l'un des modèles de `veille.providers`, il demande à ce
     modèle de rédiger le digest (même format que la veille Claude), en ne citant que les liens
     récupérés à l'étape 1 ; les modèles sont essayés dans l'ordre, le suivant prend le relais si
     l'un échoue ;
  3. sinon, il publie une revue de presse : les titres et liens, classés par thème, sans résumé.

Changer de modèle = modifier `veille.providers` dans config.yaml et ajouter la clé dans les
secrets du dépôt (Settings > Secrets and variables > Actions).
"""
from __future__ import annotations

import html
import json
import logging
import os
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
import yaml

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site" / "data"
MADRID = ZoneInfo("Europe/Madrid")
UA = "Mozilla/5.0 (compatible; PyxisVeille/1.0; +https://github.com/nprllc/pyxis)"
log = logging.getLogger("veille")

THEMES = [
    ("Banques centrales et taux", r"\b(ecb|bce|fed|federal reserve|central bank|banque centrale|rate[s]?|taux|lagarde|powell|bond|yield|obligat|monetary|monétaire)\b"),
    ("Économie", r"\b(inflation|cpi|gdp|pib|jobs|payroll|emploi|chômage|unemployment|growth|croissance|recession|récession|pmi|consum|tariff|droits de douane)\b"),
    ("Entreprises et secteurs", r"\b(earnings|results|résultats|revenue|chiffre d'affaires|profit|bénéfice|guidance|ipo|merger|acquisition|rachat|buyback|ceo)\b"),
]
FALLBACK_THEME = "Marchés"
# Pour les flux généralistes (filter: true) : on ne garde que ce qui parle de marchés ou d'économie.
FINANCE = r"\b(bourse|march[ée]s?|action[s]?|indice|cac|ibex|dax|s&p|nasdaq|dow|stocks?|shares?|markets?|investi\w*|épargne|etf|banque|bank)\b"


# --------------------------------------------------------------------------- collecte
def _text(el, *names):
    for n in names:
        x = el.find(n)
        if x is not None and (x.text or "").strip():
            return x.text.strip()
    return ""


def _clean(s: str, n: int = 400) -> str:
    s = re.sub(r"<[^>]+>", " ", html.unescape(s or ""))
    s = re.sub(r"\s+", " ", s).strip()
    return s[:n]


def _date(s: str):
    if not s:
        return None
    try:
        d = parsedate_to_datetime(s)
    except Exception:
        try:
            d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def parse_feed(xml_text: str, source: dict) -> list[dict]:
    """Lit un flux RSS 2.0 ou Atom et renvoie une liste d'articles."""
    root = ET.fromstring(xml_text)
    atom = "{http://www.w3.org/2005/Atom}"
    items = root.findall(".//item") or root.findall(f".//{atom}entry")
    out = []
    for it in items:
        title = _clean(_text(it, "title", f"{atom}title"), 220)
        link = _text(it, "link")
        if not link:
            l = it.find(f"{atom}link")
            link = l.get("href", "") if l is not None else ""
        if not title or not link.startswith("http"):
            continue
        out.append({
            "title": title,
            "url": link.strip(),
            "summary": _clean(_text(it, "description", f"{atom}summary", f"{atom}content")),
            "date": _date(_text(it, "pubDate", f"{atom}updated", f"{atom}published", "{http://purl.org/dc/elements/1.1/}date")),
            "source": source["name"],
            "lang": source.get("lang", "en"),
        })
    return out


def collect(feeds: list[dict], now: datetime, fetch=None) -> list[dict]:
    fetch = fetch or (lambda url: requests.get(url, headers={"User-Agent": UA}, timeout=20))
    hours = 78 if now.astimezone(MADRID).weekday() == 0 else 30   # le lundi, on reprend le week-end
    since = now - timedelta(hours=hours)
    seen, arts = set(), []
    for f in feeds:
        try:
            r = fetch(f["url"])
            r.raise_for_status()
            got = parse_feed(r.text, f)
            log.info("%-28s %3d articles", f["name"], len(got))
        except Exception as e:
            log.warning("%-28s indisponible (%s)", f["name"], e)
            continue
        for a in got:
            if a["date"] and a["date"] < since:
                continue
            if f.get("filter"):
                t = (a["title"] + " " + a["summary"]).lower()
                if not re.search(FINANCE, t) and not any(re.search(rx, t) for _, rx in THEMES):
                    continue
            if "/m-perso/" in a["url"] or "/video" in a["url"]:   # conseils perso, vidéos : hors sujet ici
                continue
            key = re.sub(r"\W+", "", a["title"].lower())[:80]
            if key in seen:
                continue
            seen.add(key)
            arts.append(a)
    arts.sort(key=lambda a: a["date"] or since, reverse=True)
    return arts


def theme_of(a: dict) -> str:
    t = (a["title"] + " " + a["summary"]).lower()
    for name, rx in THEMES:
        if re.search(rx, t):
            return name
    return FALLBACK_THEME


# --------------------------------------------------------------------------- contexte Pyxis
def market_context() -> str:
    """Quelques chiffres Pyxis du jour, pour que le modèle relie l'actualité au site."""
    lines = []
    try:
        u = json.loads((DATA / "universe.json").read_text())
        items = u.get("items", u)
        d = [o.get("chg1d") for o in items if o.get("chg1d") is not None]
        if d:
            up = sum(1 for x in d if x > 0)
            lines.append(f"Dernière séance : {up} titres suivis en hausse sur {len(d)}.")
        w = next((o for o in items if o.get("ticker") == "EUNL.DE"), None)
        if w and w.get("chg1d") is not None:
            lines.append(f"ETF MSCI World (EUNL) : {w['chg1d']:+.2f} % sur la séance, {w.get('chg1m', 0):+.1f} % sur un mois.")
    except Exception:
        pass
    try:
        m = json.loads((DATA / "macro.json").read_text())
        lines.append(f"Phase économique estimée par Pyxis : {m.get('phase')}.")
        for i in m.get("indicators", [])[:4]:
            lines.append(f"{i['label']} : {i['value']} ({i['trend']}).")
    except Exception:
        pass
    return "\n".join(lines)


# --------------------------------------------------------------------------- modèles
PROMPT = """Tu écris la veille du matin de Pyxis, un site qui apprend à investir à un débutant français
résident en Espagne (ETF monde, quelques actions, pas de crypto). Écris en français simple,
explique chaque terme technique entre parenthèses, reste factuel et prudent, sans conseil personnalisé.

Utilise UNIQUEMENT les articles ci-dessous. Chaque point doit citer 1 ou 2 de leurs liens, recopiés
à l'identique. N'invente aucun chiffre qui n'y figure pas. Écris les nombres à la française (2,5 %).

Réponds avec un seul objet JSON, sans texte autour, de cette forme :
{{"headline": "une phrase", "summary": "un paragraphe de 4 à 6 phrases",
 "sections": [{{"title": "Marchés mondiaux | Taux et banques centrales | Entreprises et secteurs | Europe et Espagne",
               "points": [{{"text": "…", "sources": [{{"name": "…", "url": "…"}}]}}]}}],
 "for_you": ["2 à 4 phrases : ce que ça change pour quelqu'un qui investit 100 € par mois dans un ETF monde"]}}

Chiffres Pyxis du jour :
{context}

Articles ({n}) :
{articles}
"""


def _post(url, headers, body, timeout=120):
    r = requests.post(url, headers={"Content-Type": "application/json", **headers}, json=body, timeout=timeout)
    r.raise_for_status()
    return r.json()


def call_model(p: dict, prompt: str) -> str:
    """Appelle un modèle. Fournisseurs gérés : anthropic, openai, mistral, gemini, et tout service
    compatible OpenAI (provider: openai-compatible + base_url)."""
    key = os.environ.get(p["key_env"], "")
    if not key:
        raise RuntimeError(f"pas de clé {p['key_env']}")
    kind, model = p["provider"], p["model"]
    if kind == "anthropic":
        j = _post("https://api.anthropic.com/v1/messages", {"x-api-key": key, "anthropic-version": "2023-06-01"},
                  {"model": model, "max_tokens": 6000, "messages": [{"role": "user", "content": prompt}]})
        return "".join(b.get("text", "") for b in j.get("content", []))
    if kind == "gemini":
        j = _post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", {"x-goog-api-key": key},
                  {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json"}})
        return j["candidates"][0]["content"]["parts"][0]["text"]
    base = {"openai": "https://api.openai.com/v1", "mistral": "https://api.mistral.ai/v1"}.get(kind) or p.get("base_url")
    if not base:
        raise RuntimeError(f"fournisseur inconnu : {kind}")
    j = _post(f"{base.rstrip('/')}/chat/completions", {"Authorization": f"Bearer {key}"},
              {"model": model, "messages": [{"role": "user", "content": prompt}], "response_format": {"type": "json_object"}})
    return j["choices"][0]["message"]["content"]


def validate(raw: str, allowed: set[str]) -> dict | None:
    """Garde le digest seulement s'il est complet, et retire tout lien qui ne vient pas des articles fournis."""
    m = re.search(r"\{.*\}", raw, re.S)
    if not m:
        return None
    try:
        b = json.loads(m.group(0))
    except json.JSONDecodeError:
        return None
    if not isinstance(b.get("headline"), str) or not isinstance(b.get("summary"), str):
        return None
    secs = []
    for s in b.get("sections") or []:
        pts = []
        for p in s.get("points") or []:
            src = [x for x in (p.get("sources") or []) if isinstance(x, dict) and x.get("url") in allowed]
            if isinstance(p.get("text"), str) and src:     # un point sans source vérifiable est écarté
                pts.append({"text": p["text"].strip(), "sources": src[:2]})
        if pts:
            secs.append({"title": str(s.get("title", "Marchés"))[:60], "points": pts})
    if sum(len(s["points"]) for s in secs) < 4:
        return None
    return {"headline": b["headline"].strip(), "summary": b["summary"].strip(), "sections": secs,
            "for_you": [x for x in (b.get("for_you") or []) if isinstance(x, str)][:4]}


def press_review(arts: list[dict]) -> dict:
    """Revue de presse sans IA : les titres et les liens, classés par thème."""
    groups: dict[str, list] = {}
    for a in arts:
        groups.setdefault(theme_of(a), []).append(a)
    order = [t for t, _ in THEMES] + [FALLBACK_THEME]
    secs = [{"title": t, "points": [{"text": a["title"] + (" (en anglais)" if a["lang"] == "en" else ""),
                                     "sources": [{"name": a["source"], "url": a["url"]}]} for a in groups[t][:8]]}
            for t in order if groups.get(t)]
    return {
        "headline": "Revue de presse du matin",
        "summary": "La synthèse rédigée n'a pas pu être produite ce matin. Voici les derniers titres des sources de référence, "
                   "classés par thème : clique sur un titre pour lire l'article.",
        "sections": secs, "for_you": [],
    }


# --------------------------------------------------------------------------- orchestration
def run(cfg: dict, now: datetime | None = None, fetch=None, model_call=call_model, force: bool = False, dry: bool = False) -> str:
    now = now or datetime.now(timezone.utc)
    today = now.astimezone(MADRID).date().isoformat()
    path = DATA / "brief.json"
    try:
        current = json.loads(path.read_text())
    except Exception:
        current = {}
    if current.get("date") == today and current.get("mode", "digest") == "digest" and not force:
        log.info("La veille du jour est déjà là (%s) : rien à faire.", current.get("author", "Claude"))
        return "skip"
    vc = cfg.get("veille", {})
    arts = collect(vc.get("feeds", []), now, fetch)
    if len(arts) < 5:
        log.warning("Trop peu d'articles (%d) : on garde la veille précédente.", len(arts))
        return "none"
    allowed = {a["url"] for a in arts}
    listing = "\n".join(f"- [{a['source']}] {a['title']} — {a['summary'][:240]} — {a['url']}" for a in arts[:60])
    prompt = PROMPT.format(context=market_context(), n=min(60, len(arts)), articles=listing)
    brief, author, mode = None, "Revue automatique (sans IA)", "press"
    for p in vc.get("providers", []):
        try:
            brief = validate(model_call(p, prompt), allowed)
            if brief:
                author, mode = f"{p.get('label', p['provider'])} ({p['model']}), relais automatique", "digest"
                break
            log.warning("%s : réponse incomplète, on passe au suivant.", p["provider"])
        except Exception as e:
            log.warning("%s : %s", p["provider"], e)
    brief = brief or press_review(arts)
    out = {"date": today, "generated_at": now.astimezone(MADRID).isoformat(timespec="seconds"),
           "mode": mode, "author": author, **brief, "houses": [], "glossary": []}
    if dry:  # essai : on montre ce qui serait publié, sans rien écrire
        print(json.dumps(out, ensure_ascii=False, indent=1)[:4000])
        return mode
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    log.info("Veille écrite : %s, %d points.", author, sum(len(s["points"]) for s in out["sections"]))
    return mode


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    cfg = yaml.safe_load((ROOT / "pipeline" / "config.yaml").read_text())
    sys.exit(0 if run(cfg, force="--force" in sys.argv or "--dry" in sys.argv, dry="--dry" in sys.argv) else 1)
