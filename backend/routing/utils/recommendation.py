"""Route-risk summaries and recommendation rules.

The functions in this module operate on provider-independent dictionaries so
they can be used by the planning API after routes, checkpoints, and weather
data have been normalized.
"""

from copy import deepcopy
from math import isfinite

from .risk_calculator import RISK_PRIORITY


AVERAGE_RISK_SCORES = {
    "LOW": 1,
    "MODERATE": 2,
    "HIGH": 3,
    "SEVERE": 4,
}


def _positive_number(value, field_name):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{field_name} must be a finite positive number")
    if not isfinite(value) or value <= 0:
        raise ValueError(f"{field_name} must be a finite positive number")
    return value


def summarize_route(route):
    """Calculate miles and average risk for a normalized route.

    A route must supply ``duration_seconds`` and one or more checkpoints.
    Each checkpoint represents the preceding route segment and contains an
    ``overall_risk`` and positive ``segment_miles`` value.
    """
    if not isinstance(route, dict):
        raise ValueError("route must be a dictionary")
    if not route.get("id"):
        raise ValueError("route id is required")

    duration_seconds = _positive_number(
        route.get("duration_seconds"), "duration_seconds"
    )
    checkpoints = route.get("checkpoints")
    if not isinstance(checkpoints, list) or not checkpoints:
        raise ValueError("route must include at least one checkpoint")

    severe_miles = 0.0
    high_miles = 0.0
    total_miles = 0.0
    risk_miles = 0.0
    has_no_travel = False

    for checkpoint in checkpoints:
        if not isinstance(checkpoint, dict):
            raise ValueError("each checkpoint must be a dictionary")
        risk = checkpoint.get("overall_risk")
        if risk not in RISK_PRIORITY:
            raise ValueError("checkpoint overall_risk is invalid")
        segment_miles = _positive_number(
            checkpoint.get("segment_miles"), "checkpoint segment_miles"
        )

        total_miles += segment_miles
        if risk == "SEVERE":
            severe_miles += segment_miles
        elif risk == "HIGH":
            high_miles += segment_miles

        if risk == "NO_TRAVEL":
            has_no_travel = True
        else:
            risk_miles += AVERAGE_RISK_SCORES[risk] * segment_miles

    # No Travel routes are excluded before ranking. Their visible average is
    # still meaningful for inspection, using only traversable segments.
    traversable_miles = total_miles - sum(
        checkpoint["segment_miles"]
        for checkpoint in checkpoints
        if checkpoint["overall_risk"] == "NO_TRAVEL"
    )
    average_risk = risk_miles / traversable_miles if traversable_miles else None

    return {
        "id": route["id"],
        "severe_miles": severe_miles,
        "high_miles": high_miles,
        "average_risk": average_risk,
        "duration_seconds": duration_seconds,
        "total_miles": total_miles,
        "has_no_travel": has_no_travel,
    }


def _ranking_key(summary):
    return (
        summary["severe_miles"],
        summary["high_miles"],
        summary["average_risk"],
        summary["duration_seconds"],
        str(summary["id"]),
    )


def _recommendation_reason(winner, runner_up):
    if runner_up is None:
        return "This is the only travel-safe route."

    comparisons = (
        ("severe_miles", "it has fewer Severe-risk miles"),
        ("high_miles", "it has fewer High-risk miles"),
        ("average_risk", "it has a lower average weather-risk score"),
        ("duration_seconds", "it has the shorter estimated travel time"),
    )
    for field, reason in comparisons:
        if winner[field] != runner_up[field]:
            return f"Recommended because {reason} than the next-best safe route."
    return "Recommended after an exact safety and travel-time tie."


def recommend_routes(routes):
    """Rank routes using the assessment's ordered safety priorities.

    Routes containing a No Travel checkpoint are excluded whenever a safe
    alternative exists. If every route contains No Travel, no route is
    recommended and callers should present the trip as unsafe.
    """
    if not isinstance(routes, list) or not routes:
        raise ValueError("at least one route is required")

    summaries = [summarize_route(route) for route in routes]
    safe_routes = [summary for summary in summaries if not summary["has_no_travel"]]
    if not safe_routes:
        return {
            "recommended_route_id": None,
            "reason": "No route is recommended because every option contains a No Travel segment.",
            "routes": summaries,
        }

    ranked_safe_routes = sorted(safe_routes, key=_ranking_key)
    winner = ranked_safe_routes[0]
    result = {
        "recommended_route_id": winner["id"],
        "reason": _recommendation_reason(
            winner, ranked_safe_routes[1] if len(ranked_safe_routes) > 1 else None
        ),
        "routes": summaries,
    }
    return deepcopy(result)
