from django.test import SimpleTestCase

from routing.utils.risk_calculator import calculate_wind_risk, calculate_rain_risk, calculate_snow_risk, apply_load_rules, calculate_checkpoint_risk


class WindRiskTestCase(SimpleTestCase):

    def test_wind_risk_classification(self):

        test_cases = [
            (20, "LOW"),
            (25, "MODERATE"),
            (34, "MODERATE"),
            (35, "HIGH"),
            (44, "HIGH"),
            (45, "SEVERE"),
            (54, "SEVERE"),
            (55, "NO_TRAVEL"),
            (65, "NO_TRAVEL"),
        ]

        for wind_speed, expected_risk in test_cases:
            with self.subTest(wind_speed=wind_speed):
                result = calculate_wind_risk(wind_speed)

                self.assertEqual(result, expected_risk)


class RainRiskTestCase(SimpleTestCase):

    def test_rain_risk_classification(self):

        test_cases = [
            (0.05, "LOW"),
            (0.10, "MODERATE"),
            (0.20, "MODERATE"),
            (0.25, "HIGH"),
            (0.40, "HIGH"),
            (0.50, "SEVERE"),
            (1.00, "SEVERE"),
            (1.01, "NO_TRAVEL"),
        ]

        for rain_rate, expected_risk in test_cases:
            with self.subTest(rain_rate=rain_rate):
                result = calculate_rain_risk(rain_rate)

                self.assertEqual(result, expected_risk)


class SnowRiskTestCase(SimpleTestCase):

    def test_snow_risk_classification(self):

        test_cases = [
            (0.3, "LOW"),
            (0.5, "MODERATE"),
            (0.9, "MODERATE"),
            (1.0, "HIGH"),
            (1.9, "HIGH"),
            (2.0, "SEVERE"),
            (3.0, "SEVERE"),
            (3.1, "NO_TRAVEL"),
        ]

        for snow_rate, expected_risk in test_cases:
            with self.subTest(snow_rate=snow_rate):
                result = calculate_snow_risk(snow_rate)

                self.assertEqual(result, expected_risk)

class LoadRulesTestCase(SimpleTestCase):

    def test_load_rules(self):

        test_cases = [
            # Wind >= 55: No Travel for every load
            (55, 20000, "NO_TRAVEL"),
            (60, 50000, "NO_TRAVEL"),

            # Wind 45-54 and load > 30000
            (48, 35000, "NO_TRAVEL"),

            # Wind 45-54 and load <= 30000
            (48, 30000, "SEVERE"),

            # Wind 35-44 and load > 40000
            (40, 45000, "SEVERE"),

            # Wind 35-44 and load <= 40000
            (40, 40000, "HIGH"),

            # Normal wind classification
            (20, 50000, "LOW"),
            (30, 20000, "MODERATE"),
        ]

        for wind, load, expected_risk in test_cases:

            with self.subTest(wind=wind, load=load):

                result = apply_load_rules(wind, load)

                self.assertEqual(result, expected_risk)


class CheckpointRiskTestCase(SimpleTestCase):

    def test_checkpoint_risk(self):

        result = calculate_checkpoint_risk(
            wind_speed=40,
            rain_rate=0.60,
            snow_rate=0.30,
            load_weight=35000
        )

        self.assertEqual(result["wind_risk"], "HIGH")
        self.assertEqual(result["rain_risk"], "SEVERE")
        self.assertEqual(result["snow_risk"], "LOW")
        self.assertEqual(result["overall_risk"], "SEVERE")

    def test_checkpoint_no_travel(self):

        result = calculate_checkpoint_risk(
            wind_speed=55,
            rain_rate=0.05,
            snow_rate=0.30,
            load_weight=20000
        )

        self.assertEqual(result["overall_risk"], "NO_TRAVEL")


class InvalidMeasurementTestCase(SimpleTestCase):

    def test_invalid_measurements_raise_value_error(self):
        invalid_values = [None, "25", -0.01, float("inf"), float("nan"), True]

        for value in invalid_values:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    calculate_wind_risk(value)

    def test_invalid_load_weight_raises_value_error(self):
        for value in [None, "30000", -1, float("inf"), True]:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    apply_load_rules(40, value)
