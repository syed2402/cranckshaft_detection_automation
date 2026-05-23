def _trend_direction(current, previous, tolerance, lower_is_better=False):
    delta = current - previous
    if abs(delta) <= tolerance:
        return "stable", delta
    improving = delta < 0 if lower_is_better else delta > 0
    return ("improving" if improving else "degrading"), delta


def _feature_value(features, key, default=0.0):
    if features is None:
        return default
    if isinstance(features, dict):
        return float(features.get(key, default) or default)
    return float(getattr(features, key, default) or default)


def analyze_trend(profile_id, features, decision, previous_profile_id=None, previous_features=None):
    current = {
        "crown_integrity_score": _feature_value(features, "crown_integrity_score"),
        "symmetry_score": _feature_value(features, "symmetry_score"),
        "peak_offset": _feature_value(features, "peak_offset"),
        "plateau_oscillation": _feature_value(features, "plateau_oscillation"),
    }
    previous = {
        "crown_integrity_score": _feature_value(previous_features, "crown_integrity_score", current["crown_integrity_score"]),
        "symmetry_score": _feature_value(previous_features, "symmetry_score", current["symmetry_score"]),
        "peak_offset": _feature_value(previous_features, "peak_offset", current["peak_offset"]),
        "plateau_oscillation": _feature_value(previous_features, "plateau_oscillation", current["plateau_oscillation"]),
    }

    crown_trend, crown_delta = _trend_direction(current["crown_integrity_score"], previous["crown_integrity_score"], 3.0)
    symmetry_trend, symmetry_delta = _trend_direction(current["symmetry_score"], previous["symmetry_score"], 3.0)
    oscillation_trend, oscillation_delta = _trend_direction(
        current["plateau_oscillation"], previous["plateau_oscillation"], 5.0, lower_is_better=True
    )
    current_offset = abs(current["peak_offset"])
    previous_offset = abs(previous["peak_offset"])
    peak_offset_trend, offset_delta = _trend_direction(current_offset, previous_offset, 0.1, lower_is_better=True)

    drift_score = round(
        abs(crown_delta) * 0.35
        + abs(symmetry_delta) * 0.25
        + abs(oscillation_delta) * 0.25
        + abs(offset_delta) * 20.0 * 0.15,
        2,
    )

    degrading_count = [crown_trend, symmetry_trend, oscillation_trend, peak_offset_trend].count("degrading")
    if decision.decision == "HIGH CONFIDENCE NOK" or drift_score >= 14 or degrading_count >= 3:
        risk = "unstable"
    elif decision.decision == "REVIEW REQUIRED" or drift_score >= 7 or degrading_count >= 2:
        risk = "degrading"
    else:
        risk = "stable"

    notes = []
    if previous_profile_id:
        notes.append(f"Compared with profile {previous_profile_id}.")
    else:
        notes.append("No historical baseline available; current profile starts the trend baseline.")
    notes.append(f"Crown integrity trend is {crown_trend}.")
    notes.append(f"Symmetry drift is {symmetry_delta:+.1f} points.")
    notes.append(f"Oscillation trend is {oscillation_trend}.")
    notes.append(f"Peak offset trend is {peak_offset_trend}.")

    return {
        "profile_id": profile_id,
        "previous_profile_id": previous_profile_id,
        "drift_score": drift_score,
        "risk_level": risk,
        "crown_integrity_trend": crown_trend,
        "symmetry_drift": round(symmetry_delta, 2),
        "oscillation_trend": oscillation_trend,
        "peak_offset_trend": peak_offset_trend,
        "notes": notes,
    }
