"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const data = await registerUser({ email, password });

      login(data.token, data.user);
      router.push("/games");
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred");
        }
    }
  };

  return (
    <div className="min-h-screen bg-brand-midnight flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-brand-surface p-8 rounded-xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-muted mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              className="w-full bg-brand-midnight border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-teal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-brand-muted mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              className="w-full bg-brand-midnight border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-teal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-muted mb-1">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              className="w-full bg-brand-midnight border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-teal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-teal text-brand-midnight font-bold py-2 rounded-lg hover:bg-brand-teal/90 transition-colors"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-brand-muted text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-teal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
