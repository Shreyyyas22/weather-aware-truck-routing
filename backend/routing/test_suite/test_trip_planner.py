from django.test import SimpleTestCase

from routing.services.trip_planner import plan_trip


class FakeRoutingService:
    def plan_routes(self, origin, destination, maximum_routes):
        return [{"id": "route-1", "distance_meters": 20 / 0.000621371,
                 "duration_seconds": 3600,
                 "geometry": [{"latitude": 0, "longitude": 0}, {"latitude": 0, "longitude": 20 / 69.1}]}]


class FakeWeatherService:
    def annotate_checkpoints(self, checkpoints):
        return [{**checkpoint, "weather": {"status": "available", "wind_speed_mph": 10,
                 "rain_rate_inches_per_hour": 0, "snow_rate_inches_per_hour": 0}} for checkpoint in checkpoints]


class TripPlannerTestCase(SimpleTestCase):
    def test_complete_plan_returns_checkpoint_risk_and_recommendation(self):
        result = plan_trip({"origin": "A", "destination": "B", "departure_time": "2026-11-10T08:00:00+00:00",
                            "load_weight": 30000, "checkpoint_interval": 10}, FakeRoutingService(), FakeWeatherService())
        self.assertEqual(result["recommendation"]["recommended_route_id"], "route-1")
        self.assertEqual(result["routes"][0]["checkpoints"][0]["overall_risk"], "LOW")
