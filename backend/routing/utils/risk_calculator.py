from math import isfinite


RISK_PRIORITY = {
    "LOW": 1,
    "MODERATE": 2,
    "HIGH": 3,
    "SEVERE": 4,
    "NO_TRAVEL": 5,
}


def _validate_non_negative_number(value, field_name):
    """Return a valid physical measurement or raise a useful error."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{field_name} must be a finite non-negative number")
    if not isfinite(value) or value < 0:
        raise ValueError(f"{field_name} must be a finite non-negative number")
    return value


def calculate_wind_risk(wind_speed):
    """
    Classify wind speed according to the assessment rules.

    wind_speed: Wind speed in miles per hour (mph)
    """

    wind_speed = _validate_non_negative_number(wind_speed, "wind_speed")

    if wind_speed < 25:
        return "LOW"

    elif wind_speed < 35:
        return "MODERATE"

    elif wind_speed < 45:
        return "HIGH"

    elif wind_speed < 55:
        return "SEVERE"

    else:
        return "NO_TRAVEL"


def calculate_rain_risk(rain_rate):
    """
    Classify rainfall intensity.

    rain_rate: Rainfall in inches per hour.
    """

    rain_rate = _validate_non_negative_number(rain_rate, "rain_rate")

    if rain_rate < 0.10:
        return "LOW"

    elif rain_rate < 0.25:
        return "MODERATE"

    elif rain_rate < 0.50:
        return "HIGH"

    elif rain_rate <= 1.00:
        return "SEVERE"

    else:
        return "NO_TRAVEL"


def calculate_snow_risk(snow_rate):
    """
    Classify snowfall intensity.

    snow_rate: Snowfall in inches per hour.
    """

    snow_rate = _validate_non_negative_number(snow_rate, "snow_rate")

    if snow_rate < 0.5:
        return "LOW"

    elif snow_rate < 1.0:
        return "MODERATE"

    elif snow_rate < 2.0:
        return "HIGH"

    elif snow_rate <= 3.0:
        return "SEVERE"

    else:
        return "NO_TRAVEL"


def apply_load_rules(wind_speed, load_weight):
    """
    Apply truck load-specific wind risk rules.

    wind_speed: Wind speed in mph
    load_weight: Truck load in pounds
    """

    wind_speed = _validate_non_negative_number(wind_speed, "wind_speed")
    load_weight = _validate_non_negative_number(load_weight, "load_weight")

    # Rule 1: Wind >= 55 mph
    if wind_speed >= 55:
        return "NO_TRAVEL"

    # Rule 2: Wind 45-54 mph and load > 30,000 lb
    if wind_speed >= 45 and load_weight > 30000:
        return "NO_TRAVEL"

    # Rule 3: Wind 35-44 mph and load > 40,000 lb
    if wind_speed >= 35 and load_weight > 40000:
        return "SEVERE"

    # Return normal wind classification if no load rule applies
    return calculate_wind_risk(wind_speed)


def calculate_checkpoint_risk(
    wind_speed,
    rain_rate,
    snow_rate,
    load_weight
):
    """
    Calculate the overall weather risk at a checkpoint.
    """

    wind_risk = apply_load_rules(wind_speed, load_weight)

    rain_risk = calculate_rain_risk(rain_rate)

    snow_risk = calculate_snow_risk(snow_rate)

    risks = {
        "wind": wind_risk,
        "rain": rain_risk,
        "snow": snow_risk
    }

    overall_risk = max(
        risks.values(),
        key=lambda risk: RISK_PRIORITY[risk]
    )

    return {
        "overall_risk": overall_risk,
        "wind_risk": wind_risk,
        "rain_risk": rain_risk,
        "snow_risk": snow_risk
    }
