type OddsDisplayProps = {
  spreadHome?: number;
  spreadAway?: number;
  moneylineHome?: number;
  moneylineAway?: number;
  total?: number;
  homeTeam: string;
  awayTeam: string;
  compact?: boolean;
};

function formatSpread(spread?: number): string {
  if (spread === undefined || spread === null) return "--";
  if (spread > 0) return `+${spread}`;
  return spread.toString();
}

function formatMoneyline(ml?: number): string {
  if (ml === undefined || ml === null) return "--";
  if (ml > 0) return `+${ml}`;
  return ml.toString();
}

function formatTotal(total?: number): string {
  if (total === undefined || total === null) return "--";
  return total.toString();
}

export function OddsDisplay({
  spreadHome,
  spreadAway,
  moneylineHome,
  moneylineAway,
  total,
  homeTeam,
  awayTeam,
  compact = false,
}: OddsDisplayProps) {
  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2 text-center">
        <OddsCell label="Spread" value={formatSpread(spreadHome)} />
        <OddsCell label="ML" value={formatMoneyline(moneylineHome)} />
        <OddsCell label="Total" value={`O/U ${formatTotal(total)}`} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-brand-midnight rounded-lg p-4 border border-brand-muted/10">
        <div className="text-brand-muted text-xs uppercase tracking-wider mb-2 text-center">
          Spread
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-muted truncate max-w-[60%]">
              {homeTeam}
            </span>
            <span className="text-brand-white font-semibold">
              {formatSpread(spreadHome)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-muted truncate max-w-[60%]">
              {awayTeam}
            </span>
            <span className="text-brand-white font-semibold">
              {formatSpread(spreadAway)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-brand-midnight rounded-lg p-4 border border-brand-muted/10">
        <div className="text-brand-muted text-xs uppercase tracking-wider mb-2 text-center">
          Moneyline
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-muted truncate max-w-[60%]">
              {homeTeam}
            </span>
            <span
              className={`font-semibold ${moneylineHome && moneylineHome > 0 ? "text-brand-green" : "text-brand-white"}`}
            >
              {formatMoneyline(moneylineHome)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-muted truncate max-w-[60%]">
              {awayTeam}
            </span>
            <span
              className={`font-semibold ${moneylineAway && moneylineAway > 0 ? "text-brand-green" : "text-brand-white"}`}
            >
              {formatMoneyline(moneylineAway)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-brand-midnight rounded-lg p-4 border border-brand-muted/10">
        <div className="text-brand-muted text-xs uppercase tracking-wider mb-2 text-center">
          Total
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-muted">Over</span>
            <span className="text-brand-white font-semibold">
              {formatTotal(total)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-muted">Under</span>
            <span className="text-brand-white font-semibold">
              {formatTotal(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OddsCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-brand-midnight rounded-lg p-2 border border-brand-muted/10">
      <div className="text-brand-muted text-[10px] uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-brand-white font-semibold text-sm">{value}</div>
    </div>
  );
}
