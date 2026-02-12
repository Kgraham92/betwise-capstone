"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { changePassword, deleteAccount } from "@/lib/api";

type Status = {
  type: "success" | "error";
  message: string;
} | null;

export default function AccountPage() {
  const { user, token, isLoading, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "New passwords do not match" });
      return;
    }

    setSavingPassword(true);
    setStatus(null);

    try {
      const response = await changePassword({ currentPassword, newPassword }, token);
      setStatus({ type: "success", message: response.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to change password",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (!token) return;

    const confirmed = window.confirm(
      "Delete your account? This action cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingAccount(true);
    setStatus(null);

    try {
      await deleteAccount(token);
      await logout();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete account",
      });
      setDeletingAccount(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-midnight p-8 text-center text-brand-white">
        Loading account...
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-brand-midnight flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-brand-muted/10 bg-brand-surface p-8 text-center">
          <h1 className="text-2xl font-bold text-brand-white mb-3">Account Locked</h1>
          <p className="text-brand-muted mb-6">
            Log in to access account settings.
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
      <div className="container mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-white">Account</h1>
          <p className="text-brand-muted">Manage your security settings.</p>
        </div>

        <div className="rounded-xl border border-brand-muted/10 bg-brand-surface p-6">
          <h2 className="text-xl font-semibold text-brand-white mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              className="w-full rounded-lg border border-brand-muted/20 bg-brand-midnight px-3 py-2 text-brand-white"
              required
              minLength={8}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              className="w-full rounded-lg border border-brand-muted/20 bg-brand-midnight px-3 py-2 text-brand-white"
              required
              minLength={8}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-brand-muted/20 bg-brand-midnight px-3 py-2 text-brand-white"
              required
              minLength={8}
            />
            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-lg bg-brand-teal px-4 py-2 font-semibold text-brand-midnight disabled:opacity-60"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-6">
          <h2 className="text-xl font-semibold text-red-300 mb-2">Danger Zone</h2>
          <p className="text-sm text-red-200/80 mb-4">
            Permanently delete your account and all saved favorites.
          </p>
          <button
            type="button"
            onClick={() => void handleDeleteAccount()}
            disabled={deletingAccount}
            className="rounded-lg border border-red-500/60 px-4 py-2 font-semibold text-red-200 disabled:opacity-60"
          >
            {deletingAccount ? "Deleting..." : "Delete Account"}
          </button>
        </div>

        {status ? (
          <div
            className={`rounded-lg px-4 py-2 text-sm ${
              status.type === "success"
                ? "border border-brand-teal/30 bg-brand-teal/10 text-brand-teal"
                : "border border-red-500/40 bg-red-500/10 text-red-300"
            }`}
          >
            {status.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
