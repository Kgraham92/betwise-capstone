"use client";

import { useState, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { GameCard } from "@/components/games/GameCard";
import { GameCardSkeleton } from "@/components/ui/Skeleton";
import { fetchGames, ApiError } from "@/lib/api";
import { SPORTS, DEFAULT_SPORT } from "@/lib/types";
import type { BetWiseGame } from "@/lib/types";

type LoadingState = "loading" | "idle" | "error";

export default function GamesPage() {
  const [selectedSport, setSelectedSport] = useState(DEFAULT_SPORT);
  const [games, setGames] = useState<BetWiseGame[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [sportDisabled, setSportDisabled] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadGames() {
      setLoadingState("loading");
      setError(null);
      setSportDisabled(false);

      try {
        const response = await fetchGames(selectedSport);
        if (!cancelled) {
          setGames(response.games);
          setLoadingState("idle");
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 400) {
            const msg = err.message || "";
            if (msg.includes("Sport is disabled")) {
              setSportDisabled(true);
              setGames([]);
              setLoadingState("idle");
              return;
            }
          }
          setError(err instanceof Error ? err.message : "Failed to load games");
          setLoadingState("error");
        }
      }
    }

    loadGames();

    return () => {
      cancelled = true;
    };
  }, [selectedSport, retryCount]);

  const handleSportChange = (sportKey: string) => {
    setSelectedSport(sportKey);
  };

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  return (
    <div className="min-h-screen bg-brand-midnight">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-white mb-2">
            Upcoming Games
          </h1>
          <p className="text-brand-muted">
            View odds and betting insights for upcoming matchups
          </p>
        </div>

        {/* Sport Selector */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {SPORTS.map((sport) => (
            <button
              key={sport.key}
              onClick={() => handleSportChange(sport.key)}
              disabled={loadingState === "loading"}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-50 ${
                selectedSport === sport.key
                  ? "bg-brand-teal text-brand-midnight"
                  : "bg-brand-surface text-brand-muted hover:text-brand-white hover:bg-brand-surface/80"
              }`}
            >
              {sport.name}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loadingState === "loading" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {loadingState === "error" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-brand-white mb-2">
              Failed to Load Games
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

        {/* Empty State */}
        {loadingState === "idle" && games.length === 0 && !sportDisabled && (
          <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-12 text-center">
            <h3 className="text-lg font-semibold text-brand-white mb-2">
              No Upcoming Games
            </h3>
            <p className="text-brand-muted">
              There are no scheduled games for this sport at the moment.
            </p>
          </div>
        )}

        {/* Disabled Sport State */}
        {loadingState === "idle" && sportDisabled && (
          <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-12 text-center">
            <h3 className="text-lg font-semibold text-brand-white mb-2">
              We&apos;re not watching this right now
            </h3>
            <p className="text-brand-muted">
              This league is temporarily disabled to reduce unnecessary data
              calls. Check back later.
            </p>
          </div>
        )}

        {/* Games Grid */}
        {loadingState === "idle" && games.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <GameCard key={game.providerGameId} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
