"""
Contexte économique : quelques indicateurs publics, et une estimation prudente
de la phase du cycle. C'est une règle simple et transparente, pas un oracle :
les phases ne se lisent vraiment qu'après coup.
"""
from __future__ import annotations

import pandas as pd

# Noms des secteurs Yahoo -> français
SECTOR_FR = {
    "Technology": "Technologie",
    "Healthcare": "Santé",
    "Financial Services": "Finance",
    "Consumer Cyclical": "Consommation cyclique",
    "Consumer Defensive": "Consommation de base",
    "Industrials": "Industrie",
    "Energy": "Énergie",
    "Basic Materials": "Matériaux",
    "Utilities": "Services publics",
    "Real Estate": "Immobilier",
    "Communication Services": "Télécoms et médias",
}

# Tendances historiques moyennes (rotation sectorielle classique), de 0 à 100.
# Ce sont des tendances, avec beaucoup d'exceptions : elles pèsent 15 % du score.
SECTOR_FIT = {
    "reprise": {"Consommation cyclique": 75, "Finance": 70, "Industrie": 68, "Technologie": 65, "Immobilier": 62,
                "Matériaux": 58, "Télécoms et médias": 55, "Énergie": 45, "Santé": 45, "Services publics": 40, "Consommation de base": 40},
    "expansion": {"Technologie": 75, "Industrie": 70, "Matériaux": 65, "Consommation cyclique": 65, "Finance": 62,
                  "Télécoms et médias": 58, "Énergie": 55, "Immobilier": 52, "Santé": 50, "Consommation de base": 45, "Services publics": 42},
    "surchauffe": {"Énergie": 75, "Matériaux": 70, "Industrie": 58, "Santé": 55, "Consommation de base": 55, "Finance": 52,
                   "Services publics": 50, "Télécoms et médias": 48, "Immobilier": 42, "Technologie": 42, "Consommation cyclique": 40},
    "ralentissement": {"Santé": 72, "Services publics": 68, "Consommation de base": 66, "Télécoms et médias": 60, "Technologie": 48,
                       "Immobilier": 46, "Finance": 42, "Énergie": 40, "Industrie": 40, "Consommation cyclique": 38, "Matériaux": 38},
}
SECTOR_NOTE = {
    "Santé": "On se soigne quelle que soit la conjoncture : secteur défensif.",
    "Services publics": "Électricité, eau : demande stable, sensible aux taux d'intérêt.",
    "Consommation de base": "Alimentation, hygiène : on continue d'en acheter quand l'économie ralentit.",
    "Télécoms et médias": "Abonnements réguliers, mais aussi des géants de la publicité plus cycliques.",
    "Technologie": "Croissance forte, mais sensible aux taux et aux attentes.",
    "Immobilier": "Très sensible aux taux d'intérêt.",
    "Finance": "Les banques profitent de l'activité et de taux plus élevés, souffrent en récession.",
    "Énergie": "Suit le prix du pétrole et du gaz, donc la demande mondiale.",
    "Industrie": "Commandes et investissements : suit de près l'activité économique.",
    "Consommation cyclique": "Voitures, voyages, mode : on les reporte quand ça va moins bien.",
    "Matériaux": "Métaux, chimie : profite des phases de forte demande.",
}
PHASE_TEXT = {
    "reprise": "L'emploi s'améliore et l'inflation reste calme : l'économie repart.",
    "expansion": "L'emploi s'améliore et les prix montent un peu : l'économie tourne bien.",
    "surchauffe": "L'inflation est élevée et accélère : les banques centrales risquent de freiner.",
    "ralentissement": "L'emploi se dégrade : la croissance continue peut-être, mais perd de la vitesse.",
}


def _trend(s: pd.Series, months: int = 6, tol: float = 0.1) -> tuple[float | None, float | None, str]:
    """Dernière valeur, valeur il y a `months` mois, et tendance en mots."""
    if s is None or s.empty:
        return None, None, "inconnue"
    last = float(s.iloc[-1])
    past = s[s.index <= s.index[-1] - pd.DateOffset(months=months)]
    if past.empty:
        return last, None, "inconnue"
    prev = float(past.iloc[-1])
    d = last - prev
    word = "hausse" if d > tol else "baisse" if d < -tol else "stable"
    return last, prev, word


def yoy(index: pd.Series) -> pd.Series:
    """Glissement sur 12 mois, en %, d'une série mensuelle d'indice de prix."""
    return (index / index.shift(12) - 1).dropna() * 100


def fmt(v: float | None, unit: str = " %", digits: int = 2) -> str:
    if v is None:
        return "indisponible"
    return f"{v:+.{digits}f}{unit}".replace(".", ",") if unit == " pt" else f"{v:.{digits}f}{unit}".replace(".", ",")


def build_macro(series: dict[str, pd.Series | None]) -> dict:
    ecb, ecb_prev, ecb_t = _trend(series.get("ecb_rate"), tol=0.05)
    infl_s = yoy(series["eu_inflation_index"]) if series.get("eu_inflation_index") is not None else None
    infl, infl_prev, infl_t = _trend(infl_s, tol=0.2)
    eu_u, _, eu_u_t = _trend(series.get("eu_unemployment"), tol=0.1)
    us_u, _, us_u_t = _trend(series.get("us_unemployment"), tol=0.15)
    curve, curve_prev, curve_t = _trend(series.get("us_curve"), tol=0.15)

    # Croissance : on regarde le chômage (une hausse = l'économie ralentit).
    known = [t for t in (eu_u_t, us_u_t) if t != "inconnue"]
    growth_down = "hausse" in known
    growth_up = known and all(t == "baisse" for t in known)
    if growth_down:
        phase = "ralentissement"
    elif infl is not None and infl > 3 and infl_t == "hausse":
        phase = "surchauffe"
    elif infl_t == "hausse":
        phase = "expansion"
    elif growth_up:
        phase = "reprise"
    else:
        phase = "expansion"
    n_known = sum(v is not None for v in (ecb, infl, eu_u, us_u, curve))
    confidence = "moyenne" if n_known >= 4 else "faible" if n_known >= 2 else "très faible"

    indicators = [
        {"key": "taux", "label": "Taux de dépôt de la BCE", "value": fmt(ecb), "trend": ecb_t,
         "meaning": {"baisse": "L'argent devient moins cher : bon pour l'emprunt, l'immobilier et les entreprises endettées.",
                     "hausse": "L'argent devient plus cher : la BCE freine l'économie pour calmer les prix.",
                     "stable": "Le coût de l'argent ne bouge plus depuis six mois."}.get(ecb_t, "Donnée indisponible aujourd'hui.")},
        {"key": "inflation", "label": "Inflation zone euro (sur 12 mois)", "value": fmt(infl, digits=1), "trend": infl_t,
         "meaning": ("Les prix montent à peu près au rythme visé par la BCE (2 %)." if infl is not None and abs(infl - 2) < 0.6
                     else "Les prix montent plus vite que l'objectif de 2 % de la BCE." if infl is not None and infl > 2
                     else "Les prix montent moins vite que l'objectif de 2 % de la BCE." if infl is not None
                     else "Donnée indisponible aujourd'hui.")},
        {"key": "chomage", "label": "Chômage zone euro", "value": fmt(eu_u, digits=1), "trend": eu_u_t,
         "meaning": {"baisse": "Plus de gens travaillent : la consommation est soutenue.",
                     "hausse": "Le chômage remonte : signe que l'économie perd de la vitesse.",
                     "stable": "L'emploi tient : la consommation ne s'effondre pas."}.get(eu_u_t, "Donnée indisponible aujourd'hui.")},
        {"key": "courbe", "label": "Écart taux 10 ans – 2 ans (États-Unis)", "value": fmt(curve, unit=" pt"), "trend": curve_t,
         "meaning": ("Les taux longs sont sous les taux courts : historiquement, un signal d'alerte avant les récessions."
                     if curve is not None and curve < 0 else
                     "Les taux longs repassent au-dessus des taux courts : situation normale, souvent après une période d'alerte."
                     if curve is not None else "Donnée indisponible aujourd'hui.")},
    ]
    fit = SECTOR_FIT[phase]
    sectors = [{"name": k, "fit": v, "note": SECTOR_NOTE[k]} for k, v in sorted(fit.items(), key=lambda kv: -kv[1])]
    return {"phase": phase, "confidence": confidence, "phase_text": PHASE_TEXT[phase],
            "indicators": indicators, "sectors": sectors}


def sector_fit(phase: str, sector_fr: str | None) -> int:
    return SECTOR_FIT.get(phase, {}).get(sector_fr or "", 50)
