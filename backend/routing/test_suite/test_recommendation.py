from django.test import SimpleTestCase

from routing.utils.recommendation import recommend_routes, summarize_route


def route(route_id, duration, *segments):
    return {
        "id": route_id,
        "duration_seconds": duration,
        "checkpoints": [
            {"overall_risk": risk, "segment_miles": miles}
            for risk, miles in segments
        ],
    }


class RouteSummaryTestCase(SimpleTestCase):
    def test_summary_uses_segment_miles_not_checkpoint_count(self):
        summary = summarize_route(
            route("a", 3600, ("SEVERE", 2), ("HIGH", 10), ("LOW", 8))
        )

        self.assertEqual(summary["severe_miles"], 2)
        self.assertEqual(summary["high_miles"], 10)
        self.assertEqual(summary["average_risk"], 2.3)
        self.assertEqual(summary["total_miles"], 20)


class RecommendationTestCase(SimpleTestCase):
    def test_fewer_severe_miles_wins_before_every_other_priority(self):
        result = recommend_routes([
            route("safer", 7200, ("SEVERE", 1), ("HIGH", 20)),
            route("faster", 1800, ("SEVERE", 2), ("LOW", 20)),
        ])

        self.assertEqual(result["recommended_route_id"], "safer")
        self.assertIn("Severe-risk miles", result["reason"])

    def test_high_risk_miles_breaks_a_severe_miles_tie(self):
        result = recommend_routes([
            route("fewer-high", 7200, ("SEVERE", 2), ("HIGH", 1), ("LOW", 10)),
            route("more-high", 1800, ("SEVERE", 2), ("HIGH", 2), ("LOW", 10)),
        ])

        self.assertEqual(result["recommended_route_id"], "fewer-high")
        self.assertIn("High-risk miles", result["reason"])

    def test_average_risk_breaks_a_severe_and_high_miles_tie(self):
        result = recommend_routes([
            route("lower-average", 7200, ("HIGH", 2), ("LOW", 8)),
            route("higher-average", 1800, ("HIGH", 2), ("MODERATE", 8)),
        ])

        self.assertEqual(result["recommended_route_id"], "lower-average")
        self.assertIn("average weather-risk", result["reason"])

    def test_duration_breaks_all_risk_metric_ties(self):
        result = recommend_routes([
            route("shorter", 1800, ("HIGH", 2), ("LOW", 8)),
            route("longer", 3600, ("HIGH", 2), ("LOW", 8)),
        ])

        self.assertEqual(result["recommended_route_id"], "shorter")
        self.assertIn("shorter estimated travel time", result["reason"])

    def test_no_travel_route_is_excluded_when_safe_route_exists(self):
        result = recommend_routes([
            route("unsafe", 1800, ("NO_TRAVEL", 1), ("LOW", 10)),
            route("safe", 7200, ("SEVERE", 4), ("LOW", 10)),
        ])

        self.assertEqual(result["recommended_route_id"], "safe")

    def test_no_route_is_recommended_when_every_option_is_unsafe(self):
        result = recommend_routes([
            route("unsafe-a", 1800, ("NO_TRAVEL", 1)),
            route("unsafe-b", 7200, ("NO_TRAVEL", 1)),
        ])

        self.assertIsNone(result["recommended_route_id"])
        self.assertIn("every option", result["reason"])
