"""Orchestrate the provider-independent trip planning workflow."""

from datetime import datetime

from routing.services.routing_provider import RoutingProviderError
from routing.services.weather_provider import WeatherProviderError
from routing.utils.checkpoints import generate_checkpoints
from routing.utils.etas import assign_checkpoint_etas
from routing.utils.recommendation import recommend_routes
from routing.utils.risk_calculator import calculate_checkpoint_risk


class TripValidationError(ValueError):
    pass


def plan_trip(data, routing_service, weather_service):
    required = ("origin", "destination", "departure_time", "load_weight", "checkpoint_interval")
    if not isinstance(data, dict) or any(field not in data for field in required):
        raise TripValidationError("origin, destination, departure_time, load_weight, and checkpoint_interval are required")
    if not all(isinstance(data[field], str) and data[field].strip() for field in ("origin", "destination")):
        raise TripValidationError("origin and destination must be non-empty strings")
    try:
        departure_time = datetime.fromisoformat(data["departure_time"])
        if departure_time.tzinfo is None or departure_time.utcoffset() is None:
            raise ValueError
        load_weight = float(data["load_weight"])
        if load_weight < 0:
            raise ValueError
    except (TypeError, ValueError):
        raise TripValidationError("departure_time must include a timezone and load_weight must be non-negative")

    try:
        routes = routing_service.plan_routes(data["origin"], data["destination"], 3)
        planned_routes = []
        recommendation_routes = []
        has_unavailable_weather = False
        for route in routes:
            checkpoints = generate_checkpoints(route["geometry"], data["checkpoint_interval"])
            checkpoints = assign_checkpoint_etas(checkpoints, departure_time, route["distance_meters"], route["duration_seconds"])
            checkpoints = weather_service.annotate_checkpoints(checkpoints)
            risk_checkpoints = []
            for checkpoint in checkpoints:
                weather = checkpoint["weather"]
                if weather["status"] == "available":
                    risk = calculate_checkpoint_risk(
                        weather["wind_speed_mph"], weather["rain_rate_inches_per_hour"],
                        weather["snow_rate_inches_per_hour"], load_weight,
                    )
                    checkpoint = {**checkpoint, **risk}
                else:
                    has_unavailable_weather = True
                    checkpoint = {**checkpoint, "overall_risk": "UNAVAILABLE"}
                risk_checkpoints.append(checkpoint)
            planned_route = {**route, "checkpoints": risk_checkpoints}
            planned_routes.append(planned_route)
            if all(point["overall_risk"] != "UNAVAILABLE" for point in risk_checkpoints):
                recommendation_routes.append({**route, "checkpoints": risk_checkpoints[1:]})
    except (RoutingProviderError, WeatherProviderError) as error:
        raise RuntimeError(str(error)) from error
    except ValueError as error:
        raise TripValidationError(str(error)) from error

    if not routes:
        raise RuntimeError("The routing provider returned no routes")
    if has_unavailable_weather:
        recommendation = {
            "recommended_route_id": None,
            "reason": "No recommendation is available because weather forecasts are unavailable for one or more route checkpoints.",
            "routes": [],
        }
    else:
        recommendation = recommend_routes(recommendation_routes)
    return {"routes": planned_routes, "recommendation": recommendation}
