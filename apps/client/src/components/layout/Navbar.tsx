"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/games") {
      return pathname.startsWith("/games");
    }
    return pathname === path;
  };

  return (
    <header className="border-b border-brand-surface bg-brand-midnight/95 backdrop-blur-sm fixed w-full z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-brand-teal" />
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-teal to-brand-blue bg-clip-text text-transparent">
              BetWise
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/games"
              className={`transition-colors ${
                isActive("/games")
                  ? "text-brand-teal"
                  : "text-brand-muted hover:text-brand-teal"
              }`}
            >
              Games
            </Link>
            <Link
              href="/trends"
              className={`transition-colors ${
                isActive("/trends")
                  ? "text-brand-teal"
                  : "text-brand-muted hover:text-brand-teal"
              }`}
            >
              Trends
            </Link>
            {user ? (
              <Link
                href="/favorites"
                className={`transition-colors ${
                  isActive("/favorites")
                    ? "text-brand-teal"
                    : "text-brand-muted hover:text-brand-teal"
                }`}
              >
                Favorites
              </Link>
            ) : null}
            {user ? (
              <Link
                href="/account"
                className={`transition-colors ${
                  isActive("/account")
                    ? "text-brand-teal"
                    : "text-brand-muted hover:text-brand-teal"
                }`}
              >
                Account
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-brand-white text-sm">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.email}</span>
              </div>
              <button
                onClick={() => void logout()}
                className="text-sm font-medium text-brand-muted hover:text-brand-white transition-colors flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-brand-white hover:text-brand-teal transition-colors">
                Log in
              </Link>
              <Link href="/register" className="bg-brand-teal hover:bg-teal-400 text-brand-midnight text-sm font-bold px-4 py-2 rounded-full transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
