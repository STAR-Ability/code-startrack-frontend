import { describe, expect, it } from "vitest";
import type { DefaultLabelFormatterCallbackParams } from "echarts";
import { distributionOption, radarOption, trendOption } from "./options";
import { chartTooltip, chartTooltipContent } from "./tooltip";

function sample(
  values: Partial<DefaultLabelFormatterCallbackParams>,
): DefaultLabelFormatterCallbackParams {
  return {
    componentType: "series",
    componentSubType: "line",
    componentIndex: 0,
    seriesType: "line",
    seriesName: "Submissions",
    name: "2026-10-09",
    dataIndex: 0,
    data: 0,
    value: 0,
    color: "#315fd3",
    $vars: ["seriesName", "name", "value"],
    ...values,
  };
}

describe("chart tooltip panels", () => {
  it("keeps exact zero and fractional values with matching series markers", () => {
    const option = trendOption(
      ["2026-10-09"],
      [
        { name: "Submissions", values: [0] },
        { name: "Score", values: [43.251234] },
      ],
    );
    const panel = chartTooltipContent(
      [
        sample({ value: 0 }),
        sample({ seriesName: "Score", value: 43.251234, color: "#7156ad" }),
      ],
      option,
    );
    expect(panel.textContent).toBe("2026-10-09Submissions0Score43.251234");
    const markers = panel.querySelectorAll('[aria-hidden="true"]');
    expect((markers[0] as HTMLElement).style.backgroundColor).toBe(
      "rgb(49, 95, 211)",
    );
    expect((markers[1] as HTMLElement).style.backgroundColor).toBe(
      "rgb(113, 86, 173)",
    );
  });

  it("uses literal text nodes for names containing HTML and rich-text syntax", () => {
    const name = '<img src=x onerror="alert(1)">{value|not markup}';
    const label = "很长的算法类别与附加信息 / a very long translated category";
    const panel = chartTooltipContent(
      sample({ name, seriesName: label, value: 12 }),
      distributionOption([name], [12], [0], [label, "Solved"], true),
    );
    expect(panel.textContent).toBe(`${name}${label}12`);
    expect(panel.querySelector("img, script")).toBeNull();
    expect(panel.innerHTML).toContain("&lt;img");
    expect(panel.style.maxWidth).toContain("300px");
    expect(panel.style.maxWidth).toContain("100vw");
    expect(
      panel.querySelector("span:nth-child(2)")?.getAttribute("style"),
    ).toContain("overflow-wrap: anywhere");
  });

  it("shows radar dimensions with their supplied scores and common domain", () => {
    const option = radarOption(
      [
        { name: "Graphs", score: 0 },
        { name: "Math", score: 43.25 },
      ],
      "Current ability",
    );
    const panel = chartTooltipContent(
      sample({
        seriesType: "radar",
        name: "Current ability",
        value: [0, 43.25],
      }),
      option,
    );
    expect(panel.textContent).toBe(
      "Current abilityGraphs0 / 100Math43.25 / 100",
    );
  });

  it("distinguishes absent values from genuine zeros and resolves bar gradients", () => {
    const panel = chartTooltipContent(
      sample({
        seriesType: "bar",
        value: null,
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [{ offset: 0, color: "#187347" }],
        },
      }),
      {},
    );
    expect(panel.textContent).toBe("2026-10-09Submissions—");
    expect(
      (panel.querySelector('[aria-hidden="true"]') as HTMLElement).style
        .backgroundColor,
    ).toBe("rgb(24, 115, 71)");
  });

  it("preserves explicit formatters while composing the default tooltip safely", () => {
    const formatter = () => "custom text";
    expect(
      chartTooltip({ tooltip: { formatter, trigger: "item" } }),
    ).toMatchObject({ formatter, renderMode: "richText", trigger: "item" });
    expect(chartTooltip({ tooltip: { trigger: "axis" } })).toMatchObject({
      renderMode: "html",
      trigger: "axis",
      formatter: expect.any(Function),
    });
    expect(chartTooltip({ tooltip: { trigger: "axis" } }, true)).toMatchObject({
      transitionDuration: 0,
    });
  });
});
