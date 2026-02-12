"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OddsDisplay } from "./OddsDisplay";
import type { BetWiseGame } from "@/lib/types";
import { formatGameTime, getSportLabel } from "@/lib/format";
import { createFavorite } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type GameCardProps = {
  game: BetWiseGame;
};

export function GameCard({ game }: GameCardProps) {
  const router = useRouter();
  const { user, token } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);

  const handleClick = () => {
    router.push(`/games/${game.providerGameId}?sportKey=${game.sportKey}`);
  };

  async function handleTrackTeam(teamName: string, event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    setNotice(null);

    try {
      await createFavorite(
        {
          sportKey: game.sportKey,
          teamName,
        },
        token,
      );
      setNotice(`Tracking ${teamName}`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to track team");
    }
  }

  return (
    <Card hover onClick={handleClick} className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-brand-white font-semibold mb-1">
            {game.homeTeam}
          </div>
          <div className="text-brand-muted text-sm">vs {game.awayTeam}</div>
        </div>
        <Badge variant="info">{getSportLabel(game.sportKey)}</Badge>
      </div>

      <div className="flex items-center gap-1.5 text-brand-muted text-xs mb-4">
        <Calendar className="w-3 h-3" />
        <span>{formatGameTime(game.commenceTime)}</span>
      </div>

      <OddsDisplay
        spreadHome={game.spreadHome}
        spreadAway={game.spreadAway}
        moneylineHome={game.moneylineHome}
        moneylineAway={game.moneylineAway}
        total={game.total}
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
        compact
      />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={(event) => handleTrackTeam(game.homeTeam, event)}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-brand-muted/20 px-2 py-1 text-xs text-brand-white hover:border-brand-teal/50"
        >
          <Star className="h-3.5 w-3.5" /> Track {game.homeTeam}
        </button>
        <button
          type="button"
          onClick={(event) => handleTrackTeam(game.awayTeam, event)}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-brand-muted/20 px-2 py-1 text-xs text-brand-white hover:border-brand-teal/50"
        >
          <Star className="h-3.5 w-3.5" /> Track {game.awayTeam}
        </button>
      </div>

      {notice ? (
        <div className="mt-2 text-xs text-brand-teal">{notice}</div>
      ) : null}
    </Card>
  );
}
