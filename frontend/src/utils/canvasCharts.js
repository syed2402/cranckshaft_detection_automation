const GRID = "#f3f4f6";
const BORDER = "#e5e7eb";
const MUTED = "#6b7280";
const REPORT_LINE = "#222";
const REPORT_GRID = "#d8dde2";

function setup(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, rect.width, rect.height);
  return { ctx, width: rect.width, height: rect.height };
}

function text(ctx, value, x, y, options = {}) {
  ctx.save();
  ctx.fillStyle = options.color || "#000";
  ctx.font = options.font || "12px Arial, sans-serif";
  ctx.textAlign = options.align || "left";
  ctx.textBaseline = options.baseline || "alphabetic";
  if (options.rotate) {
    ctx.translate(x, y);
    ctx.rotate(options.rotate);
    ctx.fillText(value, 0, 0);
  } else {
    ctx.fillText(value, x, y);
  }
  ctx.restore();
}

function drawRect(ctx, x, y, w, h, color = REPORT_LINE, fill = null) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

function drawPolyline(ctx, points, xToPx, yToPx, color, width) {
  if (!points?.length) return;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = xToPx(point.x);
    const y = yToPx(point.y);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "miter";
  ctx.lineCap = "butt";
  ctx.stroke();
}

function getBounds(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    xMin: Math.min(...xs),
    xMax: Math.max(...xs),
    yMin: Math.min(...ys),
    yMax: Math.max(...ys),
  };
}

function detrendPoints(points) {
  if (!points?.length) return [];
  const first = points[0];
  const last = points[points.length - 1];
  const xSpan = last.x - first.x || 1;
  return points.map((point) => {
    const baseline = first.y + ((point.x - first.x) / xSpan) * (last.y - first.y);
    return { x: point.x, y: point.y - baseline };
  });
}

function formatTick(value, decimals = 3) {
  if (!Number.isFinite(value)) return "--";
  return Number(value.toFixed(decimals)).toString();
}

function makeTicks(min, max, count) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || count < 2) return [];
  if (Math.abs(max - min) < Number.EPSILON) return [min];
  return Array.from({ length: count }, (_, index) => min + ((max - min) * index) / (count - 1));
}

function drawArrowHead(ctx, x, y, direction = "down", color = "#008000") {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (direction === "down") {
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y - 10);
    ctx.lineTo(x + 7, y - 10);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + 10);
    ctx.lineTo(x + 7, y + 10);
  }
  ctx.closePath();
  ctx.fill();
}

function drawCross(ctx, x, y, size = 4, color = "#b47700") {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y - size);
  ctx.lineTo(x - size, y + size);
  ctx.stroke();
}

function drawReportHeader(ctx, width, profile) {
  const margin = 10;
  const top = 14;
  const rowH = 26;
  const colW = (width - margin * 2) / 3;
  const columns = [
    [["Evaluation conditions", ""], ["lambda s:", "8.00 um (Manual)"], ["lambda c:", "OFF"], ["lambda f:", "OFF"]],
    [["Remove form:", "OFF"], ["Filter ISO 4287:", "---"], ["Filter ISO 13565:", "---"], ["Alignment:", "ON"]],
    [["lp:", `${profile?.sampling_interval ? (profile.sampling_interval * 100).toFixed(3) : "14.001"} mm`], ["lr:", "---"], ["lw:", "---"], ["Additional parameters", ""]],
  ];

  columns.forEach((rows, colIndex) => {
    const x = margin + colIndex * colW;
    rows.forEach(([label, value], rowIndex) => {
      const fill = rowIndex === 0 || (colIndex === 2 && rowIndex === 3) ? "#f7dcbc" : "#fff1dd";
      drawRect(ctx, x, top + rowIndex * rowH, colW, rowH, REPORT_LINE, fill);
      text(ctx, label, x + 5, top + rowIndex * rowH + 18, { font: "18px Arial, sans-serif" });
      if (value) text(ctx, value, x + colW * 0.48, top + rowIndex * rowH + 18, { font: "18px Arial, sans-serif" });
    });
  });

  const titleY = top + rowH * 4;
  drawRect(ctx, margin, titleY, width - margin * 2, 36, REPORT_LINE, "#eeeeee");
  text(ctx, "CROWNING J2", width / 2, titleY + 24, { align: "center", font: "22px Arial, sans-serif" });
}

function drawReportFooter(ctx, width, height, profile) {
  const margin = 10;
  const footerH = 28;
  const y = height - footerH - 8;
  const c1 = 165;
  const c2 = 142;
  const c4 = 116;

  drawRect(ctx, margin, y, width - margin * 2, footerH, REPORT_LINE, "#fff");
  [margin + c1, margin + c1 + c2, width - margin - c4].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + footerH);
    ctx.strokeStyle = REPORT_LINE;
    ctx.stroke();
  });

  const date = profile?.timestamp ? new Date(profile.timestamp) : profile?.created_at ? new Date(profile.created_at) : new Date();
  const dateText = Number.isNaN(date.getTime())
    ? "30-Apr-26 6:48:59 PM"
    : date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).replace(",", "");

  text(ctx, dateText, margin + 10, y + 19, { font: "14px Arial, sans-serif" });
  text(ctx, "EVOVIS 3.10.0.00", margin + c1 + 14, y + 19, { font: "14px Arial, sans-serif" });
  text(ctx, "Test plan name", margin + c1 + c2 + 10, y + 10, { font: "12px Arial, sans-serif" });
  text(ctx, "ROUGHNESS & CROWNING", margin + c1 + c2 + 10, y + 23, { font: "12px Arial, sans-serif" });
  text(ctx, "Page 1/5", width - margin - 10, y + 19, { align: "right", font: "14px Arial, sans-serif" });
}

export function drawProfileGraph(canvas, options) {
  if (!canvas || !options.rawPoints?.length) return;
  const { ctx, width, height } = setup(canvas);
  const profile = options.profile || {};
  const plotRawPoints = options.deviationMode ? detrendPoints(options.rawPoints) : options.rawPoints;
  const plotSmoothedPoints = options.deviationMode ? detrendPoints(options.smoothedPoints) : options.smoothedPoints;
  const rawBounds = getBounds(plotRawPoints);

  drawRect(ctx, 10, 10, width - 20, height - 18, REPORT_LINE, "#fff");
  drawReportHeader(ctx, width, profile);
  drawReportFooter(ctx, width, height, profile);

  const padding = { top: 190, right: 72, bottom: 84, left: 112 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const xMin = rawBounds.xMin;
  const xMax = rawBounds.xMax;
  const rawYMin = rawBounds.yMin;
  const rawYMax = rawBounds.yMax;
  const yPad = Math.max((rawYMax - rawYMin) * 0.035, 0.0005);
  const yMin = rawYMin - yPad;
  const yMax = rawYMax + yPad;
  const xToPx = (x) => padding.left + ((x - xMin) / (xMax - xMin || 1)) * plotW;
  const yToPx = (y) => padding.top + ((yMax - y) / (yMax - yMin || 1)) * plotH;
  const layers = options.layerVisibility;
  const span = xMax - xMin;
  const xTicks = makeTicks(xMin, xMax, 10);
  const yTicks = makeTicks(yMin, yMax, 6);

  if (layers.l6) {
    options.anomalyZones?.filter((z) => z.type === "concavity").forEach((zone) => {
      const x = xToPx(zone.start);
      const w = Math.max(2, xToPx(zone.end) - x);
      ctx.fillStyle = "rgba(252,235,235,.45)";
      ctx.fillRect(x, padding.top, w, plotH);
      ctx.strokeStyle = "#E24B4A";
      ctx.strokeRect(x, padding.top, w, plotH);
    });
  }

  ctx.strokeStyle = REPORT_GRID;
  ctx.lineWidth = 1;
  ctx.setLineDash([1, 2]);
  for (let i = 0; i <= 20; i += 1) {
    const x = xToPx(xMin + (span * i) / 20);
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }
  for (let i = 0; i <= 10; i += 1) {
    const y = padding.top + (plotH * i) / 10;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.strokeStyle = REPORT_LINE;
  ctx.beginPath();
  ctx.rect(padding.left, padding.top, plotW, plotH);
  ctx.stroke();

  for (let i = 0; i <= 100; i += 1) {
    const x = padding.left + (plotW * i) / 100;
    const major = i % 10 === 0;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top - (major ? 8 : 4));
    ctx.moveTo(x, height - padding.bottom);
    ctx.lineTo(x, height - padding.bottom + (major ? 8 : 4));
    ctx.stroke();
  }
  for (let i = 0; i <= 60; i += 1) {
    const y = padding.top + (plotH * i) / 60;
    const major = i % 10 === 0;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left - (major ? 8 : 4), y);
    ctx.moveTo(width - padding.right, y);
    ctx.lineTo(width - padding.right + (major ? 8 : 4), y);
    ctx.stroke();
  }

  const featurePoint = options.rawPoints.reduce((closest, point, index) => {
    if (!Number.isFinite(options.peakX)) return closest;
    const distance = Math.abs(point.x - options.peakX);
    return distance < closest.distance ? { distance, index } : closest;
  }, { distance: Infinity, index: -1 });
  const plotPeak = featurePoint.index >= 0
    ? plotRawPoints[featurePoint.index]
    : { x: options.peakX, y: Number.isFinite(options.peakY) ? options.peakY : rawYMax };
  const referenceY = Number.isFinite(plotPeak.y) ? plotPeak.y : rawYMax;
  ctx.strokeStyle = "#b58b20";
  ctx.beginPath();
  ctx.moveTo(xToPx(xMin), yToPx(referenceY));
  ctx.lineTo(xToPx(xMax), yToPx(referenceY));
  ctx.stroke();

  xTicks.forEach((value) => {
    text(ctx, formatTick(value, 3), xToPx(value), padding.top - 12, {
      align: "center",
      font: "12px Arial, sans-serif",
    });
  });
  yTicks.forEach((value) => {
    const y = yToPx(value) + 4;
    text(ctx, formatTick(value, 4), padding.left - 14, y, { align: "right", font: "11px Arial, sans-serif" });
    text(ctx, formatTick(value, 4), width - padding.right + 14, y, { align: "left", font: "11px Arial, sans-serif" });
  });

  text(ctx, `AVERAGE OF RK ${options.rk ?? "--"} um`, padding.left + plotW / 2, padding.top + plotH * 0.18, {
    align: "center",
    font: "28px Arial, sans-serif",
    color: "rgba(80, 87, 96, .36)",
  });
  text(ctx, `AVERAGE OF RPK ${options.rpk ?? "--"} um`, padding.left + plotW / 2, padding.top + plotH * 0.36, {
    align: "center",
    font: "28px Arial, sans-serif",
    color: "rgba(80, 87, 96, .36)",
  });

  if (options.deviationMode) {
    text(ctx, "Deviation view: Y values are raw profile minus the straight line between first and last points", padding.left + 8, height - padding.bottom + 40, {
      font: "11px Arial, sans-serif",
      color: "#6b7280",
    });
  }

  if (layers.l1) drawPolyline(ctx, plotRawPoints, xToPx, yToPx, "#0f0f0f", 1.15);
  if (layers.l2) {
    ctx.setLineDash([6, 4]);
    drawPolyline(ctx, plotSmoothedPoints, xToPx, yToPx, "#1D9E75", 1);
    ctx.setLineDash([]);
  }
  if (layers.l7) {
    const first = plotRawPoints[0];
    const last = plotRawPoints[plotRawPoints.length - 1];
    if (first) drawCross(ctx, xToPx(first.x), yToPx(first.y), 4);
    if (last) drawCross(ctx, xToPx(last.x), yToPx(last.y), 4);
  }
  if (layers.l3) {
    const x = xToPx(options.centerX);
    ctx.strokeStyle = "#444";
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }
  if (layers.l4 && Number.isFinite(options.peakX) && Number.isFinite(options.peakY)) {
    const x = xToPx(plotPeak.x);
    const y = yToPx(plotPeak.y);
    const labelW = 34;
    const labelH = 20;
    const labelX = Math.max(padding.left + 4, Math.min(width - padding.right - labelW - 4, x - labelW / 2));
    const labelY = Math.max(padding.top + 8, y - 46);
    ctx.strokeStyle = "#008000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 3);
    ctx.lineTo(labelX + labelW / 2, labelY + labelH);
    ctx.stroke();
    drawArrowHead(ctx, x, y - 2, "down", "#008000");
    drawRect(ctx, labelX, labelY, labelW, labelH, "#008000", "#fff");
    text(ctx, "B1", labelX + labelW / 2, labelY + 14, { color: "#008000", align: "center", font: "13px Arial, sans-serif" });
    ctx.strokeStyle = "#008000";
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
  }
  if (layers.l5 && Number.isFinite(options.peakX)) {
    const start = xToPx(options.centerX);
    const end = xToPx(options.peakX);
    const y = Math.min(height - padding.bottom - 66, padding.top + plotH * 0.72);
    ctx.strokeStyle = "#444";
    ctx.beginPath();
    ctx.moveTo(start, y);
    ctx.lineTo(end, y);
    ctx.moveTo(start, y - 58);
    ctx.lineTo(start, y + 58);
    ctx.moveTo(end, y - 8);
    ctx.lineTo(end, y + 8);
    ctx.stroke();
    text(ctx, `${(options.peakX - options.centerX).toFixed(3)} mm`, Math.min(start, end) - 8, y - 4, {
      align: "right",
      font: "12px Arial, sans-serif",
    });
    const arrowX = end > start ? end - 10 : end + 10;
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.moveTo(arrowX, y);
    ctx.lineTo(arrowX + (end > start ? 12 : -12), y - 3);
    ctx.lineTo(arrowX + (end > start ? 12 : -12), y + 3);
    ctx.fill();
  }
  options.anomalyZones?.filter((zone) => zone.type === "concavity").forEach((zone) => {
    const x = (xToPx(zone.start) + xToPx(zone.end)) / 2;
    text(ctx, `concavity ${formatTick(zone.start, 3)}-${formatTick(zone.end, 3)}`, x, padding.top + 20, {
      align: "center",
      font: "11px Arial, sans-serif",
      color: "#A32D2D",
    });
  });
}

export function drawLineChart(canvas, options) {
  if (!canvas || !options.data?.length) return;
  const { ctx, width, height } = setup(canvas);
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const xToPx = (i) => padding.left + (i / Math.max(options.data.length - 1, 1)) * plotW;
  const yToPx = (y) => padding.top + ((options.yMax - y) / (options.yMax - options.yMin || 1)) * plotH;
  const ticks = options.yTicks || [options.yMin, (options.yMin + options.yMax) / 2, options.yMax];

  ctx.strokeStyle = GRID;
  ticks.forEach((tick) => {
    const y = yToPx(tick);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  });
  options.thresholdLines?.forEach((line) => {
    const y = yToPx(line.y);
    ctx.setLineDash(line.dash || [5, 4]);
    ctx.strokeStyle = line.color;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (line.label) text(ctx, line.label, width - padding.right - 4, y - 5, { color: line.color, align: "right", font: "11px sans-serif" });
  });

  ctx.strokeStyle = BORDER;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  text(ctx, "", 0, 0);
  ctx.fillStyle = MUTED;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  ticks.forEach((tick) => ctx.fillText(String(tick), padding.left - 8, yToPx(tick) + 4));
  ctx.textAlign = "center";
  options.data.forEach((point, i) => {
    if (i % 2 === 0) ctx.fillText(point.x ?? `P${i + 1}`, xToPx(i), height - padding.bottom + 18);
  });

  ctx.beginPath();
  options.data.forEach((point, i) => {
    const x = xToPx(i);
    const y = yToPx(point.y);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = options.lineColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  options.data.forEach((point, i) => {
    const hit = options.highlightPoints?.find((p) => p.index === i);
    ctx.beginPath();
    ctx.arc(xToPx(i), yToPx(point.y), 4, 0, Math.PI * 2);
    ctx.fillStyle = hit?.color || options.dotColor || options.lineColor;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.stroke();
  });
}
