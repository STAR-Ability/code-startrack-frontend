import type { EChartsOption } from "echarts";
export function trendOption(
  labels: string[],
  series: { name: string; values: number[] }[],
  score = false,
): EChartsOption {
  return {
    tooltip: { trigger: "axis" },
    legend: {
      bottom: 0,
      type: "scroll",
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 16,
    },
    grid: { left: 12, right: 14, top: 14, bottom: 52, outerBoundsMode: "same" },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisTick: { show: false },
      axisLabel: { hideOverlap: true, fontSize: 11 },
    },
    yAxis: {
      type: "value",
      min: 0,
      ...(score ? { max: 100 } : { minInterval: 1 }),
      axisLabel: { fontSize: 11 },
      splitLine: { lineStyle: { type: "dashed" } },
    },
    series: series.map((item, index) => ({
      type: "line",
      name: item.name,
      data: item.values,
      showSymbol: labels.length < 12,
      symbolSize: 5,
      lineStyle: { width: 2 },
      areaStyle: index === 0 ? { opacity: 0.08 } : undefined,
      emphasis: { focus: "series" },
    })),
  };
}
export function distributionOption(
  labels: (string | number)[],
  attempted: number[],
  solved: number[],
  names: [string, string],
  horizontal = false,
): EChartsOption {
  const category = {
    type: "category" as const,
    data: labels,
    axisTick: { show: false },
    axisLabel: { hideOverlap: true, fontSize: 11 },
  };
  const values = {
    type: "value" as const,
    minInterval: 1,
    splitLine: { lineStyle: { type: "dashed" as const } },
    axisLabel: { fontSize: 11 },
  };
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: {
      bottom: 0,
      type: "scroll",
      itemWidth: 10,
      itemHeight: 8,
      itemGap: 16,
    },
    grid: { left: 12, right: 12, top: 12, bottom: 44, outerBoundsMode: "same" },
    xAxis: horizontal ? values : category,
    yAxis: horizontal
      ? {
          ...category,
          inverse: true,
          axisLabel: { ...category.axisLabel, width: 90, overflow: "truncate" },
        }
      : values,
    series: [
      {
        type: "bar",
        name: names[0],
        data: attempted,
        barMaxWidth: 20,
        itemStyle: { borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
        emphasis: { focus: "series" },
      },
      {
        type: "bar",
        name: names[1],
        data: solved,
        barMaxWidth: 20,
        itemStyle: { borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
        emphasis: { focus: "series" },
      },
    ],
  };
}
