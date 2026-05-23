import re


def _detect_delimiter(line: str):
    candidates = [",", "\t", ";"]
    return max(candidates, key=lambda delimiter: line.count(delimiter))


def _split(line: str, delimiter: str):
    return [part.strip() for part in line.strip().split(delimiter)]


def _is_sequential_index(value: float, row_number: int):
    return abs(value - row_number) < 1e-6


def parse_profile_file(file_bytes: bytes, filename: str):
    if not filename.lower().endswith((".txt", ".csv")):
        raise ValueError("Invalid file type. Upload a TXT or CSV coordinate file.")

    text = file_bytes.decode("utf-8-sig", errors="replace").strip()
    if not text:
        raise ValueError("Uploaded file is empty.")

    lines = [line for line in text.splitlines() if line.strip()]
    delimiter = _detect_delimiter(lines[0])
    points = []

    data_row_number = 0
    for row_index, line in enumerate(lines):
        row = _split(line, delimiter)
        if not row or len(row) < 2:
            continue
        if row_index == 0 and re.search(r"[A-Za-z]", "".join(row)):
            continue
        try:
            numeric = [float(value) for value in row if value != ""]
        except ValueError as exc:
            raise ValueError(f"Invalid numeric coordinate at row {row_index + 1}.") from exc
        if len(numeric) >= 3 and _is_sequential_index(numeric[0], data_row_number):
            x = numeric[1]
            y = numeric[2]
        else:
            x = numeric[0]
            y = numeric[1]
        points.append({"x": x, "y": y})
        data_row_number += 1

    if len(points) < 50:
        raise ValueError("Invalid profile: minimum 50 coordinate points required.")

    points = sorted(points, key=lambda p: p["x"])
    for i in range(1, len(points)):
        if points[i]["x"] <= points[i - 1]["x"]:
            raise ValueError("Invalid profile: X values must be monotonically increasing.")

    return points
