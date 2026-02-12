import { API_BASE_URL } from "./config";
import type {
  GamesListResponse,
  GameTrendsResponse,
  GameResponse,
  TrendsResponse,
  LineMovementResponse,
  FavoriteResponse,
  FavoritesListResponse,
} from "./types";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorBody(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => null);
    if (data && typeof data === "object") {
      const errorMessage = (data as { error?: string }).error;
      if (typeof errorMessage === "string") {
        return errorMessage;
      }
      return JSON.stringify(data);
    }
  }

  const text = await res.text().catch(() => "Unknown error");
  return text || "Unknown error";
}

async function fetchApi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, init);

  if (!res.ok) {
    const errorText = await parseErrorBody(res);
    throw new ApiError(res.status, errorText);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

async function submitAuth(
  endpoint: "/api/auth/login" | "/api/auth/register",
  credentials: { email: string; password: string },
): Promise<AuthResponse> {
  return fetchApi<AuthResponse>(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

function authHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function toTeamKey(teamName: string): string {
  return teamName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function loginUser(
  credentials: { email: string; password: string },
): Promise<AuthResponse> {
  return submitAuth("/api/auth/login", credentials);
}

export async function registerUser(
  credentials: { email: string; password: string },
): Promise<AuthResponse> {
  return submitAuth("/api/auth/register", credentials);
}

export async function logoutUser(
  token?: string | null,
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>("/api/auth/logout", {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function requestPasswordReset(
  email: string,
): Promise<{ message: string; resetToken?: string }> {
  return fetchApi<{ message: string; resetToken?: string }>(
    "/api/auth/forgot-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
  );
}

export async function resetForgottenPassword(
  payload: { token: string; newPassword: string },
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchGames(sportKey: string): Promise<GamesListResponse> {
  return fetchApi<GamesListResponse>(`/api/games?sportKey=${sportKey}`);
}

export async function fetchGame(
  gameId: string,
  sportKey: string,
): Promise<GameResponse> {
  return fetchApi<GameResponse>(
    `/api/games/${encodeURIComponent(gameId)}?sportKey=${sportKey}`,
  );
}

export async function fetchGameTrends(
  gameId: string,
  sportKey: string,
  token?: string | null,
): Promise<GameTrendsResponse> {
  return fetchApi<GameTrendsResponse>(
    `/api/games/${encodeURIComponent(gameId)}/trends?sportKey=${sportKey}`,
    { headers: authHeaders(token) },
  );
}

export async function fetchTrends(
  minPct: number,
  token?: string | null,
): Promise<TrendsResponse> {
  return fetchApi<TrendsResponse>(`/api/trends?minPct=${minPct}`, {
    headers: authHeaders(token),
  });
}

export async function fetchLineMovement(
  gameId: string,
  sportKey: string,
  token?: string | null,
): Promise<LineMovementResponse> {
  return fetchApi<LineMovementResponse>(
    `/api/games/${encodeURIComponent(gameId)}/line-movement?sportKey=${sportKey}`,
    { headers: authHeaders(token) },
  );
}

export async function fetchFavorites(
  token?: string | null,
): Promise<FavoritesListResponse> {
  return fetchApi<FavoritesListResponse>("/api/users/me/favorites", {
    headers: authHeaders(token),
  });
}

export async function createFavorite(payload: {
  sportKey: string;
  teamName: string;
  label?: string;
  teamKey?: string;
}, token?: string | null): Promise<FavoriteResponse> {
  return fetchApi<FavoriteResponse>("/api/users/me/favorites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({
      sportKey: payload.sportKey,
      teamName: payload.teamName,
      label: payload.label ?? "",
      teamKey: payload.teamKey ?? toTeamKey(payload.teamName),
    }),
  });
}

export async function updateFavorite(
  favoriteId: string,
  payload: { label?: string; teamName?: string },
  token?: string | null,
): Promise<FavoriteResponse> {
  return fetchApi<FavoriteResponse>(
    `/api/users/me/favorites/${encodeURIComponent(favoriteId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteFavorite(
  favoriteId: string,
  token?: string | null,
): Promise<void> {
  await fetchApi<void>(`/api/users/me/favorites/${encodeURIComponent(favoriteId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function changePassword(
  payload: { currentPassword: string; newPassword: string },
  token?: string | null,
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>("/api/users/me/password", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteAccount(token?: string | null): Promise<void> {
  await fetchApi<void>("/api/users/me", {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export { ApiError, toTeamKey };
