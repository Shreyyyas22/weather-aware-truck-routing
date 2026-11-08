from unittest.mock import Mock

import requests
from django.test import SimpleTestCase

from routing.services.routing_provider import (
    Coordinate,
    LocationNotFoundError,
    TomTomRoutingService,
    RoutingConfigurationError,
    RoutingRequestError,
)


def response(payload, status_error=None):
    fake_response = Mock()
    fake_response.json.return_value = payload
    fake_response.raise_for_status.side_effect = status_error
    return fake_response


class TomTomRoutingServiceTestCase(SimpleTestCase):
    def setUp(self):
        self.session = Mock()
        self.provider = TomTomRoutingService("test-key", session=self.session)

    def test_geocode_returns_normalized_coordinate(self):
        self.session.get.return_value = response({
            "results": [{"position": {"lat": 40.7128, "lon": -74.006}}]
        })

        result = self.provider.geocode("New York")

        self.assertEqual(result, Coordinate(latitude=40.7128, longitude=-74.006))
        self.session.get.assert_called_once()

    def test_geocode_rejects_unknown_location(self):
        self.session.get.return_value = response({"results": []})

        with self.assertRaises(LocationNotFoundError):
            self.provider.geocode("Not a real place")

    def test_routes_are_normalized_and_limited_to_three(self):
        routes = [
            {
                "summary": {"lengthInMeters": 1000, "travelTimeInSeconds": 120},
                "legs": [{"points": [
                    {"latitude": 40, "longitude": -74},
                    {"latitude": 41, "longitude": -73},
                ]}],
            }
            for _ in range(4)
        ]
        self.session.get.return_value = response({"routes": routes})

        routes = self.provider.get_route_alternatives(
            Coordinate(40, -74), Coordinate(41, -73)
        )

        self.assertEqual(len(routes), 3)
        self.assertEqual(routes[0]["distance_meters"], 1000)
        self.assertEqual(routes[0]["geometry"][0], {"longitude": -74, "latitude": 40})
        self.assertEqual(routes[2]["id"], "route-3")
        self.assertEqual(self.session.get.call_args.kwargs["params"]["travelMode"], "truck")
        self.assertEqual(self.session.get.call_args.kwargs["params"]["maxAlternatives"], 2)

    def test_provider_timeout_is_a_clear_domain_error(self):
        self.session.get.side_effect = requests.Timeout()

        with self.assertRaisesRegex(RoutingRequestError, "timed out"):
            self.provider.geocode("New York")

    def test_provider_http_failure_is_a_clear_domain_error(self):
        self.session.get.return_value = response({}, requests.HTTPError())

        with self.assertRaisesRegex(RoutingRequestError, "request failed"):
            self.provider.geocode("New York")

    def test_missing_key_is_rejected(self):
        with self.assertRaises(RoutingConfigurationError):
            TomTomRoutingService("")
