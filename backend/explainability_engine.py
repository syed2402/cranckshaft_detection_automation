def _severity(value, review_limit, nok_limit):
    if value >= nok_limit:
        return "high"
    if value >= review_limit:
        return "moderate"
    return "acceptable"


def build_explanations(features, fusion_result):
    reasoning = []

    if fusion_result["decision"] == "HIGH CONFIDENCE OK":
        reasoning.append(
            {
                "title": "Dominant crown integrity maintained",
                "body": "Dominant crown region is continuous, smooth, and supported by acceptable SOP checks.",
                "severity": "acceptable",
                "type": "ok",
            }
        )

    for item in fusion_result["drivers"]:
        if item["state"] == "ok":
            continue
        reasoning.append(
            {
                "title": item["title"],
                "body": item["explanation"],
                "severity": item["severity"],
                "type": "nok" if item["state"] == "nok" else "review",
            }
        )

    if features.envelope_smoothness >= 82:
        reasoning.append(
            {
                "title": "Smooth macro envelope",
                "body": "Envelope variation remains gradual across the crown region.",
                "severity": "acceptable",
                "type": "ok",
            }
        )

    if features.plateau_oscillation >= 35:
        title = "Excessive oscillation detected" if features.plateau_oscillation >= 60 else "Moderate oscillation detected"
        reasoning.append(
            {
                "title": title,
                "body": f"Plateau oscillation score is {features.plateau_oscillation:.1f}/100.",
                "severity": _severity(features.plateau_oscillation, 35, 60),
                "type": "review" if features.plateau_oscillation < 60 else "nok",
            }
        )

    if features.concavity_detected:
        concavity_type = "nok" if fusion_result["concavity_state"] == "nok" else "review"
        if fusion_result["concavity_state"] == "ignored":
            concavity_type = "ok"
        reasoning.append(
            {
                "title": "Sustained concavity detected"
                if fusion_result["concavity_state"] != "ignored"
                else "Concavity within allowable local variation",
                "body": (
                    f"Concavity detected from {features.concavity_start:.3f}-{features.concavity_end:.3f} mm "
                    f"with {features.concavity_depth:.4f} depth at {features.concavity_location}."
                ),
                "severity": "acceptable" if concavity_type == "ok" else "high" if concavity_type == "nok" else "moderate",
                "type": concavity_type,
            }
        )

    seen = set()
    unique = []
    for block in reasoning:
        key = (block["title"], block["body"])
        if key not in seen:
            unique.append(block)
            seen.add(key)
    return unique
