from confidence_engine import compute_confidence
from explainability_engine import build_explanations
from fusion_engine import fuse_decision
from models import DecisionResponse


def make_decision(features):
    fusion = fuse_decision(features)
    decision = fusion["decision"]
    reasons = build_explanations(features, fusion)

    zones = []
    if features.concavity_detected:
        zones.append(
            {
                "start": features.concavity_start,
                "end": features.concavity_end,
                "type": "concavity",
                "label": "Concavity",
            }
        )

    confidence = compute_confidence(features, decision, fusion)
    return DecisionResponse(
        decision=decision,
        confidence=confidence["score"],
        positive_factors=confidence["positive_factors"],
        negative_factors=confidence["negative_factors"],
        reasoning=reasons,
        anomaly_zones=zones,
    )
