def calculate_wind_risk(wind_speed):
    """
    Classify wind speed according to the assessment rules.

    wind_speed: Wind speed in miles per hour (mph)
    """

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

    risk_priority = {
        "LOW": 1,
        "MODERATE": 2,
        "HIGH": 3,
        "SEVERE": 4,
        "NO_TRAVEL": 5
    }

    risks = {
        "wind": wind_risk,
        "rain": rain_risk,
        "snow": snow_risk
    }

    overall_risk = max(
        risks.values(),
        key=lambda risk: risk_priority[risk]
    )

    return {
        "overall_risk": overall_risk,
        "wind_risk": wind_risk,
        "rain_risk": rain_risk,
        "snow_risk": snow_risk
    }