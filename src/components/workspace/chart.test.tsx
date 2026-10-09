import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { ECharts } from "echarts";
import { Chart } from "./chart";
import { radarOption, trendOption } from "@/lib/charts/options";

const echarts = vi.hoisted(() => ({
  init: vi.fn(),
  setOption: vi.fn(),
  setTheme: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock("echarts", () => ({ init: echarts.init }));
const engineLoader = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("@/lib/charts/engine", () => ({ loadChartEngine: engineLoader.load }));
vi.mock("@/components/layout/locale-provider", async () => {
  const { translate } = await import("@/lib/i18n/locale");
  return {
    useLocale: () => ({
      locale: "en",
      t: (key: Parameters<typeof translate>[1]) => translate("en", key),
    }),
  };
});

let onResize: ResizeObserverCallback;
let onTheme: MutationCallback;
let onMotion: (() => void) | undefined;
let motion: {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};
let disconnectResize: ReturnType<typeof vi.fn>;
let disconnectTheme: ReturnType<typeof vi.fn>;
let actualEcharts: typeof import("echarts");

beforeAll(async () => {
  // Load the full engine as fixture setup; lifecycle assertions keep their normal test budget.
  actualEcharts = await vi.importActual<typeof import("echarts")>("echarts");
});

beforeEach(() => {
  vi.clearAllMocks();
  echarts.init.mockReturnValue(echarts);
  engineLoader.load.mockImplementation(() => import("echarts"));
  disconnectResize = vi.fn();
  disconnectTheme = vi.fn();
  motion = {
    matches: false,
    addEventListener: vi.fn((_event: string, callback: () => void) => {
      onMotion = callback;
    }),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => motion),
  );
  vi.stubGlobal(
    "getComputedStyle",
    vi.fn(() => ({
      fontFamily: "system-ui",
      getPropertyValue: (name: string) =>
        ({
          "--info": "#315fd3",
          "--success": "#187347",
          "--support": "#22756f",
          "--insight": "#7156ad",
          "--muted-foreground": "#5f6b7d",
        })[name] ?? "",
    })),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        onResize = callback;
      }
      observe = vi.fn();
      disconnect = disconnectResize;
    },
  );
  vi.stubGlobal(
    "MutationObserver",
    class {
      constructor(callback: MutationCallback) {
        onTheme = callback;
      }
      observe = vi.fn();
      disconnect = disconnectTheme;
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

async function loadChart() {
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

async function useRealEcharts() {
  const actual = actualEcharts;
  const canvas = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue({
      measureText: (text: string) => ({ width: text.length * 6 }),
    } as unknown as CanvasRenderingContext2D);
  let chart: ECharts | undefined;
  echarts.init.mockImplementation((_container, theme) => {
    chart = actual.init(null, theme, {
      renderer: "svg",
      ssr: true,
      width: 600,
      height: 320,
    });
    return chart;
  });
  return {
    current: () => {
      if (!chart) throw new Error("Chart has not initialized");
      return chart;
    },
    restore: () => canvas.mockRestore(),
  };
}

describe("ECharts lifecycle", () => {
  it("keeps actual line strokes, area fills and native legend colors aligned through reorder, removal and palette changes", async () => {
    const actual = await useRealEcharts();
    const a = { id: "a", name: "Account A", values: [3, 5] };
    const b = { id: "b", name: "Account B", values: [6, 4] };
    const option = (series: (typeof a)[]) =>
      trendOption(["Mon", "Tue"], series);
    const { rerender, unmount } = render(
      <Chart label="Ratings" palette="activity" option={option([a, b])} />,
    );
    try {
      await loadChart();
      rerender(
        <Chart label="Ratings" palette="activity" option={option([b, a])} />,
      );
      expect(actual.current().getOption()).toMatchObject({
        series: [
          { id: "a", lineStyle: { color: "#315fd3" } },
          {
            id: "b",
            lineStyle: { color: "#187347" },
            areaStyle: {
              color: {
                colorStops: [
                  { color: "rgba(24,115,71,0.22)" },
                  { color: "rgba(24,115,71,0.015)" },
                ],
              },
            },
          },
        ],
      });
      expect(
        screen
          .getByRole("button", { name: "Account B" })
          .style.getPropertyValue("--legend-color"),
      ).toBe("var(--success)");
      expect(actual.current().renderToSVGString()).toContain(
        'stroke="#187347"',
      );
      rerender(
        <Chart label="Ratings" palette="activity" option={option([b])} />,
      );
      onTheme([], {} as MutationObserver);
      expect(actual.current().getOption()).toMatchObject({
        series: [{ id: "b", lineStyle: { color: "#187347" } }],
      });
      rerender(
        <Chart label="Ratings" palette="core" option={option([b, a])} />,
      );
      expect(actual.current().getOption()).toMatchObject({
        series: [
          { id: "b", lineStyle: { color: "#7156ad" } },
          { id: "a", lineStyle: { color: "#315fd3" } },
        ],
      });
      expect(
        screen
          .getByRole("button", { name: "Account B" })
          .style.getPropertyValue("--legend-color"),
      ).toBe("var(--insight)");
    } finally {
      unmount();
      actual.restore();
    }
  });

  it("keeps hidden semantic metrics through translated names with actual ECharts", async () => {
    const actual = await useRealEcharts();
    const option = (locale: "en" | "zh") =>
      trendOption(
        ["Mon"],
        [
          {
            id: "submissions",
            name: locale === "en" ? "Submissions" : "提交次数",
            values: [4],
          },
          {
            id: "solved",
            name: locale === "en" ? "Solved" : "通过题数",
            values: [2],
          },
        ],
      );
    const { rerender, unmount } = render(
      <Chart label="Training" palette="activity" option={option("en")} />,
    );
    try {
      await loadChart();
      fireEvent.click(screen.getByRole("button", { name: "Solved" }));
      rerender(<Chart label="训练" palette="activity" option={option("zh")} />);
      onTheme([], {} as MutationObserver);
      expect(screen.getByRole("button", { name: "通过题数" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(actual.current().getOption()).toMatchObject({
        legend: [{ selected: { 提交次数: true, 通过题数: false } }],
        series: [
          { id: "submissions", data: [4] },
          { id: "solved", data: [2] },
        ],
      });
    } finally {
      unmount();
      actual.restore();
    }
  });

  it("handles a failed lazy engine import and retries without an unhandled rejection or leaked instance", async () => {
    engineLoader.load.mockRejectedValueOnce(
      new Error("Synthetic chunk failure"),
    );
    const { unmount } = render(
      <Chart
        label="Training"
        option={trendOption(["Mon"], [{ name: "Solved", values: [2] }])}
      />,
    );
    await loadChart();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The chart is unavailable",
    );
    expect(echarts.init).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await loadChart();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("img", { name: "Training" })).toHaveAttribute(
      "aria-busy",
      "false",
    );
    expect(echarts.init).toHaveBeenCalledOnce();
    unmount();
    expect(echarts.dispose).toHaveBeenCalledOnce();
  });

  it("disposes a chart whose first frame fails before offering retry", async () => {
    echarts.setOption.mockImplementationOnce(() => {
      throw new Error("Synthetic first-frame failure");
    });
    const { unmount } = render(
      <Chart label="Training" option={{ series: [] }} />,
    );
    await loadChart();
    expect(screen.getByRole("alert")).toBeVisible();
    expect(echarts.dispose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await loadChart();
    expect(echarts.init).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
    unmount();
    expect(echarts.dispose).toHaveBeenCalledTimes(2);
  });

  it("keeps hidden accounts attached to their name when unnamed-id series are reordered", async () => {
    const accountA = { type: "line" as const, name: "account-a", data: [1200] };
    const accountB = { type: "line" as const, name: "account-b", data: [1600] };
    const { rerender } = render(
      <Chart
        label="Ratings"
        option={{ legend: {}, series: [accountA, accountB] }}
      />,
    );
    await loadChart();
    fireEvent.click(screen.getByRole("button", { name: "account-a" }));
    rerender(
      <Chart
        label="Ratings"
        option={{ legend: {}, series: [accountB, accountA] }}
      />,
    );
    expect(screen.getByRole("button", { name: "account-a" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "account-b" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(echarts.setOption).toHaveBeenLastCalledWith(
      expect.objectContaining({
        legend: expect.objectContaining({
          selected: { "account-a": false, "account-b": true },
        }),
      }),
      expect.any(Object),
    );
  });

  it("exposes native pressed-state legend buttons and preserves selected series through data, theme and motion changes", async () => {
    const actual = await useRealEcharts();
    const option = (value: number) =>
      trendOption(
        ["Monday"],
        [
          { name: "Submissions", values: [value] },
          { name: "Solved", values: [2] },
        ],
      );
    const { rerender, unmount } = render(
      <Chart label="Training" palette="activity" option={option(4)} />,
    );
    try {
      await loadChart();
      const solved = screen.getByRole("button", {
        name: "Solved",
        pressed: true,
      });
      fireEvent.click(solved);
      expect(solved).toHaveAttribute("aria-pressed", "false");
      expect(actual.current().getOption()).toMatchObject({
        legend: [
          { show: false, selected: { Submissions: true, Solved: false } },
        ],
      });
      rerender(
        <Chart label="Training" palette="activity" option={option(9)} />,
      );
      onTheme([], {} as MutationObserver);
      motion.matches = true;
      onMotion?.();
      expect(actual.current().getOption()).toMatchObject({
        animation: false,
        legend: [{ selected: { Submissions: true, Solved: false } }],
        series: [{ data: [9] }, { data: [2] }],
      });
      fireEvent.click(solved);
      expect(solved).toHaveAttribute("aria-pressed", "true");
      expect(actual.current().getOption()).toMatchObject({
        legend: [{ selected: { Solved: true } }],
      });
      expect(echarts.init).toHaveBeenCalledOnce();
    } finally {
      unmount();
      actual.restore();
    }
  });

  it("updates data, accessible labels and palette on the same SVG instance", async () => {
    const { rerender, unmount } = render(
      <Chart
        label="Initial data"
        option={trendOption(["Monday"], [{ name: "Solved", values: [1] }])}
      />,
    );
    await loadChart();
    expect(echarts.init).toHaveBeenCalledOnce();
    expect(echarts.init).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.any(Object),
      { renderer: "svg" },
    );
    rerender(
      <Chart
        label="Updated data"
        palette="teamActivity"
        option={trendOption(["Tuesday"], [{ name: "Solved", values: [3] }])}
      />,
    );
    expect(screen.getByRole("img", { name: "Updated data" })).toHaveAttribute(
      "data-palette",
      "teamActivity",
    );
    expect(echarts.init).toHaveBeenCalledOnce();
    expect(echarts.dispose).not.toHaveBeenCalled();
    expect(echarts.setOption).toHaveBeenLastCalledWith(
      expect.objectContaining({
        aria: { enabled: true, label: { description: "Updated data" } },
      }),
      { notMerge: true },
    );
    expect(echarts.setTheme).toHaveBeenLastCalledWith(
      expect.objectContaining({ color: ["#315fd3", "#187347", "#22756f"] }),
    );
    unmount();
    expect(echarts.dispose).toHaveBeenCalledOnce();
    expect(disconnectResize).toHaveBeenCalledOnce();
    expect(disconnectTheme).toHaveBeenCalledOnce();
    expect(motion.removeEventListener).toHaveBeenCalledWith("change", onMotion);
  });

  it("resizes, changes motion and changes themes without rebuilding", async () => {
    render(
      <Chart
        label="Ability"
        palette="ability"
        option={{ series: [] }}
        size="ability"
      />,
    );
    await loadChart();
    onResize([], {} as ResizeObserver);
    onTheme([], {} as MutationObserver);
    motion.matches = true;
    onMotion?.();
    expect(echarts.resize).toHaveBeenCalledOnce();
    expect(echarts.setTheme).toHaveBeenCalledOnce();
    expect(echarts.setOption).toHaveBeenLastCalledWith({ animation: false });
    expect(echarts.init).toHaveBeenCalledOnce();
    expect(echarts.dispose).not.toHaveBeenCalled();
    expect(screen.getByRole("img")).toHaveAttribute(
      "data-chart-size",
      "ability",
    );
  });

  it("clears responsive radar rules when the same instance changes to a Cartesian chart", async () => {
    const { rerender } = render(
      <Chart
        label="Ability"
        option={radarOption([{ name: "Implementation", score: 24 }], "Ability")}
      />,
    );
    await loadChart();
    rerender(
      <Chart
        label="Activity"
        option={trendOption(["Monday"], [{ name: "Solved", values: [1] }])}
      />,
    );
    expect(echarts.setOption).toHaveBeenLastCalledWith(
      expect.objectContaining({
        series: [expect.objectContaining({ type: "line" })],
      }),
      { notMerge: true },
    );
    expect(echarts.init).toHaveBeenCalledOnce();
    expect(echarts.dispose).not.toHaveBeenCalled();
  });

  it("does not initialize a detached element when the lazy import settles after unmount", async () => {
    const { unmount } = render(
      <Chart label="Canceled" option={{ series: [] }} />,
    );
    unmount();
    await loadChart();
    expect(echarts.init).not.toHaveBeenCalled();
    expect(echarts.dispose).not.toHaveBeenCalled();
  });

  it("preserves refreshed data, accessible labels and current reduced motion through actual ECharts theme changes", async () => {
    const actual = await useRealEcharts();
    const { rerender, unmount } = render(
      <Chart
        label="Initial score"
        option={trendOption(
          ["Monday"],
          [{ name: "Ability", values: [1] }],
          true,
        )}
      />,
    );
    try {
      await loadChart();
      const chart = actual.current();
      motion.matches = true;
      onMotion?.();
      const updated = trendOption(
        ["Tuesday"],
        [{ name: "Solved", values: [3] }],
      );
      rerender(<Chart label="Updated activity" option={updated} />);
      onTheme([], {} as MutationObserver);
      expect(chart.getOption()).toMatchObject({
        animation: false,
        xAxis: [{ data: ["Tuesday"] }],
        yAxis: [{ minInterval: 1 }],
        series: [{ name: "Solved", data: [3] }],
        aria: { label: { description: "Updated activity" } },
      });
      expect(chart.getOption()).not.toMatchObject({ yAxis: [{ max: 100 }] });

      rerender(
        <Chart
          label="Updated activity"
          palette="teamActivity"
          option={updated}
        />,
      );
      expect(chart.getOption()).toMatchObject({
        animation: false,
        color: ["#315fd3", "#187347", "#22756f"],
        xAxis: [{ data: ["Tuesday"] }],
        series: [{ data: [3] }],
        aria: { label: { description: "Updated activity" } },
      });
      expect(echarts.init).toHaveBeenCalledOnce();
      expect(chart.isDisposed()).toBeFalsy();
    } finally {
      unmount();
      actual.restore();
    }
  });

  it("does not resurrect old radar media after a chart-type change followed by an actual ECharts theme change", async () => {
    const actual = await useRealEcharts();
    const { rerender, unmount } = render(
      <Chart
        label="Initial ability"
        option={radarOption(
          [
            { name: "Implementation", score: 24 },
            { name: "Algorithms", score: 43 },
            { name: "Graphs", score: 62 },
          ],
          "Ability",
        )}
      />,
    );
    try {
      await loadChart();
      const chart = actual.current();
      rerender(
        <Chart
          label="Current activity"
          option={trendOption(["Tuesday"], [{ name: "Solved", values: [7] }])}
        />,
      );
      onTheme([], {} as MutationObserver);
      chart.resize({ width: 320 });
      expect(chart.getOption().radar ?? []).toEqual([]);
      expect(chart.getOption()).toMatchObject({
        xAxis: [{ data: ["Tuesday"] }],
        series: [{ type: "line", data: [7] }],
      });
      expect(echarts.init).toHaveBeenCalledOnce();
    } finally {
      unmount();
      actual.restore();
    }
  });

  it("keeps actual radar data and SVG marks through repeated locale updates and responsive resizing", async () => {
    const actual = await useRealEcharts();
    const labels = {
      zh: ["实现", "算法", "数据结构", "动态规划", "图论", "数学"],
      en: [
        "Implementation",
        "Algorithms",
        "Data structures",
        "Dynamic programming",
        "Graphs",
        "Math",
      ],
    };
    const scores = [20, 30, 40, 50, 60, 70];
    const option = (locale: keyof typeof labels, values = scores) =>
      radarOption(
        labels[locale].map((name, index) => ({ name, score: values[index] })),
        locale === "zh" ? "能力画像" : "Ability profile",
      );
    motion.matches = true;
    const { rerender, unmount } = render(
      <Chart label="能力画像" palette="ability" option={option("zh")} />,
    );
    try {
      await loadChart();
      const chart = actual.current();
      for (const [index, update] of [
        { width: 318, locale: "en", radius: "48%" },
        { width: 760, locale: "zh", radius: "58%" },
        { width: 600, locale: "en", radius: "52%" },
        { width: 318, locale: "zh", radius: "48%" },
      ].entries()) {
        const locale = update.locale as keyof typeof labels;
        const values = scores.map((score) => score + index + 1);
        chart.resize({ width: update.width });
        rerender(
          <Chart
            label={locale === "zh" ? "能力画像" : "Ability profile"}
            palette="ability"
            option={option(locale, values)}
          />,
        );
        expect(chart.getOption()).toMatchObject({
          animation: false,
          radar: [
            {
              radius: update.radius,
              indicator: labels[locale].map((name) => ({ name, max: 100 })),
            },
          ],
          series: [{ type: "radar", data: [{ value: values }] }],
        });
        const svg = chart.renderToSVGString();
        expect(svg.match(/<path\b/g)?.length ?? 0).toBeGreaterThan(6);
        expect(svg.match(/<text\b/g)?.length ?? 0).toBeGreaterThanOrEqual(6);
        expect(svg).toContain(labels[locale][5]);

        onTheme([], {} as MutationObserver);
        expect(chart.getOption()).toMatchObject({
          animation: false,
          radar: [{ radius: update.radius }],
          series: [{ type: "radar", data: [{ value: values }] }],
        });
      }
      expect(echarts.init).toHaveBeenCalledOnce();
      expect(chart.isDisposed()).toBeFalsy();
    } finally {
      unmount();
      actual.restore();
    }
  });
});
