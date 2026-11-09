"""Open-Meteo forecast adapter matched to checkpoint ETAs."""

from datetime import datetime, timezone, timedelta

import requests

from routing.utils.risk_calculator import calculate_checkpoint_risk, RISK_PRIORITY


class WeatherProviderError(Exception):
    pass


def _coord_key(lat, lon):
    return (round(float(lat), 3), round(float(lon), 3))


class OpenMeteoWeatherService:
    forecast_url = "https://api.open-meteo.com/v1/forecast"

    def __init__(self, session=None, timeout_seconds=15):
        self.session = session or requests.Session()
        self.timeout_seconds = timeout_seconds
        self._cache = {}
        self._hourly_cache = {}

    def prefetch_corridor(self, coordinates, base_time=None):
        """Batch prefetch 3 days of hourly forecasts for corridor coordinates."""
        if not coordinates:
            return
        unique = []
        seen = set()
        for lat, lon in coordinates:
            key = _coord_key(lat, lon)
            if key not in seen and key not in self._hourly_cache:
                seen.add(key)
                unique.append((lat, lon))

        chunk_size = 50
        for i in range(0, len(unique), chunk_size):
            chunk = unique[i:i + chunk_size]
            try:
                response = self.session.get(
                    self.forecast_url,
                    params={
                        "latitude": [c[0] for c in chunk],
                        "longitude": [c[1] for c in chunk],
                        "hourly": "wind_speed_10m,rain,snowfall",
                        "wind_speed_unit": "mph",
                        "precipitation_unit": "inch",
                        "timezone": "UTC",
                        "forecast_days": 3,
                    },
                    timeout=self.timeout_seconds,
                )
                response.raise_for_status()
                payload = response.json()
                if not isinstance(payload, list):
                    payload = [payload]
                for coord, loc in zip(chunk, payload):
                    key = _coord_key(coord[0], coord[1])
                    self._hourly_cache[key] = loc.get("hourly", {})
            except Exception:
                pass

    def forecast_at(self, latitude, longitude, eta):
        if not isinstance(eta, datetime) or eta.tzinfo is None or eta.utcoffset() is None:
            raise ValueError("eta must be a timezone-aware datetime")
        eta_hour = eta.astimezone(timezone.utc).replace(minute=0, second=0, microsecond=0)
        cache_key = (latitude, longitude, eta_hour)
        if cache_key in self._cache:
            return self._cache[cache_key]

        target_time = eta_hour.strftime("%Y-%m-%dT%H:%M")
        coord_key = _coord_key(latitude, longitude)
        if coord_key in self._hourly_cache:
            hourly = self._hourly_cache[coord_key]
            times = hourly.get("time", [])
            if target_time in times:
                index = times.index(target_time)
                forecast = {
                    "status": "available",
                    "forecast_time": target_time + "+00:00",
                    "wind_speed_mph": hourly["wind_speed_10m"][index],
                    "rain_rate_inches_per_hour": hourly["rain"][index],
                    "snow_rate_inches_per_hour": hourly["snowfall"][index],
                }
                self._cache[cache_key] = forecast
                return forecast

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

    def get_corridor_timeline(self, coordinates, departure_time, load_weight, hours=49):
        """Generate 0-48h spatial corridor weather timeline."""
        if not isinstance(departure_time, datetime) or departure_time.tzinfo is None:
            return None
        dep_utc = departure_time.astimezone(timezone.utc).replace(minute=0, second=0, microsecond=0)
        intensity_map = {"LOW": 0.2, "MODERATE": 0.45, "HIGH": 0.7, "SEVERE": 0.9, "NO_TRAVEL": 1.0}

        timeline = []
        for h in range(hours):
            t_hour = dep_utc + timedelta(hours=h)
            time_str = t_hour.strftime("%Y-%m-%dT%H:00")
            iso_time = time_str + "+00:00"
            points = []
            for lat, lon in coordinates:
                key = _coord_key(lat, lon)
                hourly = self._hourly_cache.get(key)
                if not hourly or "time" not in hourly:
                    continue
                times = hourly.get("time", [])
                if time_str in times:
                    idx = times.index(time_str)
                    w = hourly["wind_speed_10m"][idx]
                    r = hourly["rain"][idx]
                    s = hourly["snowfall"][idx]
                    risk = calculate_checkpoint_risk(w, r, s, load_weight)
                    overall = risk["overall_risk"]
                    points.append({
                        "latitude": lat,
                        "longitude": lon,
                        "wind_speed_mph": w,
                        "rain_rate_inches_per_hour": r,
                        "snow_rate_inches_per_hour": s,
                        "overall_risk": overall,
                        "wind_risk": risk["wind_risk"],
                        "rain_risk": risk["rain_risk"],
                        "snow_risk": risk["snow_risk"],
                        "risk_score": RISK_PRIORITY.get(overall, 1),
                        "intensity": intensity_map.get(overall, 0.2),
                        "wind_intensity": min(1.0, round(w / 55.0, 3)),
                        "precip_intensity": min(1.0, round((r + s * 0.5) / 1.0, 3)),
                    })
            timeline.append({
                "hour_offset": h,
                "time": iso_time,
                "points": points,
            })
        return {
            "forecast_hours": list(range(hours)),
            "departure_time": dep_utc.isoformat(),
            "timeline": timeline,
        }
