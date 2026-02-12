"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { OddsDisplay } from "@/components/games/OddsDisplay";
import { LineMovementChart } from "@/components/games/LineMovementChart";
import { SentimentPanel } from "@/components/sentiment/SentimentPanel";
import { InsightsLock } from "@/components/sentiment/InsightsLock";
import { Badge } from "@/components/ui/Badge";
import { GameDetailSkeleton } from "@/components/ui/Skeleton";
import { fetchGameTrends, fetchGame, fetchLineMovement, ApiError } from "@/lib/api";
import { formatGameDateTime, getSportLabel } from "@/lib/format";
import type { GameTrendsResponse, LineMovementResponse } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

type LoadingState = "loading" | "idle" | "error";

export default function GameDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { token, isLoading: authLoading } = useAuth();

  const gameId = params.id as string;
  const sportKey = searchParams.get("sportKey") || "basketball_nba";

  const [data, setData] = useState<GameTrendsResponse | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [authLocked, setAuthLocked] = useState(false);
  const [sportDisabled, setSportDisabled] = useState(false);
  const [lineMovement, setLineMovement] = useState<LineMovementResponse | null>(null);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function loadGame() {
      setLoadingState("loading");
      setError(null);
      setAuthLocked(false);
      setSportDisabled(false);

      try {
        if (token) {
          try {
            const response = await fetchGameTrends(gameId, sportKey, token);
            if (!cancelled) {
              setData(response);
              setLoadingState("idle");
            }
          } catch (err) {
            // Check if 401 Unauthorized
            if (err instanceof ApiError && err.status === 401) {
              setAuthLocked(true);
              const basic = await fetchGame(gameId, sportKey);
              if (!cancelled) {
                setData({
                  game: basic.game,
                  splitsAvailable: false,
                });
                setLoadingState("idle");
              }
            } else if (err instanceof ApiError && err.status === 400) {
              if (err.message.includes("Sport is disabled")) {
                setSportDisabled(true);
                setLoadingState("idle");
                return;
              }
            } else {
              throw err;
            }
          }
          try {
            const movement = await fetchLineMovement(gameId, sportKey, token);
            if (!cancelled) setLineMovement(movement);
          } catch {
            if (!cancelled) setLineMovement(null);
          }
        } else {
          setAuthLocked(true);
          try {
            const basic = await fetchGame(gameId, sportKey);
            if (!cancelled) {
              setData({
                game: basic.game,
                splitsAvailable: false,
              });
              setLoadingState("idle");
            }
          } catch (err) {
            if (err instanceof ApiError && err.status === 400) {
              if (err.message.includes("Sport is disabled")) {
                setSportDisabled(true);
                setLoadingState("idle");
                return;
              }
            }
            throw err;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load game details",
          );
          setLoadingState("error");
        }
      }
    }

    loadGame();

    return () => {
      cancelled = true;
    };
  }, [gameId, sportKey, retryCount, token, authLoading]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  return (
    <div className="min-h-screen bg-brand-midnight">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Link
          href="/games"
          className="inline-flex items-center gap-2 text-brand-muted hover:text-brand-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </Link>

        {/* Loading State */}
        {loadingState === "loading" && <GameDetailSkeleton />}

        {/* Error State */}
        {loadingState === "error" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-brand-white mb-2">
              Failed to Load Game
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

        {/* Disabled Sport State */}
        {loadingState === "idle" && sportDisabled && (
          <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-brand-white mb-2">
              We&apos;re not watching this right now
            </h3>
            <p className="text-brand-muted">
              This league is temporarily disabled to reduce unnecessary data
              calls. Check back later.
            </p>
          </div>
        )}

        {/* Game Content */}
        {loadingState === "idle" && data && !sportDisabled && (
          <>
            {/* Game Header */}
            <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-start mb-6">
                <Badge variant="info">{getSportLabel(data.game.sportKey)}</Badge>
              </div>

              <div className="text-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-white mb-2">
                  {data.game.homeTeam}
                  <span className="text-brand-muted mx-3">vs</span>
                  {data.game.awayTeam}
                </h1>
                <div className="flex items-center justify-center gap-2 text-brand-muted">
                  <Calendar className="w-4 h-4" />
                  <span>{formatGameDateTime(data.game.commenceTime)}</span>
                </div>
              </div>

              <OddsDisplay
                spreadHome={data.game.spreadHome}
                spreadAway={data.game.spreadAway}
                moneylineHome={data.game.moneylineHome}
                moneylineAway={data.game.moneylineAway}
                total={data.game.total}
                homeTeam={data.game.homeTeam}
                awayTeam={data.game.awayTeam}
              />
            </div>

            {/* Sentiment Section */}
            {data.splitsAvailable && data.sentiment ? (
              <SentimentPanel
                sentiment={data.sentiment}
                homeTeam={data.game.homeTeam}
                awayTeam={data.game.awayTeam}
              />
            ) : (
              <InsightsLock
                commenceTime={data.game.commenceTime}
                isAuthLock={authLocked}
              />
            )}

            {lineMovement?.points?.length ? (
              <div className="mt-6">
                <LineMovementChart points={lineMovement.points} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
