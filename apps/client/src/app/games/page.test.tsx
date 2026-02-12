import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import GamesPage from "./page";
import { ApiError } from "@/lib/api";

const fetchGamesMock = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    token: null,
    isLoading: false,
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    fetchGames: (...args: unknown[]) => fetchGamesMock(...args),
  };
});

describe("GamesPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders games after a successful load", async () => {
    fetchGamesMock.mockResolvedValue({
      sportKey: "basketball_nba",
      regions: "us",
      markets: "h2h,spreads,totals",
      oddsFormat: "american",
      count: 1,
      games: [
        {
          providerGameId: "g1",
          sportKey: "basketball_nba",
          commenceTime: "2026-01-28T01:00:00.000Z",
          homeTeam: "Lakers",
          awayTeam: "Celtics",
          moneylineHome: -150,
          moneylineAway: 130,
        },
      ],
    });

    render(<GamesPage />);

    await waitFor(() => {
      expect(screen.getByText("Lakers")).toBeInTheDocument();
      expect(screen.getByText(/vs Celtics/i)).toBeInTheDocument();
    });
    expect(fetchGamesMock).toHaveBeenCalledTimes(1);
  });

  it("retries after an error when clicking Try Again", async () => {
    fetchGamesMock
      .mockRejectedValueOnce(new Error("Network down"))
      .mockResolvedValueOnce({
        sportKey: "basketball_nba",
        regions: "us",
        markets: "h2h,spreads,totals",
        oddsFormat: "american",
        count: 0,
        games: [],
      });

    render(<GamesPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to Load Games")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => {
      expect(fetchGamesMock).toHaveBeenCalledTimes(2);
      expect(screen.getByText("No Upcoming Games")).toBeInTheDocument();
    });
  });

  it("shows disabled-sport state for API 400 'Sport is disabled'", async () => {
    fetchGamesMock.mockRejectedValue(
      new ApiError(400, "Sport is disabled"),
    );

    render(<GamesPage />);

    await waitFor(() => {
      expect(screen.getByText("We're not watching this right now")).toBeInTheDocument();
    });
  });
});
