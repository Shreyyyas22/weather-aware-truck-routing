# Product assumptions

## Weather risk rules

- Every classifier uses the lower boundary of the higher band. For example,
  `0.25 in/hr` rain is **High**, `0.50 in/hr` is **Severe**, and `1.00 in/hr`
  remains **Severe**.
- A checkpoint's overall risk is the highest of its wind (after load rules),
  rain, and snow risks. The response retains each individual risk so it can be
  explained in the UI.
- Measurements and load weight must be finite, numeric, and non-negative.
  Missing, malformed, negative, infinite, and NaN values are rejected rather
  than being classified as safe conditions.

## Later planning phases

- Routing uses TomTom's truck directions and geocoding APIs. Its
  response is normalized to route id, distance in meters, duration in seconds,
  and latitude/longitude route geometry before the rest of the application
  uses it. The service may return fewer than three alternatives; those routes
  remain valid and are shown as available options.
- A route with a **No Travel** checkpoint is unsafe and is excluded from
  recommendation whenever a route without one is available.
- If forecast data is unavailable for a checkpoint ETA, the checkpoint is
  labelled unavailable; current conditions are never substituted.
- Forecasts use Open-Meteo hourly wind, rain, and snowfall matched to the ETA
  hour in UTC. The API is requested in mph and inches; hourly precipitation
  amounts are treated as inches per hour for the assessment's rate thresholds.
- The initial checkpoint interval is 25 miles, with 10 and 50 miles available
  to the user.
- Recommendation average-risk mapping is Low=1, Moderate=2, High=3,
  Severe=4. No Travel is handled separately under the unsafe-route policy.
- Each checkpoint carries the mileage of the route segment ending at that
  checkpoint. Severe and High metrics are the sum of those segment miles, not
  a count of checkpoints. Average risk is mileage-weighted across traversable
  segments.
- ETA is initially proportional to cumulative route distance when segment-level
  travel times are unavailable. The supplied timezone-aware departure offset is
  retained until provider location timezones are available.
- Checkpoints are created at 10, 25, or 50-mile intervals along the routing
  provider's geometry. The start checkpoint represents zero miles; each later
  checkpoint represents the segment since the prior checkpoint, including the
  final partial segment.
