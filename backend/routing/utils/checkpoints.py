"""Generate distance-based checkpoints along normalized route geometry."""

from math import asin, cos, radians, sin, sqrt


MILES_PER_METER = 0.000621371
EARTH_RADIUS_MILES = 3958.7613
VALID_INTERVALS_MILES = frozenset({10, 25, 50})


def _coordinate(point):
    if not isinstance(point, dict):
        raise ValueError("geometry points must be dictionaries")
    try:
        latitude = float(point["latitude"])
        longitude = float(point["longitude"])
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError("geometry points require numeric latitude and longitude") from error
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError("geometry point is out of range")
    return latitude, longitude


def distance_miles(start, end):
    """Return great-circle distance between two normalized geometry points."""
    start_latitude, start_longitude = _coordinate(start)
    end_latitude, end_longitude = _coordinate(end)
    latitude_delta = radians(end_latitude - start_latitude)
    longitude_delta = radians(end_longitude - start_longitude)
    haversine = (
        sin(latitude_delta / 2) ** 2
        + cos(radians(start_latitude))
        * cos(radians(end_latitude))
        * sin(longitude_delta / 2) ** 2
    )
    return EARTH_RADIUS_MILES * 2 * asin(sqrt(haversine))


def _interpolate(start, end, fraction):
    start_latitude, start_longitude = _coordinate(start)
    end_latitude, end_longitude = _coordinate(end)
    return {
        "latitude": start_latitude + (end_latitude - start_latitude) * fraction,
        "longitude": start_longitude + (end_longitude - start_longitude) * fraction,
    }


def generate_checkpoints(geometry, interval_miles):
    """Place checkpoints along route geometry at the requested mile interval.

    The checkpoint at index zero is the origin and represents zero miles. Every
    later checkpoint represents the segment from its predecessor, including a
    shorter final segment when needed.
    """
    if interval_miles not in VALID_INTERVALS_MILES:
        raise ValueError("checkpoint interval must be one of 10, 25, or 50 miles")
    if not isinstance(geometry, list) or len(geometry) < 2:
        raise ValueError("route geometry must contain at least two points")

    points = [
        {"latitude": latitude, "longitude": longitude}
        for latitude, longitude in (_coordinate(point) for point in geometry)
    ]
    segment_lengths = [distance_miles(start, end) for start, end in zip(points, points[1:])]
    if not any(segment_lengths):
        raise ValueError("route geometry must cover a positive distance")

    total_miles = sum(segment_lengths)
    target_distances = [0.0]
    next_distance = float(interval_miles)
    while next_distance < total_miles:
        target_distances.append(next_distance)
        next_distance += interval_miles
    target_distances.append(total_miles)

    checkpoints = []
    segment_index = 0
    distance_before_segment = 0.0
    for target_distance in target_distances:
        while (
            segment_index < len(segment_lengths) - 1
            and target_distance > distance_before_segment + segment_lengths[segment_index]
        ):
            distance_before_segment += segment_lengths[segment_index]
            segment_index += 1

        segment_length = segment_lengths[segment_index]
        fraction = (
            0.0
            if segment_length == 0
            else (target_distance - distance_before_segment) / segment_length
        )
        coordinate = _interpolate(
            points[segment_index], points[segment_index + 1], min(1.0, fraction)
        )
        prior_distance = target_distances[len(checkpoints) - 1] if checkpoints else 0.0
        checkpoints.append({
            "id": f"checkpoint-{len(checkpoints)}",
            **coordinate,
            "cumulative_miles": target_distance,
            "segment_miles": target_distance - prior_distance,
        })
    return checkpoints
