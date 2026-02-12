import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SentimentBar } from "./SentimentBar";

describe("SentimentBar", () => {
  const defaultProps = {
    leftLabel: "Home",
    rightLabel: "Away",
    leftPct: 60,
    rightPct: 40,
  };

  it("renders both labels", () => {
    render(<SentimentBar {...defaultProps} />);
    expect(screen.getByText(/Home/)).toBeInTheDocument();
    expect(screen.getByText(/Away/)).toBeInTheDocument();
  });

  it("displays percentages correctly", () => {
    render(<SentimentBar {...defaultProps} />);
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("renders progress bars with correct accessibility attributes", () => {
    render(<SentimentBar {...defaultProps} />);
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars).toHaveLength(2);

    expect(progressBars[0]).toHaveAttribute("aria-valuenow", "60");
    expect(progressBars[1]).toHaveAttribute("aria-valuenow", "40");
  });

  it("applies correct width styles", () => {
    render(<SentimentBar {...defaultProps} />);
    const progressBars = screen.getAllByRole("progressbar");

    expect(progressBars[0]).toHaveStyle({ width: "60%" });
    expect(progressBars[1]).toHaveStyle({ width: "40%" });
  });

  it("uses default colors when not specified", () => {
    render(<SentimentBar {...defaultProps} />);
    const progressBars = screen.getAllByRole("progressbar");

    expect(progressBars[0].className).toContain("bg-brand-teal");
    expect(progressBars[1].className).toContain("bg-brand-blue");
  });

  it("accepts custom colors", () => {
    render(
      <SentimentBar
        {...defaultProps}
        leftColor="bg-red-500"
        rightColor="bg-green-500"
      />
    );
    const progressBars = screen.getAllByRole("progressbar");

    expect(progressBars[0].className).toContain("bg-red-500");
    expect(progressBars[1].className).toContain("bg-green-500");
  });

  it("has proper aria-labels for accessibility", () => {
    render(<SentimentBar {...defaultProps} />);
    const progressBars = screen.getAllByRole("progressbar");

    expect(progressBars[0]).toHaveAttribute("aria-label", "Home: 60%");
    expect(progressBars[1]).toHaveAttribute("aria-label", "Away: 40%");
  });
});
