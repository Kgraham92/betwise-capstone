"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Flame, Lock, RefreshCw } from "lucide-react";
import { fetchTrends } from "@/lib/api";
import { formatGameTime, getSportLabel } from "@/lib/format";
import type { TrendItem, TrendsResponse } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

type LoadingState = "loading" | "idle" | "error";

export default function TrendsPage() {
  const { user, isLoading, token } = useAuth();
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const minPct = 60;

  useEffect(() => {
    if (!user || !token) return;

    let cancelled = false;

    async function load() {
      setLoadingState("loading");
      setError(null);

      try {
        const response = await fetchTrends(minPct, token);
        if (!cancelled) {
          setData(response);
          setLoadingState("idle");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load trends");
          setLoadingState("error");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user, token, minPct, retryCount]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-brand-midnight p-8 text-center text-white">
        Loading...
      </div>
    );

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-midnight flex flex-col items-center justify-center p-4">
        <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-8 text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-midnight mb-6">
                <Lock className="w-8 h-8 text-brand-teal" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Trends Locked</h1>
            <p className="text-brand-muted mb-8">
                Global betting trends and analysis are available only to registered users.
            </p>
            <div className="flex flex-col gap-3">
                <Link href="/login" className="bg-brand-teal text-brand-midnight font-bold py-3 px-6 rounded-lg hover:bg-brand-teal/90 transition-colors">
                    Log In
                </Link>
                <Link href="/register" className="bg-brand-midnight border border-brand-muted/20 text-white font-medium py-3 px-6 rounded-lg hover:bg-brand-surface transition-colors">
                    Create Account
                </Link>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-midnight p-8">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Betting Trends
            </h1>
            <p className="text-brand-muted">
              Games with {minPct}%+ sentiment on spread, moneyline, or total.
            </p>
          </div>
          {data && (
            <div className="inline-flex items-center gap-2 text-sm text-brand-muted">
              <Flame className="w-4 h-4 text-brand-teal" />
              <span>{data.count} qualifying games</span>
            </div>
          )}
        </div>

        {loadingState === "loading" && (
          <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-8 text-center text-brand-muted">
            Loading trends...
          </div>
        )}

        {loadingState === "error" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-brand-white mb-2">
              Failed to Load Trends
            </h3>
            <p className="text-brand-muted mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-surface text-brand-white rounded-lg hover:bg-brand-surface/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {loadingState === "idle" && data && data.items.length === 0 && (
          <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              No High-Sentiment Games Right Now
            </h2>
            <p className="text-brand-muted">
              Check back later for new market shifts.
            </p>
          </div>
        )}

        {loadingState === "idle" && data && data.items.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {data.items.map((item: TrendItem) => (
              <Link
                key={item.game.providerGameId}
                href={`/games/${item.game.providerGameId}?sportKey=${item.game.sportKey}`}
                className="bg-brand-surface border border-brand-muted/10 rounded-xl p-6 hover:border-brand-teal/30 hover:bg-brand-surface/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-brand-white font-semibold">
                      {item.game.homeTeam}{" "}
                      <span className="text-brand-muted">vs</span>{" "}
                      {item.game.awayTeam}
                    </div>
                    <div className="text-brand-muted text-sm mt-1">
                      {formatGameTime(item.game.commenceTime)}
                    </div>
                  </div>
                  <Badge variant="info">
                    {getSportLabel(item.game.sportKey)}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.highlights.map((h, idx) => (
                    <Badge key={`${h.market}-${h.side}-${idx}`} variant="success">
                      {h.market}: {h.side} {h.pct}%
                    </Badge>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
