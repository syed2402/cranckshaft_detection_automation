import numpy as np
from scipy.optimize import curve_fit
from scipy.signal import find_peaks, peak_widths

from models import FeaturesResponse


def _clamp(value, low=0.0, high=100.0):
    return float(max(low, min(high, value)))


def _gaussian(x, base, amp, center, sigma):
    return base + amp * np.exp(-0.5 * ((x - center) / sigma) ** 2)


def _score_smoothness(y):
    if len(y) < 3:
        return 100.0
    amp = max(float(np.ptp(y)), 1e-9)
    total_variation = float(np.sum(np.abs(np.diff(y))))
    normalized = total_variation / (amp * max(len(y) - 1, 1))
    return _clamp(100 - normalized * 100)


def _moving_average(y, window):
    window = max(3, int(window))
    if window % 2 == 0:
        window += 1
    if len(y) < window:
        return y.copy()
    pad = window // 2
    padded = np.pad(y, pad, mode="edge")
    kernel = np.ones(window) / window
    return np.convolve(padded, kernel, mode="valid")


def _macro_convexity_continuity(x, y, edge_mean, center_x, span, amp):
    if len(y) < 8 or span <= 0:
        return 100.0

    macro = _moving_average(y, max(7, len(y) * 0.08))
    left_mask = x <= center_x
    right_mask = x >= center_x
    left = macro[left_mask]
    right = macro[right_mask]

    left_steps = np.diff(left) if len(left) > 1 else np.array([0.0])
    right_steps = np.diff(right) if len(right) > 1 else np.array([0.0])
    rise_quality = float(np.mean(left_steps >= -amp * 0.025))
    fall_quality = float(np.mean(right_steps <= amp * 0.025))

    center_band = np.abs(x - center_x) <= span * 0.18
    shoulder_band = (np.abs(x - (x[0] + span * 0.25)) <= span * 0.07) | (
        np.abs(x - (x[-1] - span * 0.25)) <= span * 0.07
    )
    center_lift = max(0.0, float(np.mean(macro[center_band])) - edge_mean) if np.any(center_band) else 0.0
    shoulder_lift = max(0.0, float(np.mean(macro[shoulder_band])) - edge_mean) if np.any(shoulder_band) else 0.0
    sustained_crown = _clamp((center_lift / max(shoulder_lift, amp * 0.20, 1e-9)) * 85)
    macro_smoothness = _score_smoothness(macro)

    continuity = 0.35 * rise_quality * 100 + 0.35 * fall_quality * 100 + 0.20 * sustained_crown + 0.10 * macro_smoothness
    return _clamp(continuity)


def _dominant_crown_region_score(x, y, edge_mean, center_x, span, amp):
    if span <= 0:
        return 100.0

    macro = _moving_average(y, max(7, len(y) * 0.06))
    lift = macro - edge_mean
    positive_lift = np.maximum(lift, 0)
    center_band = np.abs(x - center_x) <= span * 0.22
    crown_mask = positive_lift >= max(amp * 0.35, float(np.max(positive_lift)) * 0.55)

    height_score = _clamp(float(np.mean(positive_lift[center_band])) / max(amp * 0.45, 1e-9) * 100) if np.any(center_band) else 0.0
    center_coverage = _clamp(float(np.mean(crown_mask[center_band])) * 135) if np.any(center_band) else 0.0
    width = float(x[crown_mask][-1] - x[crown_mask][0]) if np.any(crown_mask) else 0.0
    width_score = _clamp(width / max(span * 0.18, 1e-9) * 100)

    weighted_center = float(np.sum(x * positive_lift) / np.sum(positive_lift)) if np.sum(positive_lift) > 0 else center_x
    offset_penalty = _clamp(abs(weighted_center - center_x) / max(span * 0.18, 1e-9) * 35, 0, 35)
    return _clamp(0.45 * height_score + 0.35 * center_coverage + 0.20 * width_score - offset_penalty)


def _find_concavities(x, y):
    n = len(y)
    window = max(7, int(n * 0.08))
    deviations = np.zeros(n)
    for i in range(n):
        start = max(0, i - window)
        end = min(n - 1, i + window)
        if end <= start:
            continue
        expected = np.interp(x[i], [x[start], x[end]], [y[start], y[end]])
        deviations[i] = expected - y[i]
    mask = deviations > 0.003
    regions = []
    i = 0
    while i < n:
        if not mask[i]:
            i += 1
            continue
        start = i
        while i + 1 < n and mask[i + 1]:
            i += 1
        end = i
        regions.append((start, end, float(np.max(deviations[start : end + 1]))))
        i += 1
    if not regions:
        return False, 0.0, 0.0, 0.0, 0.0, "none", True
    start, end, depth = max(regions, key=lambda r: (x[r[1]] - x[r[0]], r[2]))
    span = float(x[-1] - x[0])
    length = float(x[end] - x[start])
    start_x = float(x[start])
    end_x = float(x[end])
    left_edge = start_x < x[0] + span * 0.2
    right_edge = end_x > x[0] + span * 0.8
    if left_edge and right_edge:
        location = "edge-adjacent"
    elif left_edge:
        location = "edge-left"
    elif right_edge:
        location = "edge-right"
    else:
        location = "center"
    return True, start_x, end_x, length, depth, location, len(regions) == 1


def _find_global_concavity(x, y, peak_x, peak_offset, center_dominance, plateau_osc):
    span = float(x[-1] - x[0])
    if span <= 0:
        return False, 0.0, 0.0, 0.0, 0.0, "none", True

    center_x = float((x[0] + x[-1]) / 2)
    inner_start = x[0] + span * 0.05
    inner_end = x[-1] - span * 0.05
    inner = (x >= inner_start) & (x <= inner_end)
    if int(np.sum(inner)) < 5:
        return False, 0.0, 0.0, 0.0, 0.0, "none", True

    inner_x = x[inner]
    inner_y = y[inner]
    center_band = np.abs(inner_x - center_x) <= span * 0.05
    shoulder_band = (np.abs(inner_x - (x[0] + span * 0.22)) <= span * 0.04) | (
        np.abs(inner_x - (x[-1] - span * 0.22)) <= span * 0.04
    )
    if not np.any(center_band) or not np.any(shoulder_band):
        return False, 0.0, 0.0, 0.0, 0.0, "none", True

    center_mean = float(np.mean(inner_y[center_band]))
    shoulder_mean = float(np.mean(inner_y[shoulder_band]))
    center_drop = max(0.0, shoulder_mean - center_mean)
    dominant_peak_off_center = abs(peak_offset) > span * 0.08
    weak_center = center_dominance < 45
    unstable_plateau = plateau_osc > 60

    if not (dominant_peak_off_center and weak_center and unstable_plateau):
        return False, 0.0, 0.0, 0.0, 0.0, "none", True

    location = "full-profile"
    depth = max(center_drop, float(np.ptp(inner_y)) * 0.25)
    return True, float(inner_x[0]), float(inner_x[-1]), float(inner_x[-1] - inner_x[0]), depth, location, False


def extract_features(raw_points, smoothed_points, x_range, y_range):
    x = np.array([p["x"] for p in smoothed_points], dtype=float)
    y = np.array([p["y"] for p in smoothed_points], dtype=float)
    amp = max(float(np.ptp(y)), 1e-9)
    mean_y = float(np.mean(y))
    deviations = np.abs(y - mean_y)

    z1 = float(np.percentile(deviations, 95))
    z2 = float(np.percentile(deviations, 90))
    rk = float(np.max(y) - np.min(y))
    top_count = max(1, int(np.ceil(len(y) * 0.05)))
    rpk = float(np.mean(np.sort(y)[-top_count:]) - mean_y)
    crown_height = float(np.max(y) - np.mean([y[0], y[-1]]))

    peak_index = int(np.argmax(y))
    peak_x = float(x[peak_index])
    peak_y = float(y[peak_index])
    center_x = float(np.mean(x_range))
    peak_offset = peak_x - center_x

    span = float(x[-1] - x[0])
    edge_count = max(2, int(len(y) * 0.1))
    edge_values = np.concatenate([y[:edge_count], y[-edge_count:]])
    edge_mean = float(np.mean(edge_values))

    try:
        params, _ = curve_fit(
            _gaussian,
            x,
            y,
            p0=[float(np.min(y)), amp, peak_x, max((x[-1] - x[0]) / 4, 1e-3)],
            maxfev=10000,
        )
        fitted = _gaussian(x, *params)
        rmse = float(np.sqrt(np.mean((y - fitted) ** 2)))
        crown_integrity = _clamp(100 * (1 - rmse / amp))
    except Exception:
        crown_integrity = _clamp(100 - float(np.std(np.diff(y))) / amp * 100)

    second = np.gradient(np.gradient(y, x), x)
    convexity = _macro_convexity_continuity(x, y, edge_mean, center_x, span, amp)
    center_dominance = _dominant_crown_region_score(x, y, edge_mean, center_x, span, amp)

    half = len(y) // 2
    left = y[:half]
    right = y[-half:][::-1]
    symmetry = _clamp(100 * (1 - float(np.mean(np.abs(left - right))) / amp))
    envelope_smoothness = _score_smoothness(y)
    edge_smoothness = _clamp((_score_smoothness(y[:edge_count]) + _score_smoothness(y[-edge_count:])) / 2)

    peaks, props = find_peaks(y, prominence=max(amp * 0.08, 1e-9))
    significant, significant_proms = find_peaks(y, prominence=max(amp * 0.2, 1e-9))
    if len(peaks):
        main_peak_position = int(np.argmax(y[peaks]))
        peak_index = int(peaks[main_peak_position])
        peak_x = float(x[peak_index])
        peak_y = float(y[peak_index])
        prominences = props.get("prominences", np.array([amp]))
        main_prominence = float(prominences[main_peak_position])
        widths = peak_widths(y, [peak_index], rel_height=0.5)[0]
        median_step = float(np.median(np.diff(x))) if len(x) > 1 else 0.0
        peak_width = float(widths[0] * median_step)
    else:
        main_prominence = amp
        peak_width = float((x[-1] - x[0]) * 0.3)
    region_dominance = _dominant_crown_region_score(x, y, edge_mean, center_x, span, amp)
    peak_dominance = _clamp(max(main_prominence / amp * 100, region_dominance * 0.90))
    multi_peak_detected = len(significant) > 1
    secondary_peak_count = max(0, len(significant) - 1)

    plateau_start = int(len(y) * 0.2)
    plateau_end = int(len(y) * 0.8)
    plateau_y = y[plateau_start:plateau_end]
    plateau_macro = _moving_average(plateau_y, max(7, len(plateau_y) * 0.18))
    plateau_residual = plateau_y - plateau_macro
    residual_score = float(np.ptp(plateau_residual)) / max(amp, 1e-9) * 120
    sign_changes = np.diff(np.sign(np.diff(plateau_residual))) if len(plateau_residual) > 3 else np.array([])
    reversal_score = float(np.sum(sign_changes != 0)) / max(len(plateau_residual), 1) * 80
    plateau_osc = _clamp(residual_score * 0.75 + reversal_score * 0.25)

    concavity = _find_concavities(x, y)
    global_concavity = _find_global_concavity(x, y, peak_x, peak_offset, center_dominance, plateau_osc)
    concavity_detected, c_start, c_end, c_len, c_depth, c_location, c_isolated = (
        global_concavity if global_concavity[0] and global_concavity[3] >= concavity[3] else concavity
    )

    return FeaturesResponse(
        z1=round(z1, 4),
        z2=round(z2, 4),
        rk=round(rk, 4),
        rpk=round(rpk, 4),
        z1_pass=z1 <= 0.500,
        z2_pass=z2 <= 0.500,
        rk_pass=rk <= 1.200,
        rpk_pass=rpk <= 0.400,
        crown_height=round(crown_height, 4),
        crown_height_pass=0.020 <= crown_height <= 0.060,
        crown_integrity_score=round(crown_integrity, 1),
        convexity_continuity=round(convexity, 1),
        center_dominance=round(center_dominance, 1),
        symmetry_score=round(symmetry, 1),
        envelope_smoothness=round(envelope_smoothness, 1),
        edge_smoothness=round(edge_smoothness, 1),
        peak_x=round(peak_x, 3),
        peak_y=round(peak_y, 4),
        peak_offset=round(peak_offset, 3),
        peak_width=round(peak_width, 3),
        peak_dominance=round(peak_dominance, 1),
        multi_peak_detected=multi_peak_detected,
        secondary_peak_count=secondary_peak_count,
        concavity_detected=concavity_detected,
        concavity_start=round(c_start, 3),
        concavity_end=round(c_end, 3),
        concavity_length=round(c_len, 3),
        concavity_depth=round(c_depth, 4),
        concavity_location=c_location,
        concavity_isolated=c_isolated,
        plateau_oscillation=round(plateau_osc, 1),
    )
