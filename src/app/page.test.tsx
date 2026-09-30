import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import Home from "@/app/page";
import { LocaleProvider } from "@/components/layout/locale-provider";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

test("separates illustrative marketing from the read-only learner routes", () => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  render(
    <LocaleProvider initialLocale="zh-CN">
      <Home />
    </LocaleProvider>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "你的每一道代码，都留下成长轨迹。",
  );
  expect(screen.getByRole("link", { name: "查看只读 Demo" })).toHaveAttribute(
    "href",
    "/practice",
  );
  expect(screen.getByRole("link", { name: "查看个人画像" })).toHaveAttribute(
    "href",
    "/profile",
  );
  expect(
    screen.getAllByText("交互示意 · 非真实学习者数据").length,
  ).toBeGreaterThan(0);
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  vi.unstubAllGlobals();
});
