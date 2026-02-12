import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./page";

const pushMock = vi.fn();
const loginMock = vi.fn();
const loginUserMock = vi.fn();
const requestPasswordResetMock = vi.fn();
const resetForgottenPasswordMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    loginUser: (...args: unknown[]) => loginUserMock(...args),
    requestPasswordReset: (...args: unknown[]) => requestPasswordResetMock(...args),
    resetForgottenPassword: (...args: unknown[]) =>
      resetForgottenPasswordMock(...args),
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("submits credentials, logs in, and redirects on success", async () => {
    loginUserMock.mockResolvedValue({
      token: "token-123",
      user: { id: "u1", email: "user@test.com" },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "testpassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(loginUserMock).toHaveBeenCalledWith({
        email: "user@test.com",
        password: "testpassword123",
      });
      expect(loginMock).toHaveBeenCalledWith("token-123", {
        id: "u1",
        email: "user@test.com",
      });
      expect(pushMock).toHaveBeenCalledWith("/games");
    });
  });

  it("shows API error message when login fails", async () => {
    loginUserMock.mockRejectedValue(new Error("Invalid email or password"));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("requests and submits forgot-password reset", async () => {
    requestPasswordResetMock.mockResolvedValue({
      message: "Reset instructions sent",
      resetToken: "abcdef0123456789",
    });
    resetForgottenPasswordMock.mockResolvedValue({
      message: "Password reset successful",
    });

    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));

    fireEvent.change(screen.getByLabelText("Reset Email"), {
      target: { value: "user@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request Reset" }));

    await waitFor(() => {
      expect(requestPasswordResetMock).toHaveBeenCalledWith("user@test.com");
    });

    fireEvent.change(screen.getByLabelText("Reset Token"), {
      target: { value: "abcdef0123456789" },
    });
    fireEvent.change(screen.getByPlaceholderText("New password"), {
      target: { value: "newpassword123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "newpassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));

    await waitFor(() => {
      expect(resetForgottenPasswordMock).toHaveBeenCalledWith({
        token: "abcdef0123456789",
        newPassword: "newpassword123",
      });
      expect(screen.getByText("Password reset successful")).toBeInTheDocument();
    });
  });
});
