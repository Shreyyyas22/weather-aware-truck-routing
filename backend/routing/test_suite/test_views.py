from unittest.mock import patch, Mock
from django.test import SimpleTestCase
from rest_framework.test import APIClient


class ViewsTestCase(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")

    def test_plan_routes_validation_error_returns_400(self):
        response = self.client.post("/api/routes/plan/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.json())

    def test_plan_routes_invalid_weight_returns_400(self):
        response = self.client.post("/api/routes/plan/", {
            "origin": "New York, NY",
            "destination": "Philadelphia, PA",
            "departure_time": "2026-11-10T08:00:00+00:00",
            "load_weight": -500,
            "checkpoint_interval": 25,
        }, format="json")
        self.assertEqual(response.status_code, 400)

    @patch("routing.views.plan_trip")
    def test_plan_routes_success(self, mock_plan_trip):
        mock_plan_trip.return_value = {
            "routes": [{"id": "route-1", "checkpoints": []}],
            "recommendation": {"recommended_route_id": "route-1", "reason": "Safest route"},
        }
        response = self.client.post("/api/routes/plan/", {
            "origin": "New York, NY",
            "destination": "Philadelphia, PA",
            "departure_time": "2026-11-10T08:00:00+00:00",
            "load_weight": 35000,
            "checkpoint_interval": 25,
        }, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["recommendation"]["recommended_route_id"], "route-1")
