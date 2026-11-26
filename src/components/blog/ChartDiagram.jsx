import React, { useMemo, useState, useRef, useCallback } from "react";
import styles from "./ChartDiagram.module.css";

const SERIES_PALETTE = ["#1B9ACD", "#71717A", "#D97706", "#111113", "#52525B"];

function getDeltaClass(tone = "neutral", deltaText = "") {
  const t = String(tone || "").toLowerCase();
  if (t === "positive" || t === "good" || t === "success") return styles.deltaPositive;
  if (t === "negative" || t === "bad" || t === "danger") return styles.deltaNegative;
  if (t === "warning" || t === "warn" || t === "caution") return styles.deltaWarning;
  const trimmed = String(deltaText || "").trim();
  if (trimmed.startsWith("+")) return styles.deltaPositive;
  return styles.deltaNeutral;
}

function normalizeChartType(rawType = "") {
  const t = String(rawType || "").toLowerCase().trim();
  if (["grouped_bar", "grouped-bar", "grouped_bars", "horizontal_bar", "bar"].includes(t)) return "grouped_bar";
  if (["line", "annotated_line", "line_chart"].includes(t)) return "line";
  if (["range", "range_comparison", "dumbbell", "min_max"].includes(t)) return "range";
  if (["kpi", "kpi_grid", "kpi_panels", "metrics"].includes(t)) return "kpi";
  if (["composite", "multi_panel", "combined"].includes(t)) return "composite";
  return "";
}

function formatNumber(val) {
  const num = Number(val);
  if (!Number.isFinite(num)) return String(val ?? "");
  if (Math.abs(num) >= 1000) return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.?0+$/, "");
}

function GroupedBarView({ spec, unit, onInspect }) {
  const { seriesNames, groups, maxValue } = useMemo(() => {
    const rawGroups = Array.isArray(spec.groups) ? spec.groups : [];
    const names = [];
    const addName = (n) => {
      if (n && !names.includes(n)) names.push(n);
    };

    if (Array.isArray(spec.series)) {
      spec.series.forEach((s) => addName(typeof s === "string" ? s : s?.name || s?.label));
    }

    let normalizedGroups = [];
    if (rawGroups.length > 0) {
      normalizedGroups = rawGroups.map((g) => {
        const bars = Array.isArray(g.bars)
          ? g.bars
          : Array.isArray(g.values)
            ? g.values.map((v, idx) =>
              typeof v === "object"
                ? v
                : { series: names[idx] || `Series ${idx + 1}`, value: v }
            )
            : [];
        bars.forEach((b) => addName(b.series || b.label || b.name));
        return {
          label: g.label || g.category || "Group",
          sublabel: g.sublabel || g.meta || "",
          delta: g.delta || "",
          deltaTone: g.deltaTone || g.tone || "",
          bars: bars.map((b, idx) => ({
            series: b.series || b.label || b.name || names[idx] || `Series ${idx + 1}`,
            value: Number(b.value) || 0,
            displayValue: b.displayValue || "",
            color: b.color || "",
            note: b.note || "",
          })),
        };
      });
    } else if (Array.isArray(spec.categories) && Array.isArray(spec.series)) {
      normalizedGroups = spec.categories.map((cat, ci) => ({
        label: String(cat),
        sublabel: "",
        delta: "",
        deltaTone: "",
        bars: spec.series.map((s) => ({
          series: s.name || s.label || "Series",
          value: Number(Array.isArray(s.data) ? s.data[ci] : 0) || 0,
          displayValue: "",
          color: s.color || "",
          note: "",
        })),
      }));
    }

    let max = Number(spec.max) || 0;
    normalizedGroups.forEach((g) => {
      g.bars.forEach((b) => {
        if (b.value > max) max = b.value;
      });
    });
    const niceMax = spec.max ? max : Math.ceil((max * 1.15) * 10) / 10;
    return { seriesNames: names, groups: normalizedGroups, maxValue: niceMax > 0 ? niceMax : 1 };
  }, [spec]);

  const [hiddenSeries, setHiddenSeries] = useState(() => new Set());
  const hasDeltas = groups.some((g) => Boolean(g.delta));
  const showLegend = seriesNames.length > 1 || (Array.isArray(spec.legend) && spec.legend.length > 0);

  const toggleSeries = (name) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else if (next.size < seriesNames.length - 1) next.add(name);
      return next;
    });
  };

  const gridTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      {showLegend && (
        <div className={styles.legendBar} role="list" aria-label="Chart legend">
          {seriesNames.map((name, i) => {
            const muted = hiddenSeries.has(name);
            const color = spec.legend?.[i]?.color || SERIES_PALETTE[i % SERIES_PALETTE.length];
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleSeries(name)}
                className={`${styles.legendItem} ${muted ? styles.legendItemMuted : ""}`}
                aria-pressed={!muted}
              >
                <span className={styles.legendSwatch} style={{ backgroundColor: color }} />
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      )}

      {(spec.categoryHeader || spec.valueHeader || spec.deltaHeader) && (
        <div className={styles.hbarHeaderGrid}>
          <span>{spec.categoryHeader || "Category"}</span>
          <span>{spec.valueHeader || (unit ? `Value (${unit})` : "Value")}</span>
          {hasDeltas && <span className={styles.hbarHeaderRight}>{spec.deltaHeader || "Delta"}</span>}
        </div>
      )}

      <div className={styles.hbarPlotWrap}>
        <div className={styles.hbarGridRows}>
          {groups.map((group, gi) => {
            const visibleBars = group.bars.filter((b) => !hiddenSeries.has(b.series));
            const rows = group.bars.map((item) => ({
              label: item.series,
              value: item.displayValue || `${formatNumber(item.value)}${unit ? ` ${unit}` : ""}`,
              color:
                item.color ||
                SERIES_PALETTE[Math.max(0, seriesNames.indexOf(item.series)) % SERIES_PALETTE.length],
            }));
            const rowNote = group.bars.find((b) => b.note)?.note || "";

            return (
              <div
                key={`${group.label}-${gi}`}
                className={styles.hbarRow}
                tabIndex={0}
                onMouseEnter={(e) => onInspect(e, { title: group.label, rows, note: rowNote })}
                onMouseMove={(e) => onInspect(e, { title: group.label, rows, note: rowNote })}
                onFocus={(e) => onInspect(e, { title: group.label, rows, note: rowNote })}
                onClick={(e) => onInspect(e, { title: group.label, rows, note: rowNote })}
                onMouseLeave={() => onInspect(null, null)}
              >
                <div className={styles.hbarLabelCol}>
                  <span className={styles.hbarGroupLabel}>{group.label}</span>
                  {group.sublabel && <span className={styles.hbarGroupSub}>{group.sublabel}</span>}
                </div>

                <div className={styles.hbarBarsArea}>
                  {gridTicks.slice(1, -1).map((t) => (
                    <span key={t} className={styles.hbarGridLine} style={{ left: `${t * 100}%` }} />
                  ))}
                  {visibleBars.map((bar, bi) => {
                    const sIdx = Math.max(0, seriesNames.indexOf(bar.series));
                    const color = bar.color || spec.legend?.[sIdx]?.color || SERIES_PALETTE[sIdx % SERIES_PALETTE.length];
                    const widthPct = Math.max(2, Math.min(84, (bar.value / maxValue) * 84));
                    return (
                      <div key={`${bar.series}-${bi}`} className={styles.hbarSingleTrack}>
                        <div className={styles.hbarFill} style={{ width: `${widthPct}%`, backgroundColor: color }} />
                        <div className={styles.hbarInlineValWrap}>
                          <span className={styles.hbarInlineVal}>
                            {bar.displayValue || `${formatNumber(bar.value)}${seriesNames.length === 1 && unit ? ` ${unit}` : ""}`}
                          </span>
                          {bar.note && seriesNames.length === 1 && (
                            <span className={styles.hbarInlineNote}>{bar.note}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasDeltas && (
                  <div className={styles.hbarDeltaCol}>
                    {group.delta && (
                      <span className={`${styles.deltaBadge} ${getDeltaClass(group.deltaTone, group.delta)}`}>
                        {group.delta}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.hbarAxisRow}>
          <span />
          <div>
            <div className={styles.hbarAxisTicks}>
              {gridTicks.map((t) => (
                <span key={t}>{formatNumber(Math.round(maxValue * t * 10) / 10)}</span>
              ))}
            </div>
            {spec.xLabel && <div className={styles.hbarAxisTitle}>{spec.xLabel}</div>}
          </div>
          {hasDeltas && <span className={styles.hbarHeaderRight} />}
        </div>
      </div>
    </div>
  );
}

function AnnotatedLineView({ spec, unit, onInspect }) {
  const { labels, series, yMin, yMax, annotations, highlightZone } = useMemo(() => {
    const rawSeries = Array.isArray(spec.series) ? spec.series : [];
    const lbls = Array.isArray(spec.labels)
      ? spec.labels
      : Array.isArray(spec.xLabels)
        ? spec.xLabels
        : rawSeries[0]?.points?.map((p) => p.x) || [];

    const normalizedSeries = rawSeries.map((s, idx) => {
      const data = Array.isArray(s.data)
        ? s.data.map((n) => Number(n) || 0)
        : Array.isArray(s.points)
          ? s.points.map((p) => Number(p.y) || 0)
          : [];
      return {
        name: s.name || s.label || `Series ${idx + 1}`,
        color: s.color || SERIES_PALETTE[idx % SERIES_PALETTE.length],
        data,
      };
    });

    const allVals = normalizedSeries.flatMap((s) => s.data);
    let minVal = spec.yMin !== undefined ? Number(spec.yMin) : Math.min(0, ...allVals);
    let maxVal = spec.yMax !== undefined ? Number(spec.yMax) : Math.max(1, ...allVals);
    if (minVal === maxVal) maxVal = minVal + 1;
    const pad = (maxVal - minVal) * 0.12;
    if (spec.yMax === undefined) maxVal = Math.ceil((maxVal + pad) * 10) / 10;

    return {
      labels: lbls,
      series: normalizedSeries,
      yMin: minVal,
      yMax: maxVal,
      annotations: Array.isArray(spec.annotations) ? spec.annotations : [],
      highlightZone: spec.highlightZone && typeof spec.highlightZone === "object" ? spec.highlightZone : null,
    };
  }, [spec]);

  const [hidden, setHidden] = useState(() => new Set());
  const [activeIdx, setActiveIdx] = useState(null);

  const toggleSeries = (name) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else if (next.size < series.length - 1) next.add(name);
      return next;
    });
  };

  const width = 680;
  const height = 270;
  const margin = { top: 30, right: 24, bottom: 42, left: 52 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const getX = (i) => (labels.length <= 1 ? margin.left + plotW / 2 : margin.left + (i / (labels.length - 1)) * plotW);
  const getY = (val) => margin.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const v = yMin + (yMax - yMin) * t;
    return { val: v, y: getY(v) };
  });

  const handlePointInspect = (e, idx) => {
    setActiveIdx(idx);
    const lbl = labels[idx] ?? `Point ${idx + 1}`;
    const rows = series
      .filter((s) => !hidden.has(s.name))
      .map((s) => ({
        label: s.name,
        value: `${formatNumber(s.data[idx])}${unit ? ` ${unit}` : ""}`,
        color: s.color,
      }));
    const matchedAnn = annotations.find((a) => String(a.x) === String(lbl) || Number(a.index) === idx);
    onInspect(e, {
      title: `${spec.xLabel ? `${spec.xLabel}: ` : ""}${lbl}`,
      rows,
      note: matchedAnn?.label || "",
    });
  };

  const zoneStartIdx = highlightZone
    ? labels.findIndex((l) => String(l) === String(highlightZone.xStart))
    : -1;
  const zoneEndIdx = highlightZone
    ? labels.findIndex((l) => String(l) === String(highlightZone.xEnd))
    : -1;

  return (
    <div>
      {series.length > 1 && (
        <div className={styles.legendBar}>
          {series.map((s) => {
            const muted = hidden.has(s.name);
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => toggleSeries(s.name)}
                className={`${styles.legendItem} ${muted ? styles.legendItemMuted : ""}`}
                aria-pressed={!muted}
              >
                <span className={styles.legendLine} style={{ backgroundColor: s.color }} />
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.lineSvgWrap}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={styles.lineSvg}
          role="img"
          aria-label={spec.title || "Annotated line chart"}
          onMouseLeave={() => {
            setActiveIdx(null);
            onInspect(null, null);
          }}
        >
          {zoneStartIdx >= 0 && zoneEndIdx >= zoneStartIdx && (
            <g>
              <rect
                x={getX(zoneStartIdx)}
                y={margin.top}
                width={Math.max(4, getX(zoneEndIdx) - getX(zoneStartIdx))}
                height={plotH}
                fill="rgba(27, 154, 205, 0.08)"
              />
              {highlightZone.label && (
                <text
                  x={(getX(zoneStartIdx) + getX(zoneEndIdx)) / 2}
                  y={margin.top - 10}
                  textAnchor="middle"
                  fill="#1B9ACD"
                  className={styles.annotationText}
                >
                  {highlightZone.label}
                </text>
              )}
            </g>
          )}

          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={margin.left}
                y1={tick.y}
                x2={width - margin.right}
                y2={tick.y}
                stroke={idx === 0 ? "#D4D4D8" : "#F4F4F5"}
                strokeWidth="1"
              />
              <text x={margin.left - 8} y={tick.y + 4} textAnchor="end" className={styles.axisTickText}>
                {formatNumber(tick.val)}
              </text>
            </g>
          ))}

          {labels.map((lbl, idx) => {
            const step = labels.length > 8 ? Math.ceil(labels.length / 7) : 1;
            if (idx % step !== 0 && idx !== labels.length - 1) return null;
            return (
              <text key={`${lbl}-${idx}`} x={getX(idx)} y={height - 16} textAnchor="middle" className={styles.axisTickText}>
                {String(lbl)}
              </text>
            );
          })}

          {spec.xLabel && (
            <text x={margin.left + plotW / 2} y={height - 2} textAnchor="middle" className={styles.axisTickText}>
              {spec.xLabel}
            </text>
          )}

          {activeIdx !== null && (
            <line
              x1={getX(activeIdx)}
              y1={margin.top}
              x2={getX(activeIdx)}
              y2={margin.top + plotH}
              stroke="#A1A1AA"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}

          {series
            .filter((s) => !hidden.has(s.name))
            .map((s) => (
              <g key={s.name}>
                <polyline
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={s.data.map((v, i) => `${getX(i)},${getY(valOrZero(v))}`).join(" ")}
                />
                {s.data.map((v, i) => {
                  const isFocused = activeIdx === i;
                  return (
                    <circle
                      key={i}
                      cx={getX(i)}
                      cy={getY(valOrZero(v))}
                      r={isFocused ? 5.25 : 3.5}
                      fill={isFocused ? s.color : "#FFFFFF"}
                      stroke={s.color}
                      strokeWidth="2"
                    />
                  );
                })}
              </g>
            ))}

          {annotations.map((ann, ai) => {
            const idx = ann.index !== undefined ? Number(ann.index) : labels.findIndex((l) => String(l) === String(ann.x));
            if (idx < 0 || idx >= labels.length) return null;
            const cx = getX(idx);
            const rawVal = ann.y !== undefined ? Number(ann.y) : series[0]?.data[idx] ?? yMin;
            const cy = getY(rawVal);
            const alignRight = cx > width - 160;
            const textX = alignRight ? cx - 10 : cx + 10;
            const textY = Math.max(margin.top + 12, cy - 10);
            const tone = String(ann.tone || "").toLowerCase();
            const txtColor = tone === "negative" ? "#B91C1C" : tone === "positive" ? "#047857" : "#111113";
            const dotColor = tone === "negative" ? "#DC2626" : tone === "positive" ? "#059669" : "#D97706";

            return (
              <g key={`ann-${ai}`} pointerEvents="none">
                <circle cx={cx} cy={cy} r="5.5" fill="none" stroke={dotColor} strokeWidth="2" />
                <text
                  x={textX}
                  y={textY}
                  textAnchor={alignRight ? "end" : "start"}
                  fill={txtColor}
                  className={styles.annotationText}
                >
                  {String(ann.label || "")}
                </text>
              </g>
            );
          })}

          {labels.map((_, idx) => {
            const sliceW = labels.length > 1 ? plotW / (labels.length - 1) : plotW;
            const rx = Math.max(margin.left, getX(idx) - sliceW / 2);
            return (
              <rect
                key={`hit-${idx}`}
                x={rx}
                y={margin.top}
                width={sliceW}
                height={plotH}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => handlePointInspect(e, idx)}
                onMouseMove={(e) => handlePointInspect(e, idx)}
                onClick={(e) => handlePointInspect(e, idx)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function valOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function RangeComparisonView({ spec, unit, onInspect }) {
  const { items, minVal, maxVal } = useMemo(() => {
    const rawItems = Array.isArray(spec.items) ? spec.items : Array.isArray(spec.rows) ? spec.rows : [];
    const parsed = rawItems.map((item) => ({
      label: item.label || item.name || "Parameter",
      low: Number(item.low ?? item.min ?? 0) || 0,
      high: Number(item.high ?? item.max ?? 0) || 0,
      target: item.target !== undefined ? Number(item.target) : null,
      targetLabel: item.targetLabel || "Design benchmark",
      delta: item.delta || "",
      deltaTone: item.deltaTone || item.tone || "",
      note: item.note || "",
    }));

    const nums = parsed.flatMap((p) => [p.low, p.high, ...(p.target !== null ? [p.target] : [])]);
    const lo = spec.min !== undefined ? Number(spec.min) : Math.min(0, ...nums);
    const hi = spec.max !== undefined ? Number(spec.max) : Math.max(1, ...nums);
    return { items: parsed, minVal: lo, maxVal: hi > lo ? hi : lo + 1 };
  }, [spec]);

  const toPct = (v) => Math.max(0, Math.min(100, ((v - minVal) / (maxVal - minVal)) * 100));

  return (
    <div>
      <div className={styles.legendBar}>
        <span className={`${styles.legendItem} ${styles.legendItemStatic}`}>
          <span className={styles.rangeDotLow} style={{ position: "static", transform: "none" }} />
          <span>Lower bound</span>
        </span>
        <span className={`${styles.legendItem} ${styles.legendItemStatic}`}>
          <span className={styles.rangeDotHigh} style={{ position: "static", transform: "none" }} />
          <span>Upper bound</span>
        </span>
        <span className={`${styles.legendItem} ${styles.legendItemStatic}`}>
          <span className={styles.legendMarker} />
          <span>Design benchmark</span>
        </span>
      </div>

      <div className={styles.rangeScaleHeader}>
        <span>Parameter</span>
        <div className={styles.rangeScaleTicks}>
          <span>{formatNumber(minVal)}{unit ? ` ${unit}` : ""}</span>
          <span>{formatNumber((minVal + maxVal) / 2)}{unit ? ` ${unit}` : ""}</span>
          <span>{formatNumber(maxVal)}{unit ? ` ${unit}` : ""}</span>
        </div>
        <span className={styles.rangeScaleHeaderRight}>Range &amp; Status</span>
      </div>

      <div>
        {items.map((item, idx) => {
          const leftPct = toPct(Math.min(item.low, item.high));
          const rightPct = toPct(Math.max(item.low, item.high));
          const spanPct = Math.max(1.5, rightPct - leftPct);
          const inspectPayload = {
            title: item.label,
            rows: [
              { label: "Range", value: `${formatNumber(item.low)} – ${formatNumber(item.high)}${unit ? ` ${unit}` : ""}`, color: "#1B9ACD" },
              ...(item.target !== null ? [{ label: item.targetLabel, value: `${formatNumber(item.target)}${unit ? ` ${unit}` : ""}`, color: "#D97706" }] : []),
            ],
            note: item.note || "",
          };

          return (
            <div
              key={`${item.label}-${idx}`}
              className={styles.rangeRow}
              tabIndex={0}
              onMouseEnter={(e) => onInspect(e, inspectPayload)}
              onMouseMove={(e) => onInspect(e, inspectPayload)}
              onFocus={(e) => onInspect(e, inspectPayload)}
              onClick={(e) => onInspect(e, inspectPayload)}
              onMouseLeave={() => onInspect(null, null)}
            >
              <span className={styles.rangeLabel}>{item.label}</span>
              <div className={styles.rangeTrackWrap}>
                <div className={styles.rangeTrackRail}>
                  <div className={styles.rangeSpanBar} style={{ left: `${leftPct}%`, width: `${spanPct}%` }} />
                  {item.target !== null && <span className={styles.rangeTargetTick} style={{ left: `${toPct(item.target)}%` }} />}
                  <span className={styles.rangeDotLow} style={{ left: `${leftPct}%` }} />
                  <span className={styles.rangeDotHigh} style={{ left: `${rightPct}%` }} />
                </div>
              </div>
              <div className={styles.rangeRightCol}>
                <span className={styles.rangeValuesText}>
                  {formatNumber(item.low)} – {formatNumber(item.high)}{unit ? ` ${unit}` : ""}
                </span>
                {item.delta && (
                  <span className={`${styles.deltaBadge} ${getDeltaClass(item.deltaTone, item.delta)}`}>
                    {item.delta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiPanelsView({ spec, onInspect }) {
  const panels = Array.isArray(spec.panels) ? spec.panels : Array.isArray(spec.items) ? spec.items : [];
  const colClass =
    panels.length <= 2
      ? styles.kpiGridCols2
      : panels.length === 4
        ? styles.kpiGridCols4
        : panels.length === 3 || panels.length === 6
          ? styles.kpiGridCols3
          : styles.kpiGridCols4;

  return (
    <div className={`${styles.kpiGrid} ${colClass}`}>
      {panels.map((panel, idx) => {
        const payload = {
          title: panel.label || "Metric",
          rows: [
            { label: "Value", value: String(panel.value ?? "—"), color: "#1B9ACD" },
            ...(panel.previous ? [{ label: "Baseline", value: String(panel.previous), color: "#71717A" }] : []),
            ...(panel.target ? [{ label: "Target", value: String(panel.target), color: "#D97706" }] : []),
          ],
          note: panel.note || "",
        };

        return (
          <div
            key={`${panel.label}-${idx}`}
            className={styles.kpiCell}
            tabIndex={0}
            onMouseEnter={(e) => onInspect(e, payload)}
            onMouseMove={(e) => onInspect(e, payload)}
            onFocus={(e) => onInspect(e, payload)}
            onClick={(e) => onInspect(e, payload)}
            onMouseLeave={() => onInspect(null, null)}
          >
            <div className={styles.kpiTopGroup}>
              <span className={styles.kpiLabel}>{panel.label}</span>
              <span className={styles.kpiValue}>{panel.value}</span>
              {panel.note && <span className={styles.kpiNoteText}>{panel.note}</span>}
            </div>
            {(panel.delta || panel.previous || panel.target) && (
              <div className={styles.kpiMetaGroup}>
                {panel.delta && (
                  <span className={`${styles.deltaBadge} ${getDeltaClass(panel.deltaTone, panel.delta)}`}>
                    {panel.delta}
                  </span>
                )}
                {(panel.previous || panel.target) && (
                  <span className={styles.kpiMetaLine}>
                    {panel.previous ? `vs ${panel.previous}` : `Target: ${panel.target}`}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChartBodyRouter({ type, spec, unit, onInspect }) {
  if (type === "grouped_bar") return <GroupedBarView spec={spec} unit={unit} onInspect={onInspect} />;
  if (type === "line") return <AnnotatedLineView spec={spec} unit={unit} onInspect={onInspect} />;
  if (type === "range") return <RangeComparisonView spec={spec} unit={unit} onInspect={onInspect} />;
  if (type === "kpi") return <KpiPanelsView spec={spec} onInspect={onInspect} />;
  return null;
}

export default function ChartDiagram({ rawJson = "" }) {
  const figureRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const parsed = useMemo(() => {
    try {
      const cleaned = String(rawJson || "")
        .replace(/^```(?:chart)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      const obj = JSON.parse(cleaned);
      const normType = normalizeChartType(obj?.type);
      if (!obj || typeof obj !== "object" || !normType) {
        return { error: "Unsupported or missing chart type." };
      }
      return { spec: obj, type: normType };
    } catch (err) {
      return { error: err?.message || "Invalid chart JSON." };
    }
  }, [rawJson]);

  const handleInspect = useCallback((event, payload) => {
    if (!payload) {
      setTooltip(null);
      return;
    }
    const containerRect = figureRef.current?.getBoundingClientRect();
    if (!containerRect || !event) {
      setTooltip({ ...payload, x: null, y: null });
      return;
    }
    const clientX = event.clientX ?? (event.currentTarget?.getBoundingClientRect().left + event.currentTarget?.getBoundingClientRect().width / 2);
    const clientY = event.clientY ?? event.currentTarget?.getBoundingClientRect().top;
    const relX = Math.max(95, Math.min(containerRect.width - 95, clientX - containerRect.left));
    const relY = Math.max(36, clientY - containerRect.top);
    setTooltip({ ...payload, x: relX, y: relY });
  }, []);

  if (parsed.error) {
    return (
      <div className={styles.fallbackBox} role="note">
        Interactive data visual unavailable ({parsed.error}).
      </div>
    );
  }

  const { spec, type } = parsed;
  const unit = spec.unit || "";

  return (
    <figure ref={figureRef} className={styles.chartFigure}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitleWrap}>
          {spec.eyebrow && <span className={styles.chartEyebrow}>{spec.eyebrow}</span>}
          {spec.title && <h4 className={styles.chartTitle}>{spec.title}</h4>}
          {spec.subtitle && <p className={styles.chartSubtitle}>{spec.subtitle}</p>}
        </div>
        {(unit || spec.delta || spec.badge) && (
          <div className={styles.chartHeaderMeta}>
            {unit && <span className={styles.unitTag}>{unit}</span>}
            {(spec.delta || spec.badge) && (
              <span className={`${styles.deltaBadge} ${getDeltaClass(spec.deltaTone, spec.delta || spec.badge)}`}>
                {spec.delta || spec.badge}
              </span>
            )}
          </div>
        )}
      </div>

      <div className={styles.chartBody}>
        {type === "composite" ? (
          <div className={styles.compositeStack}>
            {(Array.isArray(spec.panels) ? spec.panels : []).map((panel, pIdx) => {
              const subType = normalizeChartType(panel?.type);
              if (!subType || subType === "composite") return null;
              return (
                <div key={pIdx} className={styles.compositePanel}>
                  {(panel.eyebrow || panel.title || panel.badge) && (
                    <div className={styles.compositePanelHead}>
                      <div>
                        {panel.eyebrow && <span className={styles.chartEyebrow}>{panel.eyebrow}</span>}
                        {panel.title && <h5 className={styles.compositePanelTitle}>{panel.title}</h5>}
                      </div>
                      {(panel.badge || panel.unit) && (
                        <span className={styles.unitTag}>{panel.badge || panel.unit}</span>
                      )}
                    </div>
                  )}
                  <ChartBodyRouter type={subType} spec={panel} unit={panel.unit || unit} onInspect={handleInspect} />
                </div>
              );
            })}
          </div>
        ) : (
          <ChartBodyRouter type={type} spec={spec} unit={unit} onInspect={handleInspect} />
        )}
      </div>

      {tooltip && tooltip.x !== null && (
        <div className={styles.tooltipBox} style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }} role="status">
          <div className={styles.tooltipTitle}>{tooltip.title}</div>
          {(tooltip.rows || []).map((r, ri) => (
            <div key={ri} className={styles.tooltipRow}>
              <span className={styles.tooltipSeriesLabel}>
                <span className={styles.tooltipSwatch} style={{ backgroundColor: r.color || "#1B9ACD" }} />
                <span>{r.label}</span>
              </span>
              <span className={styles.tooltipValue}>{r.value}</span>
            </div>
          ))}
          {tooltip.note && <div className={styles.tooltipNote}>{tooltip.note}</div>}
        </div>
      )}

      {tooltip && (
        <div className={styles.activeInspectBar}>
          <span>
            <strong>{tooltip.title}:</strong>{" "}
            {(tooltip.rows || []).map((r) => `${r.label} ${r.value}`).join(" • ")}
            {tooltip.note ? ` — ${tooltip.note}` : ""}
          </span>
          <button type="button" className={styles.inspectCloseBtn} onClick={() => setTooltip(null)}>
            Dismiss
          </button>
        </div>
      )}

      {spec.caption && <figcaption className={styles.chartCaption}>{spec.caption}</figcaption>}
    </figure>
  );
}
