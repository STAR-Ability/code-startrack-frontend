import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => {
  vi.clearAllMocks();
  echarts.init.mockReturnValue(echarts);
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
  const actual = await vi.importActual<typeof import("echarts")>("echarts");
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
