import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { AboutPage } from "./about-page";

vi.mock("next/navigation", () => ({ usePathname: () => "/about" }));

afterEach(() => vi.unstubAllGlobals());

test.each([
  {
    locale: "zh-CN",
    available: "当前支持",
    planned: "未来方向",
    analysis: "学习画像、混合推荐与静态分析工具证据",
    synthesis: "AI 综合分析 · 尚未开放",
    agent: "渐进式 Agent 辅助与更多数据源",
  },
  {
    locale: "en",
    available: "Available today",
    planned: "Future direction",
    analysis:
      "Learning profiles, mixed recommendations and static analysis tool evidence",
    synthesis: "AI synthesis · not yet open",
    agent: "Progressive Agent assistance and more data sources",
  },
] as const)(
  "$locale separates supported analysis evidence from future AI synthesis",
  ({ locale, available, planned, analysis, synthesis, agent }) => {
    document.cookie = `codestartrack_locale=${locale}; Path=/`;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    render(
      <LocaleProvider initialLocale={locale}>
        <AboutPage />
      </LocaleProvider>,
    );

    const analysisItem = screen.getByText(analysis).closest("li");
    expect(analysisItem).not.toBeNull();
    expect(within(analysisItem!).getByText(available)).toBeInTheDocument();
    expect(within(analysisItem!).queryByText(planned)).not.toBeInTheDocument();

    for (const future of [synthesis, agent]) {
      const item = screen.getByText(future).closest("li");
      expect(item).not.toBeNull();
      expect(within(item!).getByText(planned)).toBeInTheDocument();
      expect(within(item!).queryByText(available)).not.toBeInTheDocument();
    }
  },
);
