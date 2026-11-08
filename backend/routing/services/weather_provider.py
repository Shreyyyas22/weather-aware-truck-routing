"""Open-Meteo forecast adapter matched to checkpoint ETAs."""

from datetime import datetime, timezone

import requests


class WeatherProviderError(Exception):
    pass


class OpenMeteoWeatherService:
    forecast_url = "https://api.open-meteo.com/v1/forecast"

    def __init__(self, session=None, timeout_seconds=15):
        self.session = session or requests.Session()
        self.timeout_seconds = timeout_seconds
        self._cache = {}

    def forecast_at(self, latitude, longitude, eta):
        if not isinstance(eta, datetime) or eta.tzinfo is None or eta.utcoffset() is None:
            raise ValueError("eta must be a timezone-aware datetime")
        eta_hour = eta.astimezone(timezone.utc).replace(minute=0, second=0, microsecond=0)
        cache_key = (latitude, longitude, eta_hour)
        if cache_key in self._cache:
            return self._cache[cache_key]

        try:
            response = self.session.get(
                self.forecast_url,
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "hourly": "wind_speed_10m,rain,snowfall",
                    "wind_speed_unit": "mph",
                    "precipitation_unit": "inch",
                    "timezone": "UTC",
                    "start_date": eta_hour.date().isoformat(),
                    "end_date": eta_hour.date().isoformat(),
                },
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
        except requests.Timeout as error:
            raise WeatherProviderError("The weather provider timed out") from error
        except requests.RequestException as error:
            raise WeatherProviderError("The weather provider request failed") from error
        except ValueError as error:
            raise WeatherProviderError("The weather provider returned invalid JSON") from error

        hourly = payload.get("hourly", {})
        target_time = eta_hour.strftime("%Y-%m-%dT%H:%M")
        try:
            index = hourly["time"].index(target_time)
            forecast = {
                "status": "available",
                "forecast_time": target_time + "+00:00",
                "wind_speed_mph": hourly["wind_speed_10m"][index],
                "rain_rate_inches_per_hour": hourly["rain"][index],
                "snow_rate_inches_per_hour": hourly["snowfall"][index],
            }
        except (KeyError, ValueError, IndexError):
            forecast = {"status": "unavailable", "forecast_time": target_time + "+00:00"}
        self._cache[cache_key] = forecast
        return forecast

    def annotate_checkpoints(self, checkpoints):
        result = []
        for checkpoint in checkpoints:
            try:
                eta = datetime.fromisoformat(checkpoint["eta"])
                weather = self.forecast_at(checkpoint["latitude"], checkpoint["longitude"], eta)
            except (KeyError, TypeError, ValueError, WeatherProviderError) as error:
                weather = {"status": "unavailable", "reason": str(error)}
            result.append({**checkpoint, "weather": weather})
        return result
