"""
Score provisoire (étape 3) : chaque titre est classé par rapport aux autres
sur cinq facteurs, puis on fait une moyenne pondérée.

Rang en percentile = « meilleur que X % des autres titres de l'univers ».
C'est robuste aux valeurs extrêmes et facile à expliquer.

À l'étape 4, le backtest viendra calibrer la fourchette d'incertitude et les
scénarios. En attendant, la fourchette reflète seulement les données manquantes
et le désaccord entre facteurs : elle est volontairement large.
"""
from __future__ import annotations

import math
from statistics import median, pstdev

WEIGHTS = {"valuation": 25, "quality": 25, "momentum": 20, "risk": 15, "macro": 15}
FACTOR_FR = {"valuation": "la valorisation", "quality": "la solidité de l'entreprise", "momentum": "la tendance",
             "risk": "la stabilité du cours", "macro": "le contexte économique"}
CORE_ETFS = {"EUNL.DE", "VWCE.DE"}


def _num(v):
    return v if isinstance(v, (int, float)) and not (isinstance(v, float) and math.isnan(v)) else None


def percentile_ranks(values: dict[str, float | None], higher_is_better: bool = True) -> dict[str, float]:
    """Rang de 0 à 100 de chaque titre (les valeurs manquantes sont ignorées)."""
    items = [(k, v) for k, v in values.items() if _num(v) is not None]
    if len(items) < 2:
        return {k: 50.0 for k, _ in items}
    items.sort(key=lambda kv: kv[1], reverse=not higher_is_better)
    n = len(items)
    ranks: dict[str, float] = {}
    i = 0
    while i < n:  # les ex aequo reçoivent le même rang
        j = i
        while j + 1 < n and items[j + 1][1] == items[i][1]:
            j += 1
        r = ((i + j) / 2) / (n - 1) * 100
        for k in range(i, j + 1):
            ranks[items[k][0]] = r
        i = j + 1
    return ranks


def _avg(parts: list[float | None]) -> float | None:
    p = [x for x in parts if x is not None]
    return sum(p) / len(p) if p else None


def factor_scores(recs: dict[str, dict]) -> dict[str, dict[str, float | None]]:
    """Calcule les 5 facteurs pour chaque titre. Actions et ETF sont classés séparément."""
    out: dict[str, dict[str, float | None]] = {t: {} for t in recs}
    groups = {
        "stock": [t for t, r in recs.items() if r.get("kind") != "ETF"],
        "etf": [t for t, r in recs.items() if r.get("kind") == "ETF"],
    }
    for g, tickers in groups.items():
        if not tickers:
            continue
        sub = {t: recs[t] for t in tickers}
        col = lambda key: {t: _num(r.get(key)) for t, r in sub.items()}

        # PER rapporté à la médiane de son secteur : un PER de 30 est cher pour une banque, pas pour un logiciel.
        by_sector: dict[str, list[float]] = {}
        for t, r in sub.items():
            if _num(r.get("pe")) is not None:
                by_sector.setdefault(r.get("sector") or "?", []).append(r["pe"])
        sector_med = {s: median(v) for s, v in by_sector.items() if len(v) >= 3}
        for t, r in sub.items():
            r["pe_sector"] = round(sector_med[r.get("sector") or "?"], 1) if (r.get("sector") or "?") in sector_med else None
        rel_pe = {t: (r["pe"] / r["pe_sector"]) if _num(r.get("pe")) and r.get("pe_sector") else None for t, r in sub.items()}
        fcf_yield = {t: (r["fcf"] / r["market_cap"]) if _num(r.get("fcf")) and _num(r.get("market_cap")) else None for t, r in sub.items()}
        neg_debt = {t: (-r["debt_to_equity"]) if _num(r.get("debt_to_equity")) is not None else None for t, r in sub.items()}

        pr = percentile_ranks
        v_pe, v_rel, v_fcf, v_pb = pr(col("pe"), False), pr(rel_pe, False), pr(fcf_yield), pr(col("pb"), False)
        q_m, q_roe, q_debt, q_op = pr(col("margin")), pr(col("roe")), pr(neg_debt), pr(col("op_margin"))
        m_12, m_200, m_3 = pr(col("mom12_1")), pr(col("dist_ma200")), pr(col("chg3m"))
        r_vol, r_dd, r_atr = pr(col("vol"), False), pr(col("maxdd_1y")), pr(col("atr_pct"), False)

        for t, r in sub.items():
            f = out[t]
            f["valuation"] = _avg([v_pe.get(t), v_rel.get(t), v_fcf.get(t), v_pb.get(t)])
            f["quality"] = _avg([q_m.get(t), q_roe.get(t), q_debt.get(t), q_op.get(t)])
            if g == "etf":  # un ETF large est diversifié par construction
                f["quality"] = 70.0 if f["quality"] is None else f["quality"]
                f["valuation"] = f["valuation"] if f["valuation"] is not None else 50.0
            f["momentum"] = _avg([m_12.get(t), m_200.get(t), m_3.get(t)])
            f["risk"] = _avg([r_vol.get(t), r_dd.get(t), r_atr.get(t)])
            f["macro"] = float(r.get("macro_fit", 50))
    return out


def composite(f: dict[str, float | None]) -> tuple[int, int, int, list[str]]:
    """Score global, bornes basse et haute, et facteurs manquants."""
    avail = {k: v for k, v in f.items() if v is not None}
    missing = [k for k in WEIGHTS if k not in avail]
    if not avail:
        return 50, 30, 70, missing
    w = sum(WEIGHTS[k] for k in avail)
    score = sum(WEIGHTS[k] * v for k, v in avail.items()) / w
    # Incertitude provisoire : base + données manquantes + désaccord entre facteurs.
    spread = pstdev(avail.values()) if len(avail) > 1 else 20
    half = 6 + 5 * len(missing) + 0.15 * spread
    lo, hi = max(0, score - half), min(100, score + half * 0.8)
    return round(score), round(lo), round(hi), missing


def classify(r: dict, f: dict) -> str:
    """Type de signal, avec des règles explicites (voir README)."""
    if r.get("ticker") in CORE_ETFS:
        return "coeur"
    if r.get("kind") == "ETF":
        return "neutre"
    d52, q = _num(r.get("dist_52w_high")), f.get("quality")
    ma20, chg1m, rsi = _num(r.get("dist_ma20")), _num(r.get("chg1m")), _num(r.get("rsi"))
    fcf_ok = (_num(r.get("fcf")) or 0) > 0
    fell = d52 is not None and d52 <= -20
    stabilizing = ma20 is not None and ma20 > 0 and (rsi or 0) >= 35
    accelerating_down = chg1m is not None and chg1m < -8 and (ma20 or 0) < -5
    if fell and (q is not None and q < 40 or accelerating_down and (q or 0) < 60):
        return "couteau"
    if fell and q is not None and q >= 66 and fcf_ok and stabilizing:
        return "valeur"
    if fell and (q or 0) >= 50:
        return "contrarian"
    vr = _num(r.get("volume_ratio"))
    if vr is not None and vr >= 2:
        return "anomalie"
    if (f.get("momentum") or 0) >= 75 and (_num(r.get("dist_ma200")) or -1) > 0 and (rsi or 50) < 75:
        return "momentum"
    return "neutre"


def _p(v: float, d: int = 0) -> str:
    return f"{v:.{d}f}".replace(".", ",")


def thesis(r: dict, f: dict, kind: str) -> str:
    d52, chg12, vr, chg1m = _num(r.get("dist_52w_high")), _num(r.get("chg12m")), _num(r.get("volume_ratio")), _num(r.get("chg1m"))
    if kind == "coeur":
        return "Le cœur de portefeuille : des centaines d'entreprises en une seule ligne, avec des frais bas."
    if kind == "valeur":
        return f"Recul de {_p(abs(d52))} % depuis son plus haut, alors que l'entreprise reste parmi les plus solides de l'univers et que le cours se stabilise."
    if kind == "contrarian":
        return f"En baisse de {_p(abs(d52))} % depuis son plus haut avec des fondamentaux corrects, mais la chute n'est pas encore stabilisée."
    if kind == "couteau":
        return f"Chute de {_p(abs(d52 or 0))} % et fondamentaux fragiles : le profil du « couteau qui tombe ». À éviter pour l'instant."
    if kind == "anomalie":
        move = "sans mouvement de prix équivalent" if chg1m is not None and abs(chg1m) < 5 else f"avec {_p(chg1m, 1)} % sur un mois"
        return f"Volume {_p(vr, 1)} fois supérieur à la normale cette semaine, {move}."
    if kind == "momentum":
        return f"Hausse de {_p(chg12 or 0)} % sur un an, au-dessus de sa moyenne de long terme, sans excès apparent."
    known = {k: v for k, v in f.items() if v is not None}
    if not known:
        return "Pas assez de données pour se faire une idée."
    best, worst = max(known, key=known.get), min(known, key=known.get)
    return f"Pas de signal particulier. Point fort : {FACTOR_FR[best]}. Point faible : {FACTOR_FR[worst]}."


def why_wrong(r: dict, f: dict, kind: str, missing: list[str]) -> list[str]:
    out = []
    if (f.get("valuation") or 50) < 40 and kind != "coeur":
        out.append("La valorisation est élevée par rapport aux autres titres : une déception sur les résultats coûterait cher.")
    if (f.get("momentum") or 50) < 35:
        out.append("La tendance reste baissière : historiquement, ce type de baisse se prolonge souvent quelques mois.")
    vol = _num(r.get("vol"))
    if (f.get("risk") or 50) < 35 and vol:
        out.append(f"Le cours est très agité ({_p(vol)} % de volatilité sur un an) : une variation de ±{_p(vol)} % dans l'année n'aurait rien d'exceptionnel.")
    if (f.get("quality") or 50) < 40 and r.get("kind") != "ETF":
        out.append("La rentabilité est faible ou l'endettement élevé : l'entreprise a moins de marge en cas de coup dur.")
    if (f.get("macro") or 50) < 45 and r.get("sector"):
        out.append(f"Son secteur ({r['sector'].lower()}) a tendance à moins bien résister dans la phase actuelle du cycle.")
    if kind == "anomalie":
        out.append("Un volume anormal peut refléter une information que le marché connaît et que nous n'avons pas.")
    if kind == "coeur":
        out.append("Les États-Unis pèsent environ 70 % de l'indice : une baisse américaine le touche directement.")
        out.append("Il baissera avec tout le marché : en 2008, un ETF monde a perdu plus de la moitié de sa valeur avant de remonter.")
    if missing:
        out.append("Certaines données manquent (" + ", ".join(FACTOR_FR[m] for m in missing) + ") : le score repose sur moins d'informations.")
    out.append("Ce score n'est pas encore vérifié par un backtest (étape 4) : prends-le comme une piste, pas comme une preuve.")
    return out


def invalidation(r: dict, kind: str) -> str:
    price, ma200 = _num(r.get("price")), _num(r.get("dist_ma200"))
    level = f" (environ {_p(price / (1 + ma200 / 100), 2)} {r.get('currency') or ''})".rstrip() if price and ma200 is not None else ""
    return {
        "coeur": "Pas de sortie prévue : c'est une détention de long terme, alimentée chaque mois, y compris dans les baisses.",
        "valeur": "La thèse tombe si le cours casse son plus bas des six derniers mois, ou si les marges se dégradent au prochain trimestre.",
        "contrarian": "À surveiller seulement : la thèse ne démarre qu'une fois le cours stabilisé au-dessus de sa moyenne des 20 dernières séances.",
        "couteau": "Ne pas acheter tant que la rentabilité ne se redresse pas et que la chute ne s'est pas arrêtée.",
        "anomalie": "La thèse tombe si le volume reste élevé et que le cours casse son plus bas des trois derniers mois.",
        "momentum": f"La thèse tombe si le cours repasse sous sa moyenne des 200 dernières séances{level}.",
    }.get(kind, "Pas de signal particulier : rien ne presse.")


def score_universe(recs: dict[str, dict]) -> list[dict]:
    """Ajoute score, fourchette, type, thèse, risques et invalidation à chaque titre."""
    fs = factor_scores(recs)
    out = []
    for t, r in recs.items():
        f = fs[t]
        s, lo, hi, missing = composite(f)
        kind = classify(r, f)
        out.append({**r, "score": s, "low": lo, "high": hi, "type": kind,
                    "factors": {k: (round(v) if v is not None else None) for k, v in f.items()},
                    "missing": missing, "thesis": thesis(r, f, kind),
                    "wrong": why_wrong(r, f, kind, missing), "invalidation": invalidation(r, kind)})
    out.sort(key=lambda x: -x["score"])
    return out


def pick_ideas(scored: list[dict], n: int = 5) -> list[str]:
    """Idées du jour : les meilleurs signaux exploitables, un seul par secteur, plus le cœur de portefeuille."""
    ideas, sectors = [], set()
    for r in scored:
        if r["type"] in ("valeur", "momentum", "anomalie", "contrarian") and r.get("sector") not in sectors:
            ideas.append(r["ticker"])
            sectors.add(r.get("sector"))
        if len(ideas) == n - 1:
            break
    core = next((r["ticker"] for r in scored if r["type"] == "coeur"), None)
    if core:
        ideas.append(core)
    return ideas
