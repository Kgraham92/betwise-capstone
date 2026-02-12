import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { SentimentBar } from "./SentimentBar";
import { Badge } from "@/components/ui/Badge";
import type { SentimentData } from "@/lib/types";

type SentimentPanelProps = {
  sentiment: SentimentData;
  homeTeam: string;
  awayTeam: string;
};

function getConfidenceBadge(confidence: "low" | "med" | "high") {
  switch (confidence) {
    case "high":
      return (
        <Badge variant="success">
          <CheckCircle className="w-3 h-3 mr-1" />
          High Confidence
        </Badge>
      );
    case "med":
      return (
        <Badge variant="info">
          <TrendingUp className="w-3 h-3 mr-1" />
          Medium Confidence
        </Badge>
      );
    case "low":
      return (
        <Badge variant="warning">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Confidence
        </Badge>
      );
  }
}

export function SentimentPanel({
  sentiment,
  homeTeam,
  awayTeam,
}: SentimentPanelProps) {
  return (
    <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-brand-white">
          Public Betting Sentiment
        </h3>
        {getConfidenceBadge(sentiment.confidence)}
      </div>

      <div className="space-y-6">
        <div>
          <div className="text-sm font-medium text-brand-muted mb-3 uppercase tracking-wider">
            Spread
          </div>
          <SentimentBar
            leftLabel={homeTeam}
            rightLabel={awayTeam}
            leftPct={sentiment.spread.homePct}
            rightPct={sentiment.spread.awayPct}
          />
        </div>

        <div>
          <div className="text-sm font-medium text-brand-muted mb-3 uppercase tracking-wider">
            Moneyline
          </div>
          <SentimentBar
            leftLabel={homeTeam}
            rightLabel={awayTeam}
            leftPct={sentiment.moneyline.homePct}
            rightPct={sentiment.moneyline.awayPct}
            leftColor="bg-brand-green"
            rightColor="bg-purple-500"
          />
        </div>

        <div>
          <div className="text-sm font-medium text-brand-muted mb-3 uppercase tracking-wider">
            Total
          </div>
          <SentimentBar
            leftLabel="Over"
            rightLabel="Under"
            leftPct={sentiment.total.overPct}
            rightPct={sentiment.total.underPct}
            leftColor="bg-orange-500"
            rightColor="bg-cyan-500"
          />
        </div>
      </div>

      <p className="mt-6 text-xs text-brand-muted/60 text-center">
        Sentiment data is simulated for demonstration purposes.
      </p>
    </div>
  );
}
