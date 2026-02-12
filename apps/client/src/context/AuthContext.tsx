"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/api";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "betwise_token";
const USER_KEY = "betwise_user";

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getTokenSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

let lastUserRaw: string | null = null;
let lastUserParsed: User | null = null;

function getUserSnapshot(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored === lastUserRaw) return lastUserParsed;
    lastUserRaw = stored;
    lastUserParsed = stored ? (JSON.parse(stored) as User) : null;
    return lastUserParsed;
  } catch {
    return null;
  }
}

function getServerSnapshot(): null {
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribeToStorage,
    getTokenSnapshot,
    getServerSnapshot,
  );
  const user = useSyncExternalStore(
    subscribeToStorage,
    getUserSnapshot,
    getServerSnapshot,
  );

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    window.dispatchEvent(new Event("storage"));
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutUser(token);
      }
    } catch {
      // Always clear local auth state, even if server logout fails.
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event("storage"));
      router.push("/");
    }
  }, [router, token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
