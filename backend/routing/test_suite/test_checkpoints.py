from django.test import SimpleTestCase

from routing.utils.checkpoints import distance_miles, generate_checkpoints


class CheckpointGenerationTestCase(SimpleTestCase):
    def test_short_route_includes_start_and_final_partial_segment(self):
        geometry = [
            {"latitude": 0, "longitude": 0},
            {"latitude": 0, "longitude": 0.1},
        ]

        checkpoints = generate_checkpoints(geometry, 25)

        self.assertEqual(len(checkpoints), 2)
        self.assertEqual(checkpoints[0]["segment_miles"], 0)
        self.assertAlmostEqual(checkpoints[-1]["segment_miles"], 6.91, places=1)
        self.assertEqual(checkpoints[-1]["longitude"], 0.1)

    def test_checkpoints_follow_curved_geometry(self):
        geometry = [
            {"latitude": 0, "longitude": 0},
            {"latitude": 0, "longitude": 1},
            {"latitude": 1, "longitude": 1},
        ]

        checkpoints = generate_checkpoints(geometry, 50)

        self.assertEqual(len(checkpoints), 4)
        self.assertAlmostEqual(checkpoints[1]["cumulative_miles"], 50)
        self.assertEqual(checkpoints[1]["latitude"], 0)
        self.assertAlmostEqual(checkpoints[1]["longitude"], 50 / 69.1, places=2)
        self.assertAlmostEqual(checkpoints[2]["cumulative_miles"], 100)
        self.assertAlmostEqual(checkpoints[2]["longitude"], 1)
        self.assertGreater(checkpoints[-1]["segment_miles"], 0)

    def test_exact_interval_does_not_duplicate_final_checkpoint(self):
        geometry = [
            {"latitude": 0, "longitude": 0},
            {"latitude": 0, "longitude": 1},
        ]
        total_distance = distance_miles(*geometry)

        # The point is deliberately constructed at exactly 10 miles on the
        # equator, avoiding a duplicate terminal checkpoint.
        ten_mile_geometry = [
            geometry[0],
            {"latitude": 0, "longitude": 10 / total_distance},
        ]
        checkpoints = generate_checkpoints(ten_mile_geometry, 10)

        self.assertEqual(len(checkpoints), 2)
        self.assertAlmostEqual(checkpoints[-1]["cumulative_miles"], 10, places=6)

    def test_rejects_invalid_interval_and_geometry(self):
        with self.assertRaises(ValueError):
            generate_checkpoints([], 25)
        with self.assertRaises(ValueError):
            generate_checkpoints([
                {"latitude": 0, "longitude": 0},
                {"latitude": 0, "longitude": 1},
            ], 20)
