"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  loginUser,
  requestPasswordReset,
  resetForgottenPassword,
} from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const data = await loginUser({ email, password });

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

  const handleForgotPasswordRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setForgotError("");
    setForgotMessage("");

    try {
      const response = await requestPasswordReset(forgotEmail);
      if (response.resetToken) {
        setResetToken(response.resetToken);
      }
      setForgotMessage(response.message);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setForgotError(err.message);
      } else {
        setForgotError("Unable to request reset right now");
      }
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setForgotError("");
    setForgotMessage("");

    if (newPassword !== confirmNewPassword) {
      setForgotError("New passwords do not match");
      return;
    }

    try {
      const response = await resetForgottenPassword({
        token: resetToken,
        newPassword,
      });
      setForgotMessage(response.message);
      setNewPassword("");
      setConfirmNewPassword("");
      setPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setForgotError(err.message);
      } else {
        setForgotError("Unable to reset password right now");
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-midnight flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-brand-surface p-8 rounded-xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In to BetWise</h2>
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
              onChange={(event) => setEmail(event.target.value)}
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
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-teal text-brand-midnight font-bold py-2 rounded-lg hover:bg-brand-teal/90 transition-colors"
          >
            Sign In
          </button>
        </form>

        <button
          type="button"
          className="mt-4 text-sm text-brand-teal hover:underline"
          onClick={() => setForgotOpen((value) => !value)}
        >
          {forgotOpen ? "Hide password reset" : "Forgot password?"}
        </button>

        {forgotOpen && (
          <div className="mt-4 rounded-lg border border-brand-muted/20 p-4 space-y-3">
            <form onSubmit={handleForgotPasswordRequest} className="space-y-2">
              <label htmlFor="forgotEmail" className="block text-sm text-brand-muted">
                Reset Email
              </label>
              <input
                id="forgotEmail"
                type="email"
                required
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                className="w-full bg-brand-midnight border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-teal"
              />
              <button
                type="submit"
                className="w-full rounded-lg border border-brand-muted/30 py-2 text-sm text-brand-white hover:border-brand-teal/60"
              >
                Request Reset
              </button>
            </form>

            <form onSubmit={handleResetPassword} className="space-y-2">
              <label htmlFor="resetToken" className="block text-sm text-brand-muted">
                Reset Token
              </label>
              <input
                id="resetToken"
                required
                value={resetToken}
                onChange={(event) => setResetToken(event.target.value)}
                className="w-full bg-brand-midnight border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-teal"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full bg-brand-midnight border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-teal"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                className="w-full bg-brand-midnight border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-teal"
              />
              <button
                type="submit"
                className="w-full rounded-lg border border-brand-teal/50 py-2 text-sm text-brand-teal hover:bg-brand-teal/10"
              >
                Reset Password
              </button>
            </form>

            {forgotMessage ? (
              <p className="text-xs text-brand-teal">{forgotMessage}</p>
            ) : null}
            {forgotError ? (
              <p className="text-xs text-red-300">{forgotError}</p>
            ) : null}
          </div>
        )}

        <p className="mt-4 text-center text-brand-muted text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-teal hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
