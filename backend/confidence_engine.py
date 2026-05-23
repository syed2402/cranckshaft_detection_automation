def _tier1_values(features):
    return [
        ("Z1 near threshold", features.z1, 0.500),
        ("Z2 near threshold", features.z2, 0.500),
        ("Rk near threshold", features.rk, 1.200),
        ("Rpk near threshold", features.rpk, 0.400),
    ]


def _concavity_ignored(features):
    return (
        features.concavity_depth < 0.005
        and features.concavity_length < 1.5
        and features.concavity_isolated
        and features.concavity_location in ["edge-left", "edge-right", "edge-adjacent"]
    )


def compute_confidence(features, decision, fusion_result=None):
    score = 55.0
    positive = []
    negative = []

    def add_positive(name, points):
        nonlocal score
        score += points
        positive.append({"factor": name, "points": points})

    def add_negative(name, points):
        nonlocal score
        score += points
        negative.append({"factor": name, "points": points})

    if features.crown_integrity_score >= 82:
        add_positive("Strong dominant crown envelope", 13)
    elif features.crown_integrity_score >= 72:
        add_positive("Acceptable crown integrity", 8)
    if features.envelope_smoothness >= 82:
        add_positive("Smooth macro envelope", 11)
    elif features.envelope_smoothness >= 72:
        add_positive("Acceptable envelope smoothness", 6)
    if features.plateau_oscillation < 22:
        add_positive("Low plateau oscillation", 10)
    if all([features.z1_pass, features.z2_pass, features.rk_pass, features.rpk_pass, features.crown_height_pass]):
        add_positive("No Tier 1 violations", 8)
    if features.edge_smoothness > 80:
        add_positive("Clean edge transitions", 7)
    if features.convexity_continuity > 75:
        add_positive("Healthy macro envelope continuity", 6)
    if features.symmetry_score > 82:
        add_positive("Stable symmetry", 7)
    if features.peak_dominance >= 76:
        add_positive("Dominant crown region", 8)

    if abs(features.peak_offset) > 0.8:
        add_negative("Peak offset exceeds 0.8mm", -14)
    elif abs(features.peak_offset) > 0.5:
        add_negative("Peak offset exceeds 0.5mm", -8)
    if features.symmetry_score < 70:
        add_negative("Symmetry score below 70", -10)
    elif features.symmetry_score < 80:
        add_negative("Symmetry score below 80", -5)
    if features.concavity_detected and not _concavity_ignored(features):
        penalty = -13 if features.concavity_length >= 3.0 or features.concavity_depth >= 0.015 else -7
        add_negative("Sustained concavity detected", penalty)
    if features.center_dominance < 65:
        add_negative("Dominant crown region below 65", -6)
    if features.plateau_oscillation > 35:
        penalty = -14 if features.plateau_oscillation > 60 else -8
        add_negative("Excessive oscillation" if features.plateau_oscillation > 60 else "Plateau oscillation above 35", penalty)
    if features.multi_peak_detected:
        add_negative("Multi-peak instability detected", -12)
    if features.peak_dominance < 55:
        add_negative("Peak dominance below 55", -8)
    if features.crown_integrity_score < 65:
        add_negative("Crown integrity below 65", -10)

    for label, value, threshold in _tier1_values(features):
        margin = threshold - value
        if 0 <= margin <= threshold * 0.15:
            add_negative(label, -4)
        if 0 <= margin <= threshold * 0.05:
            add_negative(f"{label} within 5%", -2)

    if fusion_result:
        score -= fusion_result.get("nok_votes", 0) * 7
        score -= fusion_result.get("review_votes", 0) * 3

    score = max(5, min(98, score))
    if decision == "HIGH CONFIDENCE OK":
        score = max(75, score)
    elif decision == "HIGH CONFIDENCE NOK":
        score = min(32, max(8, score))
    else:
        score = max(40, min(74, score))

    return {"score": round(score, 1), "positive_factors": positive, "negative_factors": negative}
