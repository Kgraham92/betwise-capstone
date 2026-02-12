type SentimentBarProps = {
  leftLabel: string;
  rightLabel: string;
  leftPct: number;
  rightPct: number;
  leftColor?: string;
  rightColor?: string;
};

export function SentimentBar({
  leftLabel,
  rightLabel,
  leftPct,
  rightPct,
  leftColor = "bg-brand-teal",
  rightColor = "bg-brand-blue",
}: SentimentBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-brand-muted">
          {leftLabel}{" "}
          <span className="text-brand-white font-semibold">{leftPct}%</span>
        </span>
        <span className="text-brand-muted">
          <span className="text-brand-white font-semibold">{rightPct}%</span>{" "}
          {rightLabel}
        </span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-brand-midnight">
        <div
          className={`${leftColor} transition-all duration-500`}
          style={{ width: `${leftPct}%` }}
          role="progressbar"
          aria-valuenow={leftPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${leftLabel}: ${leftPct}%`}
        />
        <div
          className={`${rightColor} transition-all duration-500`}
          style={{ width: `${rightPct}%` }}
          role="progressbar"
          aria-valuenow={rightPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${rightLabel}: ${rightPct}%`}
        />
      </div>
    </div>
  );
}
