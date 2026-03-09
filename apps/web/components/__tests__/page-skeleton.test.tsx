import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PageSkeleton } from "../page-skeleton";

describe("PageSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<PageSkeleton />);
    expect(container).toBeTruthy();
  });

  it("contains animate-pulse class", () => {
    const { container } = render(<PageSkeleton />);
    const pulseElement = container.querySelector(".animate-pulse");
    expect(pulseElement).toBeInTheDocument();
  });
});
