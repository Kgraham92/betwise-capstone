import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "./page";

const pushMock = vi.fn();
const loginMock = vi.fn();
const registerUserMock = vi.fn();

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
    registerUser: (...args: unknown[]) => registerUserMock(...args),
  };
});

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("submits credentials, logs in, and redirects on success", async () => {
    registerUserMock.mockResolvedValue({
      token: "token-123",
      user: { id: "u1", email: "user@test.com" },
    });

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/), {
      target: { value: "testpassword123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "testpassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(registerUserMock).toHaveBeenCalledWith({
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

  it("shows validation error and avoids API call when passwords do not match", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/), {
      target: { value: "testpassword123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "different-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
    expect(registerUserMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows API error message when registration fails", async () => {
    registerUserMock.mockRejectedValue(new Error("Email already in use"));

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/), {
      target: { value: "testpassword123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "testpassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });
    expect(loginMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
