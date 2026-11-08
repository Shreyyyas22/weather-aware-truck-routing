from datetime import datetime

from django.test import SimpleTestCase

from routing.utils.etas import assign_checkpoint_etas


class EtaCalculationTestCase(SimpleTestCase):
    def test_etas_are_proportional_and_keep_departure_timezone(self):
        checkpoints = [
            {"id": "start", "cumulative_miles": 0},
            {"id": "middle", "cumulative_miles": 50},
            {"id": "end", "cumulative_miles": 100},
        ]
        departure = datetime.fromisoformat("2026-11-10T08:00:00-05:00")

        result = assign_checkpoint_etas(checkpoints, departure, 100 / 0.000621371, 7200)

        self.assertEqual(result[0]["eta"], "2026-11-10T08:00:00-05:00")
        self.assertEqual(result[1]["eta"], "2026-11-10T09:00:00-05:00")
        self.assertEqual(result[2]["eta"], "2026-11-10T10:00:00-05:00")
        self.assertNotIn("eta", checkpoints[0])

    def test_eta_can_cross_midnight(self):
        checkpoints = [
            {"id": "start", "cumulative_miles": 0},
            {"id": "end", "cumulative_miles": 10},
        ]
        departure = datetime.fromisoformat("2026-11-10T23:30:00+00:00")

        result = assign_checkpoint_etas(checkpoints, departure, 10 / 0.000621371, 7200)

        self.assertEqual(result[-1]["eta"], "2026-11-11T01:30:00+00:00")

    def test_rejects_naive_times_and_invalid_checkpoint_progress(self):
        with self.assertRaises(ValueError):
            assign_checkpoint_etas(
                [{"cumulative_miles": 0}], datetime(2026, 11, 10, 8), 1000, 600
            )
        with self.assertRaises(ValueError):
            assign_checkpoint_etas(
                [{"cumulative_miles": 2}, {"cumulative_miles": 1}],
                datetime.fromisoformat("2026-11-10T08:00:00+00:00"),
                10 / 0.000621371,
                600,
            )
