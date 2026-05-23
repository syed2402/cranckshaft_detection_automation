import json
import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crankshaft.db"))


def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the PRD Section 18 tables exactly."""
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                profile_name TEXT,
                decision TEXT,
                confidence REAL,
                raw_file_path TEXT,
                operator_override TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS features (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id INTEGER,
                crown_integrity REAL,
                symmetry_score REAL,
                peak_offset REAL,
                peak_dominance REAL,
                concavity_length REAL,
                concavity_depth REAL,
                oscillation_score REAL,
                multi_peak_score REAL,
                FOREIGN KEY(profile_id) REFERENCES profiles(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS trend (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id INTEGER,
                previous_profile_id INTEGER,
                drift_score REAL,
                risk_level TEXT,
                crown_integrity_trend TEXT,
                symmetry_drift REAL,
                oscillation_trend TEXT,
                peak_offset_trend TEXT,
                notes TEXT,
                FOREIGN KEY(profile_id) REFERENCES profiles(id)
            )
            """
        )
        _ensure_columns(
            conn,
            "profiles",
            {
                "original_decision": "TEXT",
                "override_decision": "TEXT",
                "override_reason": "TEXT",
                "override_operator": "TEXT",
                "override_timestamp": "TEXT",
            },
        )
        _ensure_columns(
            conn,
            "trend",
            {
                "crown_integrity_trend": "TEXT",
                "symmetry_drift": "REAL",
                "oscillation_trend": "TEXT",
                "peak_offset_trend": "TEXT",
                "notes": "TEXT",
            },
        )


def _ensure_columns(conn, table, columns):
    existing = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
    for name, definition in columns.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {name} {definition}")


def save_profile(profile_data):
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO profiles (timestamp, profile_name, decision, confidence, raw_file_path, operator_override)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                profile_data.get("timestamp", datetime.now().isoformat(timespec="seconds")),
                profile_data.get("profile_name"),
                profile_data.get("decision"),
                profile_data.get("confidence"),
                profile_data.get("raw_file_path"),
                profile_data.get("operator_override"),
            ),
        )
        return cur.lastrowid


def save_features(profile_id, features_data):
    data = features_data if isinstance(features_data, dict) else features_data.model_dump()
    with _connect() as conn:
        conn.execute("DELETE FROM features WHERE profile_id = ?", (profile_id,))
        conn.execute(
            """
            INSERT INTO features
            (profile_id, crown_integrity, symmetry_score, peak_offset, peak_dominance,
             concavity_length, concavity_depth, oscillation_score, multi_peak_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                profile_id,
                data["crown_integrity_score"],
                data["symmetry_score"],
                data["peak_offset"],
                data["peak_dominance"],
                data["concavity_length"],
                data["concavity_depth"],
                data["plateau_oscillation"],
                100.0 if data["multi_peak_detected"] else 0.0,
            ),
        )


def save_decision(profile_id, decision_data):
    data = decision_data if isinstance(decision_data, dict) else decision_data.model_dump()
    with _connect() as conn:
        conn.execute(
            """
            UPDATE profiles
            SET decision = ?,
                confidence = ?,
                original_decision = COALESCE(original_decision, ?)
            WHERE id = ?
            """,
            (data["decision"], data["confidence"], data["decision"], profile_id),
        )


def save_trend(profile_id, trend_data):
    with _connect() as conn:
        conn.execute("DELETE FROM trend WHERE profile_id = ?", (profile_id,))
        conn.execute(
            """
            INSERT INTO trend (
                profile_id, previous_profile_id, drift_score, risk_level,
                crown_integrity_trend, symmetry_drift, oscillation_trend, peak_offset_trend, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                profile_id,
                trend_data.get("previous_profile_id"),
                trend_data.get("drift_score"),
                trend_data.get("risk_level"),
                trend_data.get("crown_integrity_trend"),
                trend_data.get("symmetry_drift"),
                trend_data.get("oscillation_trend"),
                trend_data.get("peak_offset_trend"),
                json.dumps(trend_data.get("notes", [])),
            ),
        )


def _dict(row):
    return dict(row) if row else None


def get_all_profiles():
    with _connect() as conn:
        rows = conn.execute("SELECT * FROM profiles ORDER BY id DESC").fetchall()
    return [_dict(row) for row in rows]


def get_profile_by_id(profile_id):
    with _connect() as conn:
        row = conn.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
    return _dict(row)


def delete_profile(profile_id):
    with _connect() as conn:
        conn.execute("DELETE FROM features WHERE profile_id = ?", (profile_id,))
        conn.execute("DELETE FROM trend WHERE profile_id = ? OR previous_profile_id = ?", (profile_id, profile_id))
        cur = conn.execute("DELETE FROM profiles WHERE id = ?", (profile_id,))
        return cur.rowcount > 0


def get_features_by_profile_id(profile_id):
    with _connect() as conn:
        row = conn.execute("SELECT * FROM features WHERE profile_id = ?", (profile_id,)).fetchone()
    if not row:
        return None
    data = _dict(row)
    return {
        "crown_integrity_score": data["crown_integrity"],
        "symmetry_score": data["symmetry_score"],
        "peak_offset": data["peak_offset"],
        "peak_dominance": data["peak_dominance"],
        "concavity_length": data["concavity_length"],
        "concavity_depth": data["concavity_depth"],
        "plateau_oscillation": data["oscillation_score"],
        "multi_peak_score": data["multi_peak_score"],
    }


def get_trend_history(limit=24):
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT p.*, f.crown_integrity, f.symmetry_score, f.peak_offset, f.peak_dominance,
                   f.concavity_length, f.concavity_depth, f.oscillation_score, f.multi_peak_score,
                   t.drift_score, t.risk_level, t.crown_integrity_trend, t.symmetry_drift,
                   t.oscillation_trend, t.peak_offset_trend, t.notes
            FROM profiles p
            LEFT JOIN features f ON f.profile_id = p.id
            LEFT JOIN trend t ON t.profile_id = p.id
            ORDER BY p.id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return list(reversed([_dict(row) for row in rows]))


def save_operator_override(profile_id, decision, notes, operator):
    profile = get_profile_by_id(profile_id)
    if not profile:
        return {"success": False, "profile_id": profile_id, "error": "Profile not found"}
    timestamp = datetime.now().isoformat(timespec="seconds")
    original_decision = profile.get("original_decision") or profile.get("decision")
    payload = json.dumps(
        {
            "decision": decision,
            "notes": notes,
            "operator": operator,
            "timestamp": timestamp,
            "original_decision": original_decision,
        }
    )
    with _connect() as conn:
        conn.execute(
            """
            UPDATE profiles
            SET operator_override = ?,
                original_decision = COALESCE(original_decision, ?),
                override_decision = ?,
                override_reason = ?,
                override_operator = ?,
                override_timestamp = ?
            WHERE id = ?
            """,
            (payload, original_decision, decision, notes, operator, timestamp, profile_id),
        )
    return {"success": True, "profile_id": profile_id, "operator_override": json.loads(payload)}
