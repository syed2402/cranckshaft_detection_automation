import os
from datetime import datetime

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import database
from decision_engine import make_decision
from feature_extractor import extract_features
from models import OverrideRequest, ProfileUploadResponse
from parser import parse_profile_file
from preprocessor import preprocess_profile
from trend_engine import analyze_trend

UPLOAD_DIR = os.environ.get(
    "UPLOAD_DIR",
    os.path.join(os.path.dirname(__file__), "uploads")
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Crankshaft Profile DIS API")
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_raw_points(profile):
    if not profile or not profile.get("raw_file_path") or not os.path.exists(profile["raw_file_path"]):
        raise HTTPException(status_code=404, detail="Profile raw file not found.")
    with open(profile["raw_file_path"], "rb") as handle:
        return parse_profile_file(handle.read(), profile["profile_name"])


def _build_profile_payload(profile, include_analysis=True):
    raw_points = _load_raw_points(profile)
    preprocessed = preprocess_profile(raw_points)
    payload = {
        **profile,
        "profile_id": profile["id"],
        "filename": profile["profile_name"],
        "point_count": preprocessed["point_count"],
        "x_range": preprocessed["x_range"],
        "y_range": preprocessed["y_range"],
        "sampling_interval": preprocessed["sampling_interval"],
        "raw_points": raw_points,
        "smoothed_points": preprocessed["smoothed_points"],
    }
    if include_analysis:
        try:
            features = extract_features(raw_points, preprocessed["smoothed_points"], preprocessed["x_range"], preprocessed["y_range"])
            payload["features"] = features.model_dump()
            payload["decision_details"] = make_decision(features).model_dump() if profile.get("decision") else None
        except Exception:
            payload["features"] = database.get_features_by_profile_id(profile["id"])
            payload["decision_details"] = None
    return payload


@app.on_event("startup")
def startup():
    database.init_db()


@app.post("/api/upload", response_model=ProfileUploadResponse)
async def upload_profile(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        raw_points = parse_profile_file(file_bytes, file.filename)
        preprocessed = preprocess_profile(raw_points)
        safe_name = os.path.basename(file.filename)
        timestamp_name = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{safe_name}"
        raw_path = os.path.join(UPLOAD_DIR, timestamp_name)
        with open(raw_path, "wb") as handle:
            handle.write(file_bytes)
        timestamp = datetime.now().isoformat(timespec="seconds")
        profile_id = database.save_profile(
            {
                "timestamp": timestamp,
                "profile_name": safe_name,
                "raw_file_path": raw_path,
            }
        )
        return {
            "profile_id": profile_id,
            "filename": safe_name,
            "timestamp": timestamp,
            "point_count": preprocessed["point_count"],
            "x_range": preprocessed["x_range"],
            "y_range": preprocessed["y_range"],
            "sampling_interval": preprocessed["sampling_interval"],
            "raw_points": raw_points,
            "smoothed_points": preprocessed["smoothed_points"],
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}") from exc


@app.post("/api/analyze/{profile_id}")
def analyze_profile(profile_id: int):
    profile = database.get_profile_by_id(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    try:
        raw_points = _load_raw_points(profile)
        preprocessed = preprocess_profile(raw_points)
        features = extract_features(raw_points, preprocessed["smoothed_points"], preprocessed["x_range"], preprocessed["y_range"])
        decision = make_decision(features)
        database.save_features(profile_id, features)
        database.save_decision(profile_id, decision)
        previous = [p for p in database.get_all_profiles() if p["id"] != profile_id and database.get_features_by_profile_id(p["id"])]
        prev_id = previous[0]["id"] if previous else None
        prev_features = database.get_features_by_profile_id(prev_id) if prev_id else None
        trend_info = analyze_trend(profile_id, features, decision, prev_id, prev_features)
        database.save_trend(profile_id, trend_info)
        return {"features": features, "decision": decision, "trend_info": trend_info}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc


@app.get("/api/profiles")
def get_profiles():
    rows = []
    for profile in database.get_all_profiles():
        features = database.get_features_by_profile_id(profile["id"])
        enriched = {**profile, "features": features}
        if profile.get("raw_file_path") and os.path.exists(profile["raw_file_path"]):
            try:
                raw_points = _load_raw_points(profile)
                preprocessed = preprocess_profile(raw_points)
                enriched.update(
                    {
                        "point_count": preprocessed["point_count"],
                        "x_range": preprocessed["x_range"],
                        "y_range": preprocessed["y_range"],
                        "sampling_interval": preprocessed["sampling_interval"],
                    }
                )
            except Exception:
                pass
        rows.append(enriched)
    return rows


@app.get("/api/profiles/{profile_id}")
def get_profile(profile_id: int):
    profile = database.get_profile_by_id(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return _build_profile_payload(profile)


@app.delete("/api/profiles/{profile_id}")
def delete_profile(profile_id: int):
    profile = database.get_profile_by_id(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    raw_path = profile.get("raw_file_path")
    if raw_path:
        normalized_upload_dir = os.path.abspath(UPLOAD_DIR)
        normalized_raw_path = os.path.abspath(raw_path)
        if os.path.commonpath([normalized_upload_dir, normalized_raw_path]) == normalized_upload_dir and os.path.exists(normalized_raw_path):
            os.remove(normalized_raw_path)

    deleted = database.delete_profile(profile_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return {"success": True, "profile_id": profile_id}


@app.get("/api/trend")
def get_trend():
    rows = []
    for profile in database.get_trend_history(24):
        rows.append(
            {
                "profile_id": profile["id"],
                "profile_name": profile["profile_name"],
                "timestamp": profile["timestamp"],
                "decision": profile["decision"],
                "confidence": profile["confidence"],
                "crown_integrity": profile.get("crown_integrity") or 0,
                "peak_offset": profile.get("peak_offset") or 0,
                "symmetry_score": profile.get("symmetry_score") or 0,
                "oscillation_score": profile.get("oscillation_score") or 0,
                "risk_level": profile.get("risk_level"),
                "drift_score": profile.get("drift_score") or 0,
                "crown_integrity_trend": profile.get("crown_integrity_trend") or "stable",
                "symmetry_drift": profile.get("symmetry_drift") or 0,
                "oscillation_trend": profile.get("oscillation_trend") or "stable",
                "peak_offset_trend": profile.get("peak_offset_trend") or "stable",
            }
        )
    return rows


@app.post("/api/override")
def override(request: OverrideRequest):
    result = database.save_operator_override(
        request.profile_id, request.operator_decision, request.operator_notes, request.operator_name
    )
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Profile not found."))
    return result


@app.get("/api/stats")
def stats():
    profiles = database.get_all_profiles()
    total = len(profiles)
    counts = {}
    overrides = 0
    for profile in profiles:
        counts[profile.get("decision") or "UNANALYZED"] = counts.get(profile.get("decision") or "UNANALYZED", 0) + 1
        if profile.get("operator_override"):
            overrides += 1
    dates = [p["timestamp"] for p in profiles if p.get("timestamp")]
    storage = 0
    if os.path.exists(UPLOAD_DIR):
        storage = sum(os.path.getsize(os.path.join(root, name)) for root, _, files in os.walk(UPLOAD_DIR) for name in files)
    return {
        "total_profiles": total,
        "decision_counts": counts,
        "override_rate": round((overrides / total) * 100, 1) if total else 0,
        "agreement_rate": round(((total - overrides) / total) * 100, 1) if total else 0,
        "date_range": [min(dates), max(dates)] if dates else [],
        "storage_used": storage,
    }


if __name__ == "__main__":
    import uvicorn

    database.init_db()
    port = int(os.environ.get("PORT", "8765"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
