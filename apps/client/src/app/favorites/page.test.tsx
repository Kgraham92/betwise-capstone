import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import FavoritesPage from "./page";

const fetchFavoritesMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    fetchFavorites: (...args: unknown[]) => fetchFavoritesMock(...args),
    createFavorite: vi.fn(),
    updateFavorite: vi.fn(),
    deleteFavorite: vi.fn(),
  };
});

describe("FavoritesPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows login prompt when user is not authenticated", async () => {
    useAuthMock.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
    });

    render(<FavoritesPage />);

    expect(screen.getByText("Favorites Locked")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log In" })).toBeInTheDocument();
  });

  it("loads and renders favorites for authenticated user", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "user@test.com" },
      token: "token-123",
      isLoading: false,
    });

    fetchFavoritesMock.mockResolvedValue({
      count: 1,
      favorites: [
        {
          id: "fav_1",
          sportKey: "basketball_nba",
          teamKey: "lakers",
          teamName: "Lakers",
          label: "Primary",
        },
      ],
    });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText("Favorite Teams")).toBeInTheDocument();
      expect(screen.getByText("Lakers")).toBeInTheDocument();
    });
  });
});
