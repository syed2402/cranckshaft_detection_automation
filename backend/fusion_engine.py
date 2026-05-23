SOP_CHECKS = (
    ("Z1", "z1", "z1_pass", 0.500),
    ("Z2", "z2", "z2_pass", 0.500),
    ("Rk", "rk", "rk_pass", 1.200),
    ("Rpk", "rpk", "rpk_pass", 0.400),
)


def concavity_state(features):
    ignored = (
        features.concavity_depth < 0.005
        and features.concavity_length < 1.5
        and features.concavity_isolated
        and features.concavity_location in ["edge-left", "edge-right", "edge-adjacent"]
    )
    if not features.concavity_detected or ignored:
        return "ignored" if features.concavity_detected else "ok"
    if features.concavity_depth >= 0.015 or features.concavity_length >= 3.0 or features.concavity_location == "center":
        return "nok"
    return "review"


def threshold_proximity(features):
    near = []
    for label, value_attr, pass_attr, limit in SOP_CHECKS:
        value = getattr(features, value_attr)
        if getattr(features, pass_attr) and 0 <= limit - value <= limit * 0.15:
            near.append({"label": label, "value": value, "limit": limit})
    if features.crown_height_pass:
        low_margin = features.crown_height - 0.020
        high_margin = 0.060 - features.crown_height
        if min(low_margin, high_margin) <= 0.006:
            near.append({"label": "Crown height", "value": features.crown_height, "limit": 0.060})
    return near


def fuse_decision(features):
    drivers = []
    nok_votes = 0
    review_votes = 0

    failed_sop = [label for label, _, pass_attr, _ in SOP_CHECKS if not getattr(features, pass_attr)]
    if not features.crown_height_pass:
        failed_sop.append("Crown height")
    if failed_sop:
        nok_votes += 3
        drivers.append(
            {
                "state": "nok",
                "severity": "high",
                "title": "SOP threshold violation",
                "explanation": f"Failed deterministic SOP checks: {', '.join(failed_sop)}.",
            }
        )

    if features.crown_integrity_score < 55:
        nok_votes += 2
        drivers.append(
            {
                "state": "nok",
                "severity": "high",
                "title": "Crown integrity weakened",
                "explanation": "Macro crown envelope no longer maintains a stable dominant region.",
            }
        )
    elif features.crown_integrity_score < 72:
        review_votes += 1
        drivers.append(
            {
                "state": "review",
                "severity": "moderate",
                "title": "Borderline crown integrity",
                "explanation": "Crown integrity is below the preferred production band.",
            }
        )

    if features.symmetry_score < 55:
        nok_votes += 1
        drivers.append(
            {
                "state": "nok",
                "severity": "high",
                "title": "Symmetry drift exceeds limit",
                "explanation": "Left-right crown balance is outside acceptable deterministic limits.",
            }
        )
    elif features.symmetry_score < 68:
        review_votes += 1
        drivers.append(
            {
                "state": "review",
                "severity": "moderate",
                "title": "Symmetry below review limit",
                "explanation": "Profile symmetry is weakened and should be reviewed.",
            }
        )

    if features.plateau_oscillation > 60:
        nok_votes += 2
        drivers.append(
            {
                "state": "nok",
                "severity": "high",
                "title": "Excessive oscillation",
                "explanation": "Plateau waviness is sustained enough to affect crown continuity.",
            }
        )
    elif features.plateau_oscillation > 35:
        review_votes += 1
        drivers.append(
            {
                "state": "review",
                "severity": "moderate",
                "title": "Moderate oscillation detected",
                "explanation": "Plateau waviness is above the review band but below rejection level.",
            }
        )

    c_state = concavity_state(features)
    if c_state == "nok":
        nok_votes += 2
        drivers.append(
            {
                "state": "nok",
                "severity": "high",
                "title": "Sustained concavity exceeds limit",
                "explanation": (
                    f"Concavity spans {features.concavity_start:.3f}-{features.concavity_end:.3f} mm "
                    f"with length {features.concavity_length:.3f} mm."
                ),
            }
        )
    elif c_state == "review":
        review_votes += 1
        drivers.append(
            {
                "state": "review",
                "severity": "moderate",
                "title": "Concavity requires review",
                "explanation": "Concavity is measurable and not covered by local ignore logic.",
            }
        )

    if features.multi_peak_detected and features.peak_dominance < 55:
        nok_votes += 1
        drivers.append(
            {
                "state": "nok",
                "severity": "high",
                "title": "Multi-peak instability detected",
                "explanation": "Multiple significant peaks are present without a healthy dominant crown region.",
            }
        )
    elif features.multi_peak_detected or features.peak_dominance < 65:
        review_votes += 1
        drivers.append(
            {
                "state": "review",
                "severity": "moderate",
                "title": "Peak dominance reduced",
                "explanation": "Peak structure is less dominant than preferred for a stable crown envelope.",
            }
        )

    if abs(features.peak_offset) > 0.9:
        nok_votes += 1
        drivers.append(
            {
                "state": "nok",
                "severity": "high",
                "title": "Peak offset exceeds limit",
                "explanation": f"Dominant crown region is shifted {features.peak_offset:+.3f} mm from center.",
            }
        )
    elif abs(features.peak_offset) > 0.6:
        review_votes += 1
        drivers.append(
            {
                "state": "review",
                "severity": "moderate",
                "title": "Peak offset detected",
                "explanation": f"Dominant crown region is shifted {features.peak_offset:+.3f} mm from center.",
            }
        )

    near = threshold_proximity(features)
    if near:
        review_votes += 1
        drivers.append(
            {
                "state": "review",
                "severity": "moderate",
                "title": "SOP threshold proximity",
                "explanation": "One or more accepted measurements are close to deterministic SOP limits.",
            }
        )

    if features.center_dominance < 42 and features.crown_integrity_score < 70:
        nok_votes += 1
        drivers.append(
            {
                "state": "nok",
                "severity": "high",
                "title": "Dominant crown region collapsed",
                "explanation": "Center-region crown support is weak after broad-plateau compensation.",
            }
        )
    elif features.center_dominance < 55:
        review_votes += 1
        drivers.append(
            {
                "state": "review",
                "severity": "moderate",
                "title": "Dominant crown region reduced",
                "explanation": "Center-region crown support is below the preferred production band.",
            }
        )

    if nok_votes >= 2:
        decision = "HIGH CONFIDENCE NOK"
    elif nok_votes == 1 and review_votes >= 2:
        decision = "HIGH CONFIDENCE NOK"
    elif nok_votes or review_votes:
        decision = "REVIEW REQUIRED"
    else:
        decision = "HIGH CONFIDENCE OK"

    return {
        "decision": decision,
        "nok_votes": nok_votes,
        "review_votes": review_votes,
        "drivers": drivers,
        "threshold_proximity": near,
        "concavity_state": c_state,
    }
