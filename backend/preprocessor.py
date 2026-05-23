import numpy as np
from scipy.signal import savgol_filter


def preprocess_profile(raw_points):
    x = np.array([p["x"] for p in raw_points], dtype=float)
    y = np.array([p["y"] for p in raw_points], dtype=float)
    window = min(11, len(y) if len(y) % 2 == 1 else len(y) - 1)
    if window < 5:
        window = 5
    if window % 2 == 0:
        window -= 1
    smoothed_y = savgol_filter(y, window_length=window, polyorder=min(3, window - 2))
    steps = np.diff(x)
    sampling_interval = float(np.median(steps)) if len(steps) else 0.0
    smoothed_points = [{"x": float(px), "y": float(py)} for px, py in zip(x, smoothed_y)]
    return {
        "smoothed_points": smoothed_points,
        "x_range": [float(np.min(x)), float(np.max(x))],
        "y_range": [float(np.min(y)), float(np.max(y))],
        "sampling_interval": sampling_interval,
        "point_count": len(raw_points),
    }
