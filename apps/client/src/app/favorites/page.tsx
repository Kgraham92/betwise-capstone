"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  createFavorite,
  deleteFavorite,
  fetchFavorites,
  updateFavorite,
} from "@/lib/api";
import { LEAGUE_TEAMS, SPORTS } from "@/lib/types";
import type { FavoriteTeam } from "@/lib/types";

type LoadingState = "loading" | "idle" | "error";

export default function FavoritesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [sportKey, setSportKey] = useState(SPORTS[0]?.key ?? "basketball_nba");
  const [teamName, setTeamName] = useState(
    LEAGUE_TEAMS[SPORTS[0]?.key ?? "basketball_nba"]?.[0] ?? "",
  );
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const [labelDrafts, setLabelDrafts] = useState<Record<string, string>>({});
  const teamOptions = LEAGUE_TEAMS[sportKey] ?? [];

  useEffect(() => {
    setTeamName(LEAGUE_TEAMS[sportKey]?.[0] ?? "");
  }, [sportKey]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoadingState("idle");
      return;
    }

    let cancelled = false;

    async function loadFavorites() {
      setLoadingState("loading");
      setError(null);

      try {
        const data = await fetchFavorites(token);
        if (!cancelled) {
          setFavorites(data.favorites);
          setLoadingState("idle");
          setLabelDrafts(
            Object.fromEntries(
              data.favorites.map((favorite) => [favorite.id, favorite.label]),
            ),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setLoadingState("error");
          setError(err instanceof Error ? err.message : "Failed to load favorites");
        }
      }
    }

    loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [authLoading, token]);

  async function handleAddFavorite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;

    if (!teamName) {
      setError("Team name is required");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const result = await createFavorite(
        {
          sportKey,
          teamName,
          label: label.trim(),
        },
        token,
      );
      setFavorites((prev) => [...prev, result.favorite]);
      setLabelDrafts((prev) => ({
        ...prev,
        [result.favorite.id]: result.favorite.label,
      }));
      setTeamName("");
      setLabel("");
      setNotice(`${result.favorite.teamName} added to favorites`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("That team is already in your favorites");
      } else {
        setError(err instanceof Error ? err.message : "Failed to add favorite");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLabel(favorite: FavoriteTeam) {
    if (!token) return;

    const nextLabel = (labelDrafts[favorite.id] ?? "").trim();

    try {
      const result = await updateFavorite(
        favorite.id,
        { label: nextLabel || "" },
        token,
      );
      setFavorites((prev) =>
        prev.map((item) =>
          item.id === favorite.id ? result.favorite : item,
        ),
      );
      setNotice(`Saved label for ${result.favorite.teamName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update favorite");
    }
  }

  async function handleDelete(favoriteId: string) {
    if (!token) return;

    try {
      await deleteFavorite(favoriteId, token);
      setFavorites((prev) => prev.filter((item) => item.id !== favoriteId));
      setNotice("Favorite removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove favorite");
    }
  }

  if (authLoading || loadingState === "loading") {
    return (
      <div className="min-h-screen bg-brand-midnight p-8 text-center text-brand-white">
        Loading favorites...
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-brand-midnight flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-brand-muted/10 bg-brand-surface p-8 text-center">
          <h1 className="text-2xl font-bold text-brand-white mb-3">Favorites Locked</h1>
          <p className="text-brand-muted mb-6">
            Log in to create and manage favorite teams.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-brand-teal px-4 py-2 font-semibold text-brand-midnight"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-brand-muted/20 px-4 py-2 text-brand-white"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-midnight p-6">
      <div className="container mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-white">Favorite Teams</h1>
          <p className="text-brand-muted">
            Track teams you care about and keep quick access to their games.
          </p>
        </div>

        <form
          onSubmit={handleAddFavorite}
          className="grid gap-3 rounded-xl border border-brand-muted/10 bg-brand-surface p-4 md:grid-cols-4"
        >
          <select
            value={sportKey}
            onChange={(e) => setSportKey(e.target.value)}
            className="rounded-lg border border-brand-muted/20 bg-brand-midnight px-3 py-2 text-brand-white"
          >
            {SPORTS.map((sport) => (
              <option key={sport.key} value={sport.key}>
                {sport.name}
              </option>
            ))}
          </select>
          <select
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="rounded-lg border border-brand-muted/20 bg-brand-midnight px-3 py-2 text-brand-white md:col-span-2"
          >
            {teamOptions.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-teal px-3 py-2 font-semibold text-brand-midnight disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add"}
          </button>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            className="rounded-lg border border-brand-muted/20 bg-brand-midnight px-3 py-2 text-brand-white md:col-span-4"
          />
        </form>

        {notice && (
          <div className="rounded-lg border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm text-brand-teal">
            {notice}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {loadingState === "error" && !favorites.length ? null : (
          <div className="space-y-3">
            {favorites.length === 0 ? (
              <div className="rounded-xl border border-brand-muted/10 bg-brand-surface p-6 text-center text-brand-muted">
                No favorites yet. Add a team above.
              </div>
            ) : (
              favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="rounded-xl border border-brand-muted/10 bg-brand-surface p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-brand-white">{favorite.teamName}</div>
                      <div className="text-sm text-brand-muted">{favorite.sportKey}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(favorite.id)}
                      className="rounded-lg border border-red-500/40 px-3 py-1 text-sm text-red-300"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={labelDrafts[favorite.id] ?? ""}
                      onChange={(e) =>
                        setLabelDrafts((prev) => ({
                          ...prev,
                          [favorite.id]: e.target.value,
                        }))
                      }
                      placeholder="Label"
                      className="flex-1 rounded-lg border border-brand-muted/20 bg-brand-midnight px-3 py-2 text-brand-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveLabel(favorite)}
                      className="rounded-lg border border-brand-muted/40 px-3 py-2 text-brand-white"
                    >
                      Save Label
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
