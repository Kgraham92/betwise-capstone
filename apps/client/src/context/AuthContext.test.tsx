import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

const logoutUserMock = vi.fn();

vi.mock("@/lib/api", () => ({
  logoutUser: (...args: unknown[]) => logoutUserMock(...args),
}));

function TestConsumer() {
  const { user, token, login, logout, isLoading } = useAuth();
  return (
    <div>
      <div data-testid="is-loading">{String(isLoading)}</div>
      <div data-testid="token">{token ?? "none"}</div>
      <div data-testid="user">{user?.email ?? "none"}</div>
      <button
        type="button"
        onClick={() => login("token-123", { id: "u1", email: "user@test.com" })}
      >
        Login
      </button>
      <button type="button" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    logoutUserMock.mockResolvedValue({ message: "Logout successful" });
    const store = new Map<string, string>();
    vi.mocked(window.localStorage.getItem).mockImplementation((k: string) => {
      return store.has(k) ? store.get(k)! : null;
    });
    vi.mocked(window.localStorage.setItem).mockImplementation(
      (k: string, v: string) => {
        store.set(k, v);
      },
    );
    vi.mocked(window.localStorage.removeItem).mockImplementation((k: string) => {
      store.delete(k);
    });
  });

  it("hydrates from storage and updates on login/logout", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(screen.getByTestId("user")).toHaveTextContent("none");

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent("token-123");
      expect(screen.getByTestId("user")).toHaveTextContent("user@test.com");
    });

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent("none");
      expect(screen.getByTestId("user")).toHaveTextContent("none");
    });
  });
});
