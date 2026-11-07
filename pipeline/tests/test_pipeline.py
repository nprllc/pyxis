"""Tests du pipeline, sans réseau : les sources sont remplacées par des données synthétiques.

    python -m pytest pipeline/tests -q
"""
import json
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
import pytest

from pipeline import build, indicators, macro, quality, scoring


def fake_prices(seed=0, n=700, drift=0.0004, vol=0.015, start=100.0, end=None):
    rng = np.random.default_rng(seed)
    end = end or pd.Timestamp.now(tz="UTC").normalize()
    idx = pd.bdate_range(end=end, periods=n, tz="UTC")
    close = start * np.exp(np.cumsum(rng.normal(drift, vol, n)))
    return pd.DataFrame({"Close": close, "High": close * 1.01, "Low": close * 0.99,
                         "Volume": rng.integers(1_000, 2_000, n).astype(float)}, index=idx)


# ------------------------------------------------------------ indicateurs
def test_rsi_bounds_and_extremes():
    up = pd.Series(np.arange(1, 100, dtype=float))
    down = up[::-1].reset_index(drop=True)
    assert indicators.rsi(up) == 100.0
    assert indicators.rsi(down) < 1
    assert 0 <= indicators.rsi(fake_prices()["Close"]) <= 100


def test_pct_change_and_short_history():
    s = pd.Series([100.0] * 21 + [110.0])
    assert indicators.pct_change(s, 21) == pytest.approx(10.0)
    assert indicators.pct_change(pd.Series([1.0, 2.0]), 21) is None


def test_volatility_close_to_input():
    df = fake_prices(vol=0.01, n=600, drift=0)
    assert indicators.volatility(df["Close"]) == pytest.approx(0.01 * 252 ** 0.5 * 100, rel=0.2)


def test_drawdown_is_negative_and_breakout():
    s = pd.Series([100.0] * 60 + [80.0] * 30 + [120.0])
    assert indicators.max_drawdown(s) == pytest.approx(-20.0)
    assert indicators.breakout(s) is True


def test_volume_ratio_detects_spike():
    v = pd.Series([1000.0] * 60 + [5000.0] * 5)
    assert indicators.volume_ratio(v) > 2


# ---------------------------------------------------------------- qualité
def test_quality_blocks_short_and_stale():
    assert not quality.check_prices(fake_prices(n=50)).ok
    old = fake_prices(end=pd.Timestamp.now(tz="UTC") - pd.Timedelta(days=30))
    assert not quality.check_prices(old).ok
    assert quality.check_prices(fake_prices()).ok
    assert not quality.check_prices(None).ok


def test_quality_flags_jumps_and_bad_pe():
    df = fake_prices()
    df.iloc[-5, df.columns.get_loc("Close")] *= 3
    assert quality.check_prices(df).warnings
    f = {"pe": -4.0, "margin": 0.2}
    quality.check_fundamentals(f)
    assert f["pe"] is None and f["margin"] == 0.2


# ---------------------------------------------------------------- scoring
def test_percentiles_and_ties():
    r = scoring.percentile_ranks({"a": 1, "b": 2, "c": 3, "d": None})
    assert r == {"a": 0.0, "b": 50.0, "c": 100.0}
    assert scoring.percentile_ranks({"a": 1, "b": 1})["a"] == 50.0
    assert scoring.percentile_ranks({"a": 1, "b": 2}, higher_is_better=False)["a"] == 100.0


def test_composite_widens_with_missing_data():
    full = {"valuation": 60, "quality": 60, "momentum": 60, "risk": 60, "macro": 60}
    s1, lo1, hi1, m1 = scoring.composite(full)
    s2, lo2, hi2, m2 = scoring.composite({**full, "valuation": None, "quality": None})
    assert s1 == 60 and not m1 and len(m2) == 2
    assert (hi2 - lo2) > (hi1 - lo1)


def test_classify_value_vs_falling_knife():
    base = {"ticker": "X", "kind": "EQUITY", "dist_52w_high": -30, "fcf": 1e9, "rsi": 45, "dist_ma20": 2, "chg1m": 3}
    assert scoring.classify(base, {"quality": 80, "momentum": 20}) == "valeur"
    assert scoring.classify(base, {"quality": 30, "momentum": 20}) == "couteau"
    falling = {**base, "dist_ma20": -4, "rsi": 28, "chg1m": -4}
    assert scoring.classify(falling, {"quality": 60, "momentum": 20}) == "contrarian"
    assert scoring.classify({"ticker": "EUNL.DE", "kind": "ETF"}, {}) == "coeur"


def test_every_scored_item_explains_itself():
    recs = {}
    for i, t in enumerate(["A", "B", "C", "D", "E"]):
        r = {"ticker": t, "kind": "EQUITY", "sector": "Technologie", "macro_fit": 50, "pe": 10 + i * 5,
             "margin": 0.1 * i, "roe": 0.05 * i, "fcf": 1e8, "market_cap": 1e10, "currency": "EUR"}
        r.update(indicators.compute_all(fake_prices(seed=i)))
        recs[t] = r
    scored = scoring.score_universe(recs)
    for r in scored:
        assert 0 <= r["low"] <= r["score"] <= r["high"] <= 100
        assert r["thesis"] and len(r["wrong"]) >= 1 and r["invalidation"]


# ------------------------------------------------------------------ macro
def test_macro_phase_slowdown_when_unemployment_rises():
    m = pd.date_range("2022-01-01", periods=36, freq="MS")
    series = {"ecb_rate": pd.Series(2.0, index=m), "eu_inflation_index": pd.Series(np.linspace(100, 106, 36), index=m),
              "eu_unemployment": pd.Series(np.linspace(6, 7, 36), index=m),
              "us_unemployment": pd.Series(np.linspace(3.5, 4.5, 36), index=m), "us_curve": pd.Series(0.3, index=m)}
    out = macro.build_macro(series)
    assert out["phase"] == "ralentissement"
    assert out["sectors"][0]["name"] == "Santé"


def test_macro_survives_missing_series():
    out = macro.build_macro({"ecb_rate": None, "eu_inflation_index": None, "eu_unemployment": None,
                             "us_unemployment": None, "us_curve": None})
    assert out["confidence"] == "très faible" and len(out["indicators"]) == 4


# --------------------------------------------------------- de bout en bout
def test_full_run_writes_site_data(tmp_path, monkeypatch):
    monkeypatch.setattr(build, "OUT", tmp_path / "data")
    monkeypatch.setattr(build, "CACHE", tmp_path / "cache.json")
    cfg = build.load_config()

    def prices(tickers):
        # un titre sur dix "échoue" pour vérifier qu'on continue quand même
        return {t: fake_prices(seed=i) for i, t in enumerate(tickers) if i % 10}

    def fund(t):
        return {"name": t, "sector": "Technology", "kind": "EQUITY", "pe": 20.0, "margin": 0.2, "roe": 0.15,
                "fcf": 1e9, "market_cap": 5e10, "currency": "EUR"}

    m = pd.date_range("2022-01-01", periods=36, freq="MS")
    code = build.run(price_fetch=prices, stooq_fetch=lambda t: None, fund_fetch=fund,
                     fred_fetch=lambda s: pd.Series(np.linspace(2, 3, 36), index=m),
                     news_fetch=lambda t: [{"title": "Titre", "url": "https://example.com", "publisher": "Reuters", "date": None}])
    assert code == 0
    uni = json.loads((tmp_path / "data" / "universe.json").read_text())
    meta = json.loads((tmp_path / "data" / "meta.json").read_text())
    assert len(uni["items"]) >= 0.85 * len(cfg["_tickers"])
    assert meta["failed"] and meta["status"] == "partiel"
    assert uni["ideas"] and "NaN" not in (tmp_path / "data" / "universe.json").read_text()
    assert json.loads((tmp_path / "data" / "history.json").read_text())


def test_run_keeps_previous_data_when_sources_fail(tmp_path, monkeypatch):
    monkeypatch.setattr(build, "OUT", tmp_path / "data")
    monkeypatch.setattr(build, "CACHE", tmp_path / "cache.json")
    code = build.run(price_fetch=lambda t: {}, stooq_fetch=lambda t: None, fund_fetch=lambda t: None,
                     fred_fetch=lambda s: None, news_fetch=lambda t: [])
    assert code == 1
    assert not (tmp_path / "data" / "universe.json").exists()
    assert json.loads((tmp_path / "data" / "meta.json").read_text())["status"] == "echec"


def test_analyst_view_in_plain_words():
    v = build.analyst_view({"analyst_count": 30, "analyst_mean": 1.9, "price": 100.0, "target_mean": 120.0})
    assert v["label"] == "achat" and v["upside"] == 20.0
    assert build.analyst_view({"analyst_count": 2, "analyst_mean": 1.0}) is None
