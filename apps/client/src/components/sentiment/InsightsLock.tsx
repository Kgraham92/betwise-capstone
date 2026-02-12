import { Lock, Clock } from "lucide-react";
import Link from "next/link";

type InsightsLockProps = {
  commenceTime: string;
  isAuthLock?: boolean;
};

function getTimeUntilUnlock(commenceTime: string): string {
  const gameDate = new Date(commenceTime);
  const unlockDate = new Date(gameDate.getTime() - 48 * 60 * 60 * 1000);
  const now = new Date();

  const diffMs = unlockDate.getTime() - now.getTime();

  if (diffMs <= 0) return "soon";

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}

export function InsightsLock({ commenceTime, isAuthLock }: InsightsLockProps) {
  const timeUntil = getTimeUntilUnlock(commenceTime);

  if (isAuthLock) {
    return (
      <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-midnight mb-4">
          <Lock className="w-6 h-6 text-brand-teal" />
        </div>
        <h3 className="text-lg font-semibold text-brand-white mb-2">
          Login to Unlock Insights
        </h3>
        <p className="text-brand-muted text-sm mb-6">
          Sign in to view advanced betting sentiment, public trends, and money flow analysis.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-2 bg-brand-teal text-brand-midnight font-bold rounded-lg hover:bg-brand-teal/90 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-6 py-2 bg-brand-surface border border-brand-muted/20 text-brand-white font-medium rounded-lg hover:bg-brand-surface/80 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-midnight mb-4">
        <Lock className="w-6 h-6 text-brand-muted" />
      </div>
      <h3 className="text-lg font-semibold text-brand-white mb-2">
        Betting Insights Locked
      </h3>
      <p className="text-brand-muted text-sm mb-4">
        Detailed betting sentiment becomes available 48 hours before game time.
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-midnight text-brand-muted text-sm">
        <Clock className="w-4 h-4" />
        <span>
          Unlocks in <span className="text-brand-teal font-medium">{timeUntil}</span>
        </span>
      </div>
    </div>
  );
}
