import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import Home from "@/app/page";
import { LocaleProvider } from "@/components/layout/locale-provider";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

test("renders the codeStartrack placeholder", () => {
  render(
    <LocaleProvider initialLocale="zh-CN">
      <Home />
    </LocaleProvider>,
  );

  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 1, name: "码练星轨" }),
  ).toBeVisible();
  expect(screen.getByText("只读 Demo")).toBeVisible();
});
