type LineMovementPoint = {
  timestamp: string;
  spreadHome?: number;
  moneylineHome?: number;
  total?: number;
  sentimentSpreadHome?: number;
  sentimentMoneylineHome?: number;
  sentimentOver?: number;
};

type LineMovementChartProps = {
  points: LineMovementPoint[];
};

type SeriesKey =
  | "spreadHome"
  | "moneylineHome"
  | "total"
  | "sentimentSpreadHome"
  | "sentimentMoneylineHome"
  | "sentimentOver";

const ODDS_SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "spreadHome", label: "Spread (Home)", color: "#19D4C5" },
  { key: "moneylineHome", label: "Moneyline (Home)", color: "#3B82F6" },
  { key: "total", label: "Total (O/U)", color: "#F97316" },
];

const SENTIMENT_SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "sentimentSpreadHome", label: "Spread", color: "#19D4C5" },
  { key: "sentimentMoneylineHome", label: "Moneyline", color: "#3B82F6" },
  { key: "sentimentOver", label: "Over", color: "#F97316" },
];

function normalize(values: number[]): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }
  return { min, max };
}

function buildPath(
  points: LineMovementPoint[],
  key: SeriesKey,
  width: number,
  height: number,
  padding: number,
  domain: { min: number; max: number },
) {
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return points
    .map((p, i) => {
      const v = p[key];
      if (typeof v !== "number") return null;

      const x =
        padding + (usableWidth * i) / Math.max(points.length - 1, 1);
      const t = (v - domain.min) / (domain.max - domain.min);
      const y = padding + usableHeight - t * usableHeight;
      return `${i === 0 ? "M" : "L"}${x} ${y}`;
    })
    .filter(Boolean)
    .join(" ");
}

function formatTick(n: number) {
  if (Math.abs(n) >= 100) return Math.round(n).toString();
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(1);
}

function renderYAxis(
  domain: { min: number; max: number },
  x: number,
  height: number,
  padding: number,
) {
  const ticks = 4;
  const usableHeight = height - padding * 2;

  return Array.from({ length: ticks + 1 }).map((_, i) => {
    const t = i / ticks;
    const value = domain.max - (domain.max - domain.min) * t;
    const y = padding + usableHeight * t;
    return (
      <g key={`${x}-${i}`}>
        <line
          x1={x - 4}
          x2={x}
          y1={y}
          y2={y}
          stroke="rgba(148,163,184,0.4)"
          strokeWidth="1"
        />
        <text
          x={x - 8}
          y={y + 4}
          fill="rgba(148,163,184,0.7)"
          fontSize="10"
          textAnchor="end"
        >
          {formatTick(value)}
        </text>
      </g>
    );
  });
}

function renderXAxis(
  points: LineMovementPoint[],
  width: number,
  height: number,
  padding: number,
) {
  if (points.length < 2) return null;
  const usableWidth = width - padding * 2;
  const y = height - padding + 14;

  const labels = Array.from(
    new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
  );
  return labels.map((idx) => {
    const p = points[idx];
    if (!p) return null;
    const x = padding + (usableWidth * idx) / Math.max(points.length - 1, 1);
    const date = new Date(p.timestamp);
    const label = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
    });
    return (
      <text
        key={`${p.timestamp}-${idx}`}
        x={x}
        y={y}
        fill="rgba(148,163,184,0.7)"
        fontSize="10"
        textAnchor="middle"
      >
        {label}
      </text>
    );
  });
}

export function LineMovementChart({ points }: LineMovementChartProps) {
  const width = 640;
  const height = 180;
  const padding = 20;

  const spreadValues = points
    .map((p) => p.spreadHome)
    .filter((v): v is number => typeof v === "number");
  const mlValues = points
    .map((p) => p.moneylineHome)
    .filter((v): v is number => typeof v === "number");
  const totalValues = points
    .map((p) => p.total)
    .filter((v): v is number => typeof v === "number");

  const spreadDomain = normalize(spreadValues);
  const mlDomain = normalize(mlValues);
  const totalDomain = normalize(totalValues);
  const oddsCharts = [
    {
      ...ODDS_SERIES[0],
      domain: spreadDomain,
      ariaLabel: "Spread movement chart",
    },
    {
      ...ODDS_SERIES[1],
      domain: mlDomain,
      ariaLabel: "Moneyline movement chart",
    },
    {
      ...ODDS_SERIES[2],
      domain: totalDomain,
      ariaLabel: "Total movement chart",
    },
  ];

  const sentimentDomain = {
    min: 0,
    max: 100,
  };

  return (
    <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-brand-white mb-4">
        Line Movement
      </h3>

      <div className="space-y-6">
        {oddsCharts.map((series) => (
          <div key={series.key}>
            <div className="text-xs uppercase tracking-wider text-brand-muted mb-2">
              {series.label}
            </div>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-44"
              role="img"
              aria-label={series.ariaLabel}
            >
              {renderYAxis(series.domain, padding, height, padding)}
              <path
                d={
                  buildPath(
                    points,
                    series.key,
                    width,
                    height,
                    padding,
                    series.domain,
                  ) ?? ""
                }
                fill="none"
                stroke={series.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {renderXAxis(points, width, height, padding)}
            </svg>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-brand-white mt-8 mb-4">
        Sentiment Over Time
      </h3>
      <div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44"
          role="img"
          aria-label="Sentiment chart"
        >
          {renderYAxis(sentimentDomain, padding, height, padding)}
          {SENTIMENT_SERIES.map((s) => {
            const path = buildPath(
              points,
              s.key,
              width,
              height,
              padding,
              sentimentDomain,
            );
            if (!path) return null;
            return (
              <path
                key={s.key}
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          {renderXAxis(points, width, height, padding)}
        </svg>

        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          {SENTIMENT_SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-brand-muted">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
