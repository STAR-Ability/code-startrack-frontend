import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import Home from "@/app/page";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { previewProblems } from "@/lib/demo/preview";
import { translate } from "@/lib/i18n/locale";
import { productLinks } from "@/lib/ui/product-navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
afterEach(() => vi.unstubAllGlobals());

beforeEach(() => {
  document.cookie = "codestartrack_locale=zh-CN; Path=/";
  vi.stubGlobal("matchMedia", (media: string) => ({
    media,
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

function renderHome() {
  render(
    <LocaleProvider initialLocale="zh-CN">
      <Home />
    </LocaleProvider>,
  );
}

test("separates public local Demo from authenticated learner routes", () => {
  renderHome();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "你的每一道代码，都留下成长轨迹。",
  );
  expect(screen.getByRole("link", { name: "查看只读 Demo" })).toHaveAttribute(
    "href",
    "/demo",
  );
  expect(screen.getByRole("link", { name: "查看个人画像" })).toHaveAttribute(
    "href",
    "/product/profile",
  );
  expect(
    screen.getAllByText("交互示意 · 非真实学习者数据").length,
  ).toBeGreaterThan(0);
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

test("presents the complete five-step process and four product destinations", () => {
  renderHome();
  const process = within(
    screen.getByRole("region", {
      name: translate("zh-CN", "landing.flowTitle"),
    }),
  ).getByRole("list");
  expect(process.tagName).toBe("OL");
  const steps = within(process).getAllByRole("listitem");
  expect(steps).toHaveLength(5);
  for (const [index, key] of (
    ["data", "unify", "profile", "recommend", "practice"] as const
  ).entries()) {
    const step = within(steps[index]);
    expect(
      step.getByRole("heading", { name: translate("zh-CN", `flow.${key}`) }),
    ).toBeInTheDocument();
    expect(
      step.getByText(translate("zh-CN", `flow.${key}Note`)),
    ).toBeInTheDocument();
  }

  const capabilities = within(
    screen.getByRole("region", {
      name: translate("zh-CN", "landing.featuresTitle"),
    }),
  );
  expect(capabilities.getAllByRole("article")).toHaveLength(4);
  for (const [href, key] of productLinks) {
    expect(
      capabilities.getByRole("link", {
        name: `${translate("zh-CN", "showcase.explore")} · ${translate("zh-CN", `showcase.${key}.label`)}`,
      }),
    ).toHaveAttribute("href", href);
  }
  expect(screen.getByRole("contentinfo")).not.toHaveTextContent("V0.11");
});

test("keeps every local journey example and its original detail control readable", () => {
  renderHome();
  const journey = within(
    screen.getByRole("region", {
      name: translate("zh-CN", "landing.journeyTitle"),
    }),
  );
  const list = journey.getByRole("list");
  expect(list.tagName).toBe("OL");
  const rows = within(list).getAllByRole("listitem");
  expect(rows).toHaveLength(3);
  for (const [index, problem] of previewProblems.entries()) {
    const row = within(rows[index]);
    expect(
      row.getByRole("heading", { name: problem.title }),
    ).toBeInTheDocument();
    expect(rows[index]).toHaveTextContent(
      `${problem.id} · Codeforces · ${problem.difficulty}`,
    );
    expect(
      row.getByText(
        translate("zh-CN", "landing.day", { day: String(problem.day) }),
      ),
    ).toBeInTheDocument();
    expect(row.getByRole("button", { name: problem.tags[0] })).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );
    expect(row.getByText(problem.tags[1])).toBeInTheDocument();
  }
  expect(
    journey.getByRole("link", { name: translate("zh-CN", "nav.start") }),
  ).toHaveAttribute("href", "/practice");
});
