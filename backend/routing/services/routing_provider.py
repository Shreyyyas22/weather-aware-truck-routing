"""TomTom adapter with a provider-independent route format."""

from dataclasses import dataclass
from math import isfinite
from urllib.parse import quote

import requests


class RoutingProviderError(Exception):
    """Base class for errors safe to present through the planning API."""


class RoutingConfigurationError(RoutingProviderError):
    pass


class LocationNotFoundError(RoutingProviderError):
    pass


class RoutingRequestError(RoutingProviderError):
    pass


@dataclass(frozen=True)
class Coordinate:
    latitude: float
    longitude: float

    def __post_init__(self):
        for field_name, value, lower, upper in (
            ("latitude", self.latitude, -90, 90),
            ("longitude", self.longitude, -180, 180),
        ):
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError(f"{field_name} must be a number")
            if not isfinite(value) or not lower <= value <= upper:
                raise ValueError(f"{field_name} is out of range")

    def as_tomtom_coordinate(self):
        return f"{self.latitude},{self.longitude}"


class TomTomRoutingService:
    """Retrieve truck routes without exposing TomTom response shapes upstream."""

    geocode_url = "https://api.tomtom.com/search/2/geocode"
    directions_url = "https://api.tomtom.com/routing/1/calculateRoute"

    def __init__(self, api_key, session=None, timeout_seconds=15):
        if not api_key:
            raise RoutingConfigurationError("TOMTOM_API_KEY is not configured")
        self.api_key = api_key
        self.session = session or requests.Session()
        self.timeout_seconds = timeout_seconds

    def geocode(self, location):
        if not isinstance(location, str) or not location.strip():
            raise ValueError("location must be a non-empty string")

        response = self._request(
            "get",
            f"{self.geocode_url}/{quote(location.strip())}.json",
            params={"key": self.api_key, "limit": 1},
        )
        results = response.get("results", [])
        if not results:
            raise LocationNotFoundError(f"No location found for '{location}'")

        try:
            position = results[0]["position"]
            latitude, longitude = position["lat"], position["lon"]
            return Coordinate(latitude=latitude, longitude=longitude)
        except (KeyError, TypeError, ValueError) as error:
            raise RoutingRequestError("The geocoding provider returned invalid coordinates") from error

    def get_route_alternatives(self, origin, destination, maximum_routes=3):
        if not isinstance(origin, Coordinate) or not isinstance(destination, Coordinate):
            raise ValueError("origin and destination must be Coordinate instances")
        if maximum_routes < 1:
            raise ValueError("maximum_routes must be at least 1")

        response = self._request(
            "get",
            f"{self.directions_url}/{origin.as_tomtom_coordinate()}:{destination.as_tomtom_coordinate()}/json",
            params={
                "key": self.api_key,
                "travelMode": "truck",
                # TomTom counts alternatives separately from the primary route.
                "maxAlternatives": max(0, min(maximum_routes - 1, 5)),
            },
        )
        provider_routes = response.get("routes", [])
        if not provider_routes:
            raise RoutingRequestError("The routing provider returned no routes")

        routes = [
            self._normalize_route(provider_route, index + 1)
            for index, provider_route in enumerate(provider_routes)
        ]
        return routes[:maximum_routes]

    def plan_routes(self, origin_text, destination_text, maximum_routes=3):
        """Geocode both endpoints and return as many alternatives as exist."""
        origin = self.geocode(origin_text)
        destination = self.geocode(destination_text)
        return self.get_route_alternatives(origin, destination, maximum_routes)

    def _request(self, method, url, **kwargs):
        try:
            response = getattr(self.session, method)(
                url, timeout=self.timeout_seconds, **kwargs
            )
            response.raise_for_status()
            return response.json()
        except requests.Timeout as error:
            raise RoutingRequestError("The routing provider timed out") from error
        except requests.RequestException as error:
            raise RoutingRequestError("The routing provider request failed") from error
        except ValueError as error:
            raise RoutingRequestError("The routing provider returned invalid JSON") from error

    @staticmethod
    def _normalize_route(provider_route, index):
        try:
            summary = provider_route["summary"]
            geometry = []
            for leg in provider_route["legs"]:
                for point in leg["points"]:
                    normalized_point = {
                        "longitude": point["longitude"],
                        "latitude": point["latitude"],
                    }
                    if not geometry or geometry[-1] != normalized_point:
                        geometry.append(normalized_point)
            distance_meters = summary["lengthInMeters"]
            duration_seconds = summary["travelTimeInSeconds"]
        except (KeyError, TypeError, ValueError) as error:
            raise RoutingRequestError("The routing provider returned an invalid route") from error

        if len(geometry) < 2:
            raise RoutingRequestError("The routing provider returned an incomplete route geometry")
        if not all(isfinite(value) and value > 0 for value in (distance_meters, duration_seconds)):
            raise RoutingRequestError("The routing provider returned invalid route metrics")

        return {
            "id": f"route-{index}",
            "distance_meters": distance_meters,
            "duration_seconds": duration_seconds,
            "geometry": geometry,
        }
