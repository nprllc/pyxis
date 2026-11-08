"""Test sur le passé (backtest) de la partie « prix » du score Pyxis.

Ce qu'on peut tester honnêtement avec des données gratuites :
  - les critères calculés à partir des cours seuls : momentum (tendance sur un an, hors dernier mois)
    et risque (volatilité et pire baisse sur un an) ;
  - pas la valorisation ni la qualité : on n'a pas l'historique des comptes, seulement les chiffres du jour.

Méthode, volontairement simple :
  - à la fin de chaque mois, on classe les actions suivies selon ces deux critères (mêmes poids relatifs
    que dans le score : momentum 20, risque 15) ;
  - on « achète » à parts égales le tiers le mieux classé, on garde un mois, et on recommence ;
  - on compare à toutes les actions suivies à parts égales, et à l'ETF monde de référence.

Limites affichées sur le site :
  - biais du survivant : la liste testée est celle d'aujourd'hui (les entreprises disparues ne sont pas dedans),
    ce qui embellit tous les résultats ;
  - rendements en monnaie locale, sans frais ni impôts.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

W_MOM, W_RISK = 20, 15
MIN_STOCKS = 12


def _monthly(prices: dict[str, pd.DataFrame]) -> pd.DataFrame:
    cols = {}
    for t, df in prices.items():
        c = pd.to_numeric(df["Close"], errors="coerce").dropna()
        if c.empty:
            continue
        c.index = pd.to_datetime(c.index).tz_localize(None) if getattr(c.index, "tz", None) else pd.to_datetime(c.index)
        cols[t] = c
    daily = pd.DataFrame(cols).sort_index().ffill(limit=5)
    return daily


def _rank(s: pd.Series) -> pd.Series:
    return s.rank(pct=True) * 100


def _stats(r: pd.Series) -> dict:
    """Statistiques d'une série de rendements mensuels."""
    r = r.dropna()
    if r.empty:
        return {}
    curve = (1 + r).cumprod()
    years = len(r) / 12
    dd = (curve / curve.cummax() - 1).min()
    return {
        "total": round(float(curve.iloc[-1] - 1) * 100, 1),
        "annual": round(float(curve.iloc[-1] ** (1 / years) - 1) * 100, 1) if years > 0 else None,
        "vol": round(float(r.std() * np.sqrt(12)) * 100, 1),
        "maxdd": round(float(dd) * 100, 1),
    }


def run_backtest(prices: dict[str, pd.DataFrame], stocks: list[str], benchmark: str | None) -> dict | None:
    daily = _monthly({t: prices[t] for t in set(stocks) | ({benchmark} if benchmark else set()) if t in prices})
    if daily.empty:
        return None
    month_ends = daily.resample("ME").last().index
    month_ends = [d for d in month_ends if d <= daily.index[-1]]
    # dernier jour de bourse réel de chaque mois
    ends = [daily.index[daily.index <= d][-1] for d in month_ends if (daily.index <= d).any()]
    ends = sorted(set(ends))
    rows, spreads = [], []
    for i in range(len(ends) - 1):
        t0, t1 = ends[i], ends[i + 1]
        hist = daily.loc[:t0]
        if len(hist) < 260:
            continue
        p0 = hist.iloc[-1]
        cand = [s for s in stocks if s in hist and pd.notna(p0.get(s)) and hist[s].iloc[-260:].notna().sum() >= 240]
        if len(cand) < MIN_STOCKS:
            continue
        h = hist[cand].iloc[-260:]
        mom = h.iloc[-22] / h.iloc[0] - 1                         # 12 mois hors dernier mois
        rets = h.pct_change().iloc[1:]
        vol = rets.std() * np.sqrt(252)
        dd = (h / h.cummax() - 1).min()
        risk = (_rank(-vol) + _rank(dd)) / 2                       # moins volatil, pire baisse moins profonde = mieux
        score = (W_MOM * _rank(mom) + W_RISK * risk) / (W_MOM + W_RISK)
        fwd = daily.loc[t1, cand] / p0[cand] - 1
        fwd = fwd.replace([np.inf, -np.inf], np.nan).dropna()
        score = score.reindex(fwd.index).dropna()
        if len(score) < MIN_STOCKS:
            continue
        n = max(3, len(score) // 3)
        top = score.nlargest(n).index
        bottom = score.nsmallest(n).index
        row = {"date": t1.strftime("%Y-%m-%d"), "top": float(fwd[top].mean()), "all": float(fwd.mean()),
               "bottom": float(fwd[bottom].mean()), "n": int(len(score))}
        if benchmark and benchmark in daily and pd.notna(daily.loc[t1, benchmark]) and pd.notna(p0.get(benchmark)):
            row["bench"] = float(daily.loc[t1, benchmark] / p0[benchmark] - 1)
        rows.append(row)
    if len(rows) < 12:
        return None
    df = pd.DataFrame(rows).set_index("date")
    out = {
        "months": len(df),
        "start": df.index[0], "end": df.index[-1],
        "stocks": int(df["n"].median()),
        "strategies": {
            "top": {"label": "Tiers le mieux classé", **_stats(df["top"])},
            "all": {"label": "Toutes les actions suivies", **_stats(df["all"])},
            "bottom": {"label": "Tiers le moins bien classé", **_stats(df["bottom"])},
        },
        "beat_all_pct": round(float((df["top"] > df["all"]).mean()) * 100, 0),
        "curves": {k: [round(float(x), 4) for x in (1 + df[k]).cumprod()] for k in ("top", "all", "bottom")},
        "dates": list(df.index),
    }
    if "bench" in df and df["bench"].notna().sum() >= 12:
        b = df["bench"].fillna(0)
        out["strategies"]["bench"] = {"label": "ETF monde (référence)", **_stats(b)}
        out["curves"]["bench"] = [round(float(x), 4) for x in (1 + b).cumprod()]
        out["beat_bench_pct"] = round(float((df["top"] > b).mean()) * 100, 0)
    # Calibration : écart mensuel entre le tiers du haut et la moyenne, du 10e au 90e centile.
    ex = (df["top"] - df["all"]) * 100
    out["excess"] = {"median": round(float(ex.median()), 2), "p10": round(float(ex.quantile(0.1)), 2),
                     "p90": round(float(ex.quantile(0.9)), 2)}
    return out
