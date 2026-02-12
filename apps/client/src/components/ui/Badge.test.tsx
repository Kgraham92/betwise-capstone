import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders children content", () => {
    render(<Badge>Test Label</Badge>);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("applies default variant styles", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge.className).toContain("bg-brand-muted/20");
  });

  it("applies success variant styles", () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText("Success");
    expect(badge.className).toContain("bg-brand-green/20");
  });

  it("applies warning variant styles", () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText("Warning");
    expect(badge.className).toContain("bg-yellow-500/20");
  });

  it("applies info variant styles", () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText("Info");
    expect(badge.className).toContain("bg-brand-blue/20");
  });

  it("accepts additional className", () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText("Custom");
    expect(badge.className).toContain("custom-class");
  });
});
