from typing import List, Optional

from pydantic import BaseModel


class Point(BaseModel):
    x: float
    y: float


class ProfileUploadResponse(BaseModel):
    profile_id: int
    filename: str
    timestamp: str
    point_count: int
    x_range: List[float]
    y_range: List[float]
    sampling_interval: float
    raw_points: List[Point]
    smoothed_points: List[Point]


class FeaturesResponse(BaseModel):
    z1: float
    z2: float
    rk: float
    rpk: float
    z1_pass: bool
    z2_pass: bool
    rk_pass: bool
    rpk_pass: bool
    crown_height: float
    crown_height_pass: bool
    crown_integrity_score: float
    convexity_continuity: float
    center_dominance: float
    symmetry_score: float
    envelope_smoothness: float
    edge_smoothness: float
    peak_x: float
    peak_y: float
    peak_offset: float
    peak_width: float
    peak_dominance: float
    multi_peak_detected: bool
    secondary_peak_count: int
    concavity_detected: bool
    concavity_start: float
    concavity_end: float
    concavity_length: float
    concavity_depth: float
    concavity_location: str
    concavity_isolated: bool
    plateau_oscillation: float


class Factor(BaseModel):
    factor: str
    points: float


class ReasoningBlock(BaseModel):
    title: str
    body: str
    severity: str
    type: str


class AnomalyZone(BaseModel):
    start: float
    end: float
    type: str
    label: str


class DecisionResponse(BaseModel):
    decision: str
    confidence: float
    positive_factors: List[Factor]
    negative_factors: List[Factor]
    reasoning: List[ReasoningBlock]
    anomaly_zones: List[AnomalyZone]


class OverrideRequest(BaseModel):
    profile_id: int
    operator_decision: str
    operator_notes: str = ""
    operator_name: str = "Operator"


class TrendInfo(BaseModel):
    previous_profile_id: Optional[int] = None
    drift_score: float
    risk_level: str
    crown_integrity_trend: str
    symmetry_drift: float
    oscillation_trend: str
    peak_offset_trend: str
    notes: List[str]


class AnalyzeResponse(BaseModel):
    features: FeaturesResponse
    decision: DecisionResponse
    trend_info: TrendInfo


class ProfileRecord(BaseModel):
    id: int
    timestamp: str
    profile_name: str
    decision: Optional[str] = None
    confidence: Optional[float] = None
    raw_file_path: Optional[str] = None
    operator_override: Optional[str] = None
    features: Optional[dict] = None
