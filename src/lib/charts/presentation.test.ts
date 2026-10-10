import { describe, expect, it } from "vitest";
import { distributionOption, radarOption, trendOption } from "./options";
import {
  chartColorSlots,
  chartHeight,
  chartPresentation,
  chartSeries,
} from "./presentation";
import { chartTheme } from "./theme";

function theme() {
  const element = document.createElement("div");
  element.style.setProperty("--info", "#315fd3");
  element.style.setProperty("--success", "#187347");
  return chartTheme(element.style, "activity");
}

describe("chart presentation and truthful geometry", () => {
  it("retains palette slots through reorder/removal and gives each chart family its own palette", () => {
    const a = { id: "a", name: "Account A", values: [3] };
    const b = { id: "b", name: "Account B", values: [6] };
    const initial = chartColorSlots(trendOption(["Mon"], [a, b]), {});
    expect(chartColorSlots(trendOption(["Mon"], [b, a]), initial)).toBe(
      initial,
    );
    expect(chartColorSlots(trendOption(["Mon"], [b]), initial)).toBe(initial);
    const radar = chartColorSlots(
      radarOption([{ name: "Graphs", score: 10 }], "Ability"),
      initial,
    );
    expect(radar).toMatchObject({
      "line:a": 0,
      "line:b": 1,
      "radar:ability": 0,
    });
  });
  it("preserves count data, order and zero baselines while distinguishing line series by shape and dash", () => {
    const values = [
      [0, 9, 3],
      [0, 4, 2],
      [0, 1, 0],
    ];
    const option = trendOption(
      ["Mon", "Tue", "Wed"],
      [
        { name: "Submissions", values: values[0] },
        { name: "Solved", values: values[1] },
        { name: "Pending", values: values[2] },
      ],
    );
    const decorated = chartPresentation(option, theme());
    expect(
      chartSeries(decorated).map((series) => "data" in series && series.data),
    ).toEqual(values);
    expect(decorated.yAxis).toMatchObject({ min: 0, minInterval: 1 });
    expect(chartSeries(decorated)).toMatchObject([
      {
        smooth: false,
        symbol: "circle",
        areaStyle: { color: { type: "linear" } },
      },
      { smooth: false, symbol: "diamond" },
      { smooth: false, symbol: "rect", lineStyle: { type: "dashed" } },
    ]);
    expect(chartSeries(option)[0]).not.toHaveProperty("areaStyle.color");
  });

  it("keeps each category visible in dense horizontal distributions without sorting supplied values", () => {
    const labels = Array.from(
      { length: 10 },
      (_, index) => `Category ${index}`,
    );
    const attempted = [500, 20, 0, 2, 36, 5000, 7, 0, 42, 13];
    const solved = [400, 0, 0, 1, 32, 4500, 5, 0, 17, 9];
    const option = distributionOption(
      labels,
      attempted,
      solved,
      ["Attempted", "Solved"],
      true,
    );
    const decorated = chartPresentation(option, theme());
    expect(chartHeight(option)).toBeGreaterThan(400);
    expect(decorated.yAxis).toMatchObject({
      data: labels,
      inverse: true,
      axisLabel: { interval: 0 },
    });
    expect(chartSeries(decorated)).toMatchObject([
      { data: attempted },
      { data: solved, label: { show: true, position: "right" } },
    ]);
    expect(
      chartHeight(
        distributionOption(labels, attempted, solved, ["Attempted", "Solved"]),
      ),
    ).toBeUndefined();
  });

  it("preserves real zeros and 0–100 score domains, displaying radar values alongside names", () => {
    const dimensions = [
      { name: "Implementation", score: 0 },
      { name: "Graphs", score: 100 },
    ];
    const decorated = chartPresentation(
      radarOption(dimensions, "Ability"),
      theme(),
    );
    expect(decorated.radar).toMatchObject({
      indicator: [
        { min: 0, max: 100 },
        { min: 0, max: 100 },
      ],
    });
    expect(chartSeries(decorated)).toMatchObject([
      { data: [{ value: [0, 100] }], areaStyle: { color: { type: "linear" } } },
    ]);
    const radar = Array.isArray(decorated.radar)
      ? decorated.radar[0]
      : decorated.radar;
    expect(typeof radar?.axisName?.formatter).toBe("function");
    if (typeof radar?.axisName?.formatter === "function") {
      expect(
        radar.axisName.formatter("Implementation", { name: "Implementation" }),
      ).toContain("0 / 100");
    }
    expect(chartSeries(radarOption([], "Missing"))).toEqual([]);
  });
});
