from datetime import datetime
from unittest.mock import Mock

from django.test import SimpleTestCase

from routing.services.weather_provider import OpenMeteoWeatherService


def response(payload):
    result = Mock()
    result.json.return_value = payload
    result.raise_for_status.return_value = None
    return result


class OpenMeteoWeatherServiceTestCase(SimpleTestCase):
    def setUp(self):
        self.session = Mock()
        self.service = OpenMeteoWeatherService(session=self.session)
        self.eta = datetime.fromisoformat("2026-11-10T08:30:00-05:00")

    def test_forecast_is_matched_to_eta_hour_and_normalized_units(self):
        self.session.get.return_value = response({"hourly": {
            "time": ["2026-11-10T13:00"], "wind_speed_10m": [35],
            "rain": [0.25], "snowfall": [0.5],
        }})
        forecast = self.service.forecast_at(40, -74, self.eta)
        self.assertEqual(forecast["wind_speed_mph"], 35)
        self.assertEqual(forecast["rain_rate_inches_per_hour"], 0.25)
        self.assertEqual(self.session.get.call_args.kwargs["params"]["wind_speed_unit"], "mph")

    def test_missing_hour_is_explicitly_unavailable(self):
        self.session.get.return_value = response({"hourly": {"time": [], "wind_speed_10m": [], "rain": [], "snowfall": []}})
        self.assertEqual(self.service.forecast_at(40, -74, self.eta)["status"], "unavailable")

    def test_annotation_does_not_substitute_weather_when_unavailable(self):
        self.session.get.return_value = response({"hourly": {"time": [], "wind_speed_10m": [], "rain": [], "snowfall": []}})
        result = self.service.annotate_checkpoints([{"latitude": 40, "longitude": -74, "eta": self.eta.isoformat()}])
        self.assertEqual(result[0]["weather"]["status"], "unavailable")
