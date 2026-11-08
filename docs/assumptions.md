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

- A route with a **No Travel** checkpoint is unsafe and is excluded from
  recommendation whenever a route without one is available.
- If forecast data is unavailable for a checkpoint ETA, the checkpoint is
  labelled unavailable; current conditions are never substituted.
- The initial checkpoint interval is 25 miles, with 10 and 50 miles available
  to the user.
- Recommendation average-risk mapping is Low=1, Moderate=2, High=3,
  Severe=4. No Travel is handled separately under the unsafe-route policy.
- ETA is initially proportional to cumulative route distance when segment-level
  travel times are unavailable.
