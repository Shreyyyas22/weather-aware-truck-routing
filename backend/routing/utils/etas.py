"""Estimate checkpoint arrival times from normalized route progress."""

from datetime import datetime, timedelta
from math import isfinite

from .checkpoints import MILES_PER_METER


def _positive_finite_number(value, field_name):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{field_name} must be a finite positive number")
    if not isfinite(value) or value <= 0:
        raise ValueError(f"{field_name} must be a finite positive number")
    return value


def assign_checkpoint_etas(
    checkpoints, departure_time, route_distance_meters, route_duration_seconds
):
    """Return checkpoint copies annotated with ISO-8601 estimated arrival times.

    Until provider segment durations are available, elapsed time is proportional
    to cumulative route distance. ``departure_time`` must include timezone
    information so a trip crossing midnight retains an unambiguous timestamp.
    """
    if not isinstance(departure_time, datetime) or departure_time.tzinfo is None:
        raise ValueError("departure_time must be a timezone-aware datetime")
    if departure_time.utcoffset() is None:
        raise ValueError("departure_time must be a timezone-aware datetime")
    if not isinstance(checkpoints, list) or not checkpoints:
        raise ValueError("at least one checkpoint is required")

    route_distance_meters = _positive_finite_number(
        route_distance_meters, "route_distance_meters"
    )
    route_duration_seconds = _positive_finite_number(
        route_duration_seconds, "route_duration_seconds"
    )
    route_distance_miles = route_distance_meters * MILES_PER_METER

    result = []
    previous_distance = -1.0
    for checkpoint in checkpoints:
        if not isinstance(checkpoint, dict):
            raise ValueError("each checkpoint must be a dictionary")
        distance = checkpoint.get("cumulative_miles")
        if isinstance(distance, bool) or not isinstance(distance, (int, float)):
            raise ValueError("checkpoint cumulative_miles must be numeric")
        if not isfinite(distance) or distance < previous_distance:
            raise ValueError("checkpoint cumulative_miles must be non-decreasing")
        if distance > route_distance_miles + 0.01:
            raise ValueError("checkpoint cumulative_miles exceeds route distance")

        elapsed_seconds = route_duration_seconds * (distance / route_distance_miles)
        annotated_checkpoint = checkpoint.copy()
        annotated_checkpoint["eta"] = (
            departure_time + timedelta(seconds=elapsed_seconds)
        ).isoformat()
        result.append(annotated_checkpoint)
        previous_distance = distance
    return result
