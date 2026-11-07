"""
Indicateurs techniques calculés à partir de l'historique de prix d'un titre.

Chaque fonction prend une série pandas (cours de clôture ajustés, ou volumes)
et renvoie un nombre simple. Tout est en pur pandas/numpy : facile à tester.
"""
from __future__ import annotations

import math

import numpy as np
import pandas as pd

TRADING_DAYS = 252  # nombre approximatif de séances de bourse par an


def _clean(s: pd.Series) -> pd.Series:
    return pd.to_numeric(s, errors="coerce").dropna()


def pct_change(close: pd.Series, days: int) -> float | None:
    """Variation en % sur les `days` dernières séances. None si l'historique est trop court."""
    c = _clean(close)
    if len(c) <= days:
        return None
    return float((c.iloc[-1] / c.iloc[-1 - days] - 1) * 100)


def momentum_12_1(close: pd.Series) -> float | None:
    """Tendance « 12 mois moins le dernier mois », la mesure de momentum la plus étudiée :
    on exclut le dernier mois, souvent bruité par des retournements de court terme."""
    c = _clean(close)
    if len(c) <= TRADING_DAYS:
        return None
    return float((c.iloc[-21] / c.iloc[-TRADING_DAYS] - 1) * 100)


def rsi(close: pd.Series, period: int = 14) -> float | None:
    """RSI de Wilder (0 à 100). Sous 30 : forte baisse récente ; au-dessus de 70 : forte hausse récente."""
    c = _clean(close)
    if len(c) <= period:
        return None
    delta = c.diff().dropna()
    gain = delta.clip(lower=0).ewm(alpha=1 / period, adjust=False).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1 / period, adjust=False).mean()
    g, l = gain.iloc[-1], loss.iloc[-1]
    if l == 0:
        return 100.0 if g > 0 else 50.0
    return float(100 - 100 / (1 + g / l))


def distance_to_ma(close: pd.Series, window: int) -> float | None:
    """Écart en % entre le cours et sa moyenne mobile sur `window` séances."""
    c = _clean(close)
    if len(c) < window:
        return None
    ma = c.iloc[-window:].mean()
    return float((c.iloc[-1] / ma - 1) * 100)


def volatility(close: pd.Series, days: int = TRADING_DAYS) -> float | None:
    """Volatilité annualisée en % (écart-type des rendements quotidiens × √252)."""
    c = _clean(close)
    if len(c) < 60:
        return None
    r = np.log(c.iloc[-days:]).diff().dropna()
    return float(r.std() * math.sqrt(TRADING_DAYS) * 100)


def atr_pct(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> float | None:
    """Amplitude moyenne d'une séance (ATR) en % du cours."""
    h, l, c = _clean(high), _clean(low), _clean(close)
    df = pd.concat([h, l, c], axis=1, keys=["h", "l", "c"]).dropna()
    if len(df) <= period:
        return None
    prev = df["c"].shift(1)
    tr = pd.concat([df["h"] - df["l"], (df["h"] - prev).abs(), (df["l"] - prev).abs()], axis=1).max(axis=1)
    atr = tr.ewm(alpha=1 / period, adjust=False).mean().iloc[-1]
    return float(atr / df["c"].iloc[-1] * 100)


def max_drawdown(close: pd.Series, days: int = TRADING_DAYS) -> float | None:
    """Pire chute en % entre un sommet et un creux sur la période (nombre négatif)."""
    c = _clean(close).iloc[-days:]
    if len(c) < 20:
        return None
    peak = c.cummax()
    return float(((c / peak) - 1).min() * 100)


def volume_ratio(volume: pd.Series, short: int = 5, long: int = 60) -> float | None:
    """Volume moyen des 5 dernières séances divisé par celui des 3 derniers mois.
    Au-dessus de 2 : activité inhabituelle."""
    v = _clean(volume)
    v = v[v > 0]
    if len(v) < long:
        return None
    base = v.iloc[-long:].mean()
    return float(v.iloc[-short:].mean() / base) if base else None


def dist_52w_high(close: pd.Series) -> float | None:
    """Écart en % avec le plus haut des 52 dernières semaines (0 = au plus haut)."""
    c = _clean(close).iloc[-TRADING_DAYS:]
    if len(c) < 60:
        return None
    return float((c.iloc[-1] / c.max() - 1) * 100)


def breakout(close: pd.Series, window: int = 60) -> bool:
    """Vrai si le cours vient de dépasser son plus haut des `window` séances précédentes."""
    c = _clean(close)
    if len(c) <= window:
        return False
    return bool(c.iloc[-1] > c.iloc[-window - 1:-1].max())


def sparkline(close: pd.Series, points: int = 60, days: int = 63) -> list[float]:
    """Courbe simplifiée des 3 derniers mois, pour les mini-graphiques."""
    c = _clean(close).iloc[-days:]
    if c.empty:
        return []
    idx = np.linspace(0, len(c) - 1, min(points, len(c))).round().astype(int)
    return [round(float(c.iloc[i]), 4) for i in idx]


def compute_all(df: pd.DataFrame) -> dict:
    """Tous les indicateurs d'un titre. `df` a les colonnes Close, High, Low, Volume (index = dates)."""
    close = df["Close"]
    return {
        "price": round(float(_clean(close).iloc[-1]), 4),
        "chg1m": pct_change(close, 21),
        "chg3m": pct_change(close, 63),
        "chg12m": pct_change(close, TRADING_DAYS),
        "mom12_1": momentum_12_1(close),
        "rsi": rsi(close),
        "dist_ma20": distance_to_ma(close, 20),
        "dist_ma50": distance_to_ma(close, 50),
        "dist_ma200": distance_to_ma(close, 200),
        "vol": volatility(close),
        "atr_pct": atr_pct(df["High"], df["Low"], close) if {"High", "Low"} <= set(df.columns) else None,
        "maxdd_1y": max_drawdown(close),
        "volume_ratio": volume_ratio(df["Volume"]) if "Volume" in df.columns else None,
        "dist_52w_high": dist_52w_high(close),
        "breakout": breakout(close),
        "spark": sparkline(close),
    }
