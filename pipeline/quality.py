"""
Contrôles de cohérence des données, avant tout calcul.

Une donnée fausse est pire qu'une donnée absente : un titre qui échoue
à un contrôle bloquant est écarté, et la raison est notée dans meta.json.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

import pandas as pd

MIN_ROWS = 200          # ~10 mois de séances : en dessous, les indicateurs annuels n'ont pas de sens
MAX_AGE_DAYS = 7        # dernière cotation plus vieille que ça : titre suspendu ou source en panne
MAX_DAILY_JUMP = 0.5    # +/-50 % en une séance : probablement une erreur ou une division d'action mal corrigée


@dataclass
class Check:
    ok: bool = True
    blocking: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def block(self, msg: str) -> None:
        self.ok = False
        self.blocking.append(msg)


def check_prices(df: pd.DataFrame | None, now: datetime | None = None) -> Check:
    now = now or datetime.now(timezone.utc)
    c = Check()
    if df is None or df.empty or "Close" not in df.columns:
        c.block("aucune donnée de prix")
        return c
    close = pd.to_numeric(df["Close"], errors="coerce")
    valid = close.dropna()
    if len(valid) < MIN_ROWS:
        c.block(f"historique trop court ({len(valid)} séances, minimum {MIN_ROWS})")
    if (valid <= 0).any():
        c.block("prix nuls ou négatifs")
    if len(valid):
        last = pd.Timestamp(valid.index[-1])
        last = last.tz_localize("UTC") if last.tzinfo is None else last.tz_convert("UTC")
        age = (pd.Timestamp(now) - last).days
        if age > MAX_AGE_DAYS:
            c.block(f"dernière cotation vieille de {age} jours")
    missing = close.isna().mean() if len(close) else 1
    if missing > 0.1:
        c.warnings.append(f"{missing:.0%} de séances manquantes")
    jumps = valid.pct_change().abs()
    if (jumps > MAX_DAILY_JUMP).any():
        c.warnings.append("variation de plus de 50 % en une séance : à vérifier (division d'action ?)")
    return c


def check_fundamentals(f: dict) -> list[str]:
    """Valeurs aberrantes des fondamentaux : on les retire plutôt que de fausser le score."""
    notes = []
    pe = f.get("pe")
    if pe is not None and (pe <= 0 or pe > 300):
        notes.append(f"PER ignoré ({pe:.0f})")
        f["pe"] = None
    for k in ("margin", "roe"):
        v = f.get(k)
        if v is not None and abs(v) > 5:  # plus de 500 % : donnée corrompue
            notes.append(f"{k} ignoré")
            f[k] = None
    return notes
