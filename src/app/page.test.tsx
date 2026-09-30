import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("renders the codeStartrack placeholder", () => {
  render(<Home />);

  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 1, name: "码练星轨" }),
  ).toBeVisible();
  expect(screen.getByText("codeStartrack")).toBeVisible();
});
