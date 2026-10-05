import { describe, expect, it, vi } from "vitest";
import { init, type RadarComponentOption } from "echarts";
import { distributionOption, radarOption, trendOption } from "./options";

describe("chart data presentation", () => {
  it("preserves exact trend samples, gaps and score bounds without smoothing them", () => {
    const labels = ["2026-10-01", "2026-10-02", "2026-10-03"];
    const values = [0, 43.25, 51.5];
    const source = structuredClone({ labels, values });
    const option = trendOption(labels, [{ name: "Ability", values }], true);
    expect(option.series).toMatchObject([{ data: values, type: "line" }]);
    expect(option.yAxis).toMatchObject({ min: 0, max: 100 });
    expect(option.series).not.toMatchObject([{ smooth: true }]);
    expect({ labels, values }).toEqual(source);
  });

  it("keeps attempted and solved counts separate in both distribution orientations", () => {
    for (const horizontal of [true, false]) {
      const option = distributionOption(
        ["dynamic programming", "graphs"],
        [12, 8],
        [7, 0],
        ["Attempted", "Solved"],
        horizontal,
      );
      expect(option.series).toMatchObject([
        { type: "bar", name: "Attempted", data: [12, 8] },
        { type: "bar", name: "Solved", data: [7, 0] },
      ]);
      expect(horizontal ? option.xAxis : option.yAxis).toMatchObject({
        min: 0,
        minInterval: 1,
      });
    }
  });

  it("uses supplied radar names and scores at every width, with a fixed 0–100 scale", () => {
    const dimensions = [
      { name: "Implementation", score: 24.25 },
      { name: "Algorithms", score: 43 },
      { name: "Data structures", score: 0 },
      { name: "Dynamic programming", score: 39 },
      { name: "Graphs", score: 62 },
      { name: "Math", score: 51 },
    ];
    const source = structuredClone(dimensions);
    const option = radarOption(dimensions, "Current ability");
    expect(option.radar).toMatchObject({
      indicator: dimensions.map(({ name }) => ({ name, min: 0, max: 100 })),
    });
    expect(option.series).toMatchObject([
      {
        type: "radar",
        data: [{ name: "Current ability", value: [24.25, 43, 0, 39, 62, 51] }],
      },
    ]);
    expect(option.media).toMatchObject([
      { query: { maxWidth: 360 } },
      { query: { minWidth: 361, maxWidth: 600 } },
      { option: { radar: { radius: "58%" } } },
    ]);
    expect(dimensions).toEqual(source);
    expect(radarOption([], "Missing ability").series).toEqual([]);
  });

  it("restores radar geometry when resizing from mobile through tablet back to desktop", () => {
    const canvas = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({
        measureText: (text: string) => ({ width: text.length * 6 }),
      } as unknown as CanvasRenderingContext2D);
    const chart = init(null, undefined, {
      renderer: "svg",
      ssr: true,
      width: 900,
      height: 320,
    });
    try {
      chart.setOption(
        radarOption(
          [
            { name: "Implementation", score: 24 },
            { name: "Algorithms", score: 43 },
            { name: "Graphs", score: 62 },
          ],
          "Ability",
        ),
      );
      for (const [width, radius, fontSize, labelWidth, gap] of [
        [320, "48%", 10, 72, 6],
        [500, "52%", 11, 86, 10],
        [900, "58%", 11, 100, 10],
      ] as const) {
        chart.resize({ width });
        const radar = chart.getOption().radar as RadarComponentOption[];
        expect(radar[0]).toMatchObject({
          radius,
          axisNameGap: gap,
          axisName: { fontSize, width: labelWidth },
        });
      }
    } finally {
      chart.dispose();
      canvas.mockRestore();
    }
  });
});
