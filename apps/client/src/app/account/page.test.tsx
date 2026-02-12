import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccountPage from "./page";

const useAuthMock = vi.fn();
const changePasswordMock = vi.fn();
const deleteAccountMock = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    changePassword: (...args: unknown[]) => changePasswordMock(...args),
    deleteAccount: (...args: unknown[]) => deleteAccountMock(...args),
  };
});

describe("AccountPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "user@test.com" },
      token: "token-123",
      isLoading: false,
      logout: vi.fn(async () => undefined),
    });
  });

  it("shows login prompt when not authenticated", () => {
    useAuthMock.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      logout: vi.fn(async () => undefined),
    });

    render(<AccountPage />);

    expect(screen.getByText("Account Locked")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log In" })).toBeInTheDocument();
  });

  it("submits change password form", async () => {
    changePasswordMock.mockResolvedValue({ message: "Password updated" });

    render(<AccountPage />);

    fireEvent.change(screen.getByPlaceholderText("Current password"), {
      target: { value: "currentPass123" },
    });
    fireEvent.change(screen.getByPlaceholderText("New password"), {
      target: { value: "newPass1234" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "newPass1234" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    await waitFor(() => {
      expect(changePasswordMock).toHaveBeenCalledWith(
        {
          currentPassword: "currentPass123",
          newPassword: "newPass1234",
        },
        "token-123",
      );
      expect(screen.getByText("Password updated")).toBeInTheDocument();
    });
  });
});
