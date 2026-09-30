import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import Home from "@/app/page";
import { LocaleProvider } from "@/components/layout/locale-provider";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

test("offers read-only Demo navigation with honest account context", () => {
  render(
    <LocaleProvider initialLocale="zh-CN">
      <Home />
    </LocaleProvider>,
  );

  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 1, name: "训练画像与题目推荐" }),
  ).toBeVisible();
  expect(screen.getByText("只读 Demo")).toBeVisible();
  expect(screen.getByRole("link", { name: "查看只读 Demo" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
  expect(screen.getByText("已连接账号详情暂不可用。")).toBeVisible();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
