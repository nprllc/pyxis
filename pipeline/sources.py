"""
Récupération des données brutes, avec reprise sur erreur.

- Prix : Yahoo Finance (via yfinance), puis Stooq en secours pour les titres manquants.
- Fondamentaux : Yahoo Finance, mis en cache plusieurs jours (ils bougent peu).
- Macro : FRED (Réserve fédérale de Saint-Louis), en CSV public, sans clé.

Aucune de ces sources n'est garantie : chaque appel est protégé, et un échec
n'arrête jamais toute la mise à jour.
"""
from __future__ import annotations

import io
import logging
import time

import pandas as pd
import requests

log = logging.getLogger("pyxis")
HEADERS = {"User-Agent": "Pyxis/1.0 (+https://github.com/nprllc/pyxis)"}


# ---------------------------------------------------------------- Prix ----
def _split_download(raw: pd.DataFrame, tickers: list[str]) -> dict[str, pd.DataFrame]:
    """yfinance renvoie un tableau à colonnes doubles (titre, champ) : on le découpe par titre."""
    out: dict[str, pd.DataFrame] = {}
    if raw is None or raw.empty:
        return out
    if isinstance(raw.columns, pd.MultiIndex):
        lvl0 = set(raw.columns.get_level_values(0))
        for t in tickers:
            if t in lvl0:
                df = raw[t].dropna(how="all")
                if not df.empty:
                    out[t] = df
    elif len(tickers) == 1:
        out[tickers[0]] = raw.dropna(how="all")
    return out


def prices_yahoo(tickers: list[str], period: str = "6y", attempts: int = 3) -> dict[str, pd.DataFrame]:
    import yfinance as yf

    result: dict[str, pd.DataFrame] = {}
    todo = list(tickers)
    for attempt in range(1, attempts + 1):
        if not todo:
            break
        try:
            raw = yf.download(todo, period=period, interval="1d", group_by="ticker",
                              auto_adjust=True, threads=True, progress=False)
            got = _split_download(raw, todo)
            result.update(got)
            todo = [t for t in todo if t not in got]
        except Exception as e:  # réseau, limitation de débit, format inattendu…
            log.warning("Yahoo, tentative %s : %s", attempt, e)
        if todo and attempt < attempts:
            time.sleep(5 * attempt)
    if todo:
        log.warning("Yahoo n'a rien renvoyé pour : %s", ", ".join(todo))
    return result


def stooq_symbol(ticker: str) -> str | None:
    """Traduit un code Yahoo en code Stooq, quand c'est possible."""
    t = ticker.lower()
    if "." not in t:
        return f"{t}.us"
    base, suffix = t.rsplit(".", 1)
    return {"de": f"{base}.de", "l": f"{base}.uk"}.get(suffix)


def prices_stooq(ticker: str) -> pd.DataFrame | None:
    sym = stooq_symbol(ticker)
    if not sym:
        return None
    try:
        r = requests.get(f"https://stooq.com/q/d/l/?s={sym}&i=d", headers=HEADERS, timeout=20)
        r.raise_for_status()
        if not r.text.startswith("Date"):
            return None
        df = pd.read_csv(io.StringIO(r.text), parse_dates=["Date"], index_col="Date")
        return df.rename(columns=str.title)
    except Exception as e:
        log.warning("Stooq %s : %s", ticker, e)
        return None


# ---------------------------------------------------------- Fondamentaux ----
FIELDS = {
    "name": ("longName", "shortName"),
    "sector": ("sector", "category"),
    "industry": ("industry",),
    "country": ("country",),
    "currency": ("currency",),
    "kind": ("quoteType",),
    "market_cap": ("marketCap", "totalAssets"),
    "pe": ("trailingPE",),
    "forward_pe": ("forwardPE",),
    "pb": ("priceToBook",),
    "margin": ("profitMargins",),
    "op_margin": ("operatingMargins",),
    "roe": ("returnOnEquity",),
    "debt_to_equity": ("debtToEquity",),
    "fcf": ("freeCashflow",),
    "dividend_yield": ("dividendYield", "yield"),
    "revenue_growth": ("revenueGrowth",),
    "earnings_growth": ("earningsGrowth",),
    "expense_ratio": ("netExpenseRatio", "annualReportExpenseRatio"),
}


def fundamentals_yahoo(ticker: str) -> dict | None:
    import yfinance as yf

    try:
        info = yf.Ticker(ticker).info or {}
    except Exception as e:
        log.warning("Fondamentaux %s : %s", ticker, e)
        return None
    if not info:
        return None
    out = {}
    for key, candidates in FIELDS.items():
        out[key] = next((info[c] for c in candidates if info.get(c) not in (None, "", "Infinity")), None)
    return out


# ------------------------------------------------------------------ Macro ----
def fred_series(series_id: str) -> pd.Series | None:
    """Série FRED via le CSV public (pas de clé nécessaire)."""
    try:
        r = requests.get("https://fred.stlouisfed.org/graph/fredgraph.csv",
                         params={"id": series_id}, headers=HEADERS, timeout=30)
        r.raise_for_status()
        df = pd.read_csv(io.StringIO(r.text))
        date_col = df.columns[0]
        s = pd.to_numeric(df[series_id], errors="coerce")
        s.index = pd.to_datetime(df[date_col])
        return s.dropna()
    except Exception as e:
        log.warning("FRED %s : %s", series_id, e)
        return None
