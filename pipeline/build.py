"""
Mise à jour quotidienne de Pyxis.

    python -m pipeline.build

Étapes : prix -> contrôles -> indicateurs -> fondamentaux -> macro -> score
-> fichiers JSON dans site/data/, que le site lit directement.
Lancé automatiquement chaque soir de semaine par GitHub Actions.
"""
from __future__ import annotations

import json
import logging
import math
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import yaml

from . import indicators, macro, quality, scoring, sources

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "pipeline" / "config.yaml"
CACHE = ROOT / "pipeline" / "cache" / "fundamentals.json"
OUT = ROOT / "site" / "data"
MIN_SUCCESS_RATIO = 0.5  # sous ce taux de réussite, on garde les données de la veille

log = logging.getLogger("pyxis")
CURRENCY_BY_SUFFIX = {"AS": "EUR", "PA": "EUR", "DE": "EUR", "MC": "EUR", "MI": "EUR", "CO": "DKK", "SW": "CHF", "L": "GBp"}
COUNTRY_BY_SUFFIX = {"AS": "Pays-Bas", "PA": "France", "DE": "Allemagne", "MC": "Espagne", "MI": "Italie",
                     "CO": "Danemark", "SW": "Suisse", "L": "Royaume-Uni"}
COUNTRY_FR = {"United States": "États-Unis", "France": "France", "Germany": "Allemagne", "Spain": "Espagne",
              "Netherlands": "Pays-Bas", "Switzerland": "Suisse", "United Kingdom": "Royaume-Uni", "Italy": "Italie",
              "Denmark": "Danemark", "Taiwan": "Taïwan", "Ireland": "Irlande"}


def clean(o):
    """Rend un objet sérialisable en JSON : NaN -> null, flottants arrondis."""
    if isinstance(o, float):
        return None if math.isnan(o) or math.isinf(o) else round(o, 4)
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [clean(v) for v in o]
    if hasattr(o, "item"):  # nombres numpy
        return clean(o.item())
    return o


def write_json(name: str, data) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(clean(data), ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def load_config() -> dict:
    cfg = yaml.safe_load(CONFIG.read_text(encoding="utf-8"))
    tickers, groups = [], {}
    for group, items in (cfg.get("universe") or {}).items():
        for t in items or []:
            if t not in groups:
                tickers.append(t)
                groups[t] = group
    for t in cfg.get("watchlist") or []:
        if t not in groups:
            tickers.append(t)
            groups[t] = "watchlist"
    cfg["_tickers"], cfg["_groups"] = tickers, groups
    return cfg


def load_fundamentals(tickers: list[str], max_age_days: int, fetch=sources.fundamentals_yahoo) -> dict[str, dict]:
    cache = {}
    if CACHE.exists():
        try:
            cache = json.loads(CACHE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            log.warning("Cache des fondamentaux illisible : on repart de zéro.")
    now = datetime.now(timezone.utc)
    for t in tickers:
        entry = cache.get(t)
        age = (now - datetime.fromisoformat(entry["fetched"])).days if entry and entry.get("fetched") else 999
        if age < max_age_days:
            continue
        data = fetch(t)
        if data:
            cache[t] = {"fetched": now.isoformat(), "data": data}
        time.sleep(0.4)  # politesse envers Yahoo
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(clean(cache), ensure_ascii=False, indent=0), encoding="utf-8")
    return {t: (cache.get(t) or {}).get("data") or {} for t in tickers}


def weekly_history(df: pd.DataFrame, years: int = 3) -> dict:
    """Cours de clôture hebdomadaires (vendredi), pour les comparaisons du journal et les graphiques."""
    c = pd.to_numeric(df["Close"], errors="coerce").dropna()
    c = c[c.index >= c.index[-1] - pd.DateOffset(years=years)]
    w = c.resample("W-FRI").last().dropna()
    return {"start": w.index[0].strftime("%Y-%m-%d"), "closes": [round(float(x), 4) for x in w.values]}


def run(price_fetch=sources.prices_yahoo, stooq_fetch=sources.prices_stooq,
        fund_fetch=sources.fundamentals_yahoo, fred_fetch=sources.fred_series) -> int:
    started = datetime.now(timezone.utc)
    cfg = load_config()
    tickers, groups, names = cfg["_tickers"], cfg["_groups"], cfg.get("names") or {}
    log.info("Univers : %s titres", len(tickers))

    # 1. Prix, avec Stooq en secours
    prices = price_fetch(tickers)
    used_stooq = []
    for t in tickers:
        if t not in prices:
            df = stooq_fetch(t)
            if df is not None and not df.empty:
                prices[t] = df
                used_stooq.append(t)

    # 2. Contrôles et indicateurs
    recs, failed, warnings = {}, [], []
    for t in tickers:
        chk = quality.check_prices(prices.get(t))
        if not chk.ok:
            failed.append({"ticker": t, "reason": "; ".join(chk.blocking)})
            continue
        warnings += [{"ticker": t, "note": w} for w in chk.warnings]
        try:
            recs[t] = {"ticker": t, **indicators.compute_all(prices[t])}
        except Exception as e:  # une erreur sur un titre ne doit pas tout arrêter
            failed.append({"ticker": t, "reason": f"calcul impossible : {e}"})

    ok_ratio = len(recs) / max(1, len(tickers))
    if ok_ratio < MIN_SUCCESS_RATIO:
        log.error("Seulement %.0f %% des titres récupérés : on garde les données précédentes.", ok_ratio * 100)
        write_json("meta.json", {"generated_at": started.isoformat(), "status": "echec",
                                 "message": "Les sources de données n'ont pas répondu correctement. Les données affichées sont celles de la dernière mise à jour réussie.",
                                 "ok": len(recs), "total": len(tickers), "failed": failed})
        return 1

    # 3. Fondamentaux (cache de quelques jours)
    funds = load_fundamentals(list(recs), cfg.get("fundamentals_max_age_days", 7), fund_fetch)
    for t, r in recs.items():
        f = dict(funds.get(t) or {})
        for note in quality.check_fundamentals(f):
            warnings.append({"ticker": t, "note": note})
        suffix = t.rsplit(".", 1)[1] if "." in t else ""
        is_etf = groups.get(t) == "etf" or f.get("kind") == "ETF"
        r.update({k: f.get(k) for k in ("pe", "forward_pe", "pb", "margin", "op_margin", "roe", "debt_to_equity",
                                         "fcf", "market_cap", "dividend_yield", "revenue_growth", "expense_ratio")})
        r["name"] = names.get(t) or f.get("name") or t
        r["kind"] = "ETF" if is_etf else "EQUITY"
        r["sector"] = "ETF" if is_etf else macro.SECTOR_FR.get(f.get("sector") or "", f.get("sector"))
        r["country"] = COUNTRY_FR.get(f.get("country") or "", f.get("country")) or COUNTRY_BY_SUFFIX.get(suffix, "États-Unis" if not suffix else None)
        r["currency"] = f.get("currency") or CURRENCY_BY_SUFFIX.get(suffix, "USD")
        r["group"] = groups.get(t)

    # 4. Macro
    series = {k: fred_fetch(v) for k, v in (cfg.get("macro") or {}).items()}
    mac = macro.build_macro(series)
    for r in recs.values():
        r["macro_fit"] = 55 if r["kind"] == "ETF" else macro.sector_fit(mac["phase"], r.get("sector"))

    # 5. Score
    scored = scoring.score_universe(recs)
    ideas = scoring.pick_ideas(scored)
    as_of = max(pd.Timestamp(prices[t].index[-1]) for t in recs).strftime("%Y-%m-%d")

    write_json("universe.json", {"generated_at": started.isoformat(), "as_of": as_of,
                                 "benchmark": cfg.get("benchmark"), "ideas": ideas,
                                 "watchlist": cfg.get("watchlist") or [], "items": scored})
    write_json("macro.json", {"generated_at": started.isoformat(), **mac})
    write_json("history.json", {t: weekly_history(prices[t]) for t in recs})
    write_json("meta.json", {"generated_at": started.isoformat(), "as_of": as_of, "status": "ok" if not failed else "partiel",
                             "ok": len(recs), "total": len(tickers), "failed": failed, "warnings": warnings[:60],
                             "sources": {"prix": "Yahoo Finance" + (f" (+ Stooq pour {len(used_stooq)} titres)" if used_stooq else ""),
                                         "fondamentaux": "Yahoo Finance (cache de quelques jours)", "macro": "FRED"},
                             "macro_ok": sum(s is not None for s in series.values()), "macro_total": len(series),
                             "duration_s": round((datetime.now(timezone.utc) - started).total_seconds())})
    log.info("Terminé : %s/%s titres, %s idées, phase %s.", len(recs), len(tickers), len(ideas), mac["phase"])
    return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    sys.exit(run())
