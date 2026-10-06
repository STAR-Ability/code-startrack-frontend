import type { EChartsOption } from "echarts";
export function trendOption(
  labels: string[],
  series: { name: string; values: number[] }[],
  score = false,
): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line" },
    },
    legend: {
      bottom: 0,
      type: "scroll",
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 16,
      icon: "roundRect",
    },
    grid: {
      left: 12,
      right: 18,
      top: 20,
      bottom: 56,
      outerBoundsMode: "same",
      outerBoundsContain: "axisLabel",
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { hideOverlap: true, fontSize: 11, margin: 14 },
    },
    yAxis: {
      type: "value",
      min: 0,
      splitNumber: 3,
      ...(score ? { max: 100 } : { minInterval: 1 }),
      axisLabel: { fontSize: 11, margin: 10 },
      splitLine: { lineStyle: { type: "dashed" } },
    },
    series: series.map((item, index) => ({
      type: "line",
      name: item.name,
      data: item.values,
      showSymbol: labels.length < 12,
      symbolSize: 5,
      lineStyle: { width: 2.5 },
      areaStyle: index === 0 ? { opacity: 0.075 } : undefined,
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
    axisLine: { show: false },
    axisLabel: { hideOverlap: true, fontSize: 11, margin: 12 },
  };
  const values = {
    type: "value" as const,
    minInterval: 1,
    min: 0,
    splitNumber: 3,
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
      icon: "roundRect",
    },
    grid: {
      left: 12,
      right: 16,
      top: 16,
      bottom: 52,
      outerBoundsMode: "same",
      outerBoundsContain: "axisLabel",
    },
    xAxis: horizontal ? values : category,
    yAxis: horizontal
      ? {
          ...category,
          inverse: true,
          axisLabel: {
            ...category.axisLabel,
            width: 110,
            overflow: "truncate",
          },
        }
      : values,
    series: [
      {
        type: "bar",
        name: names[0],
        data: attempted,
        barMaxWidth: 18,
        barGap: "25%",
        itemStyle: {
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
          opacity: 0.5,
        },
        emphasis: { focus: "series" },
      },
      {
        type: "bar",
        name: names[1],
        data: solved,
        barMaxWidth: 18,
        itemStyle: { borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
        emphasis: { focus: "series" },
      },
    ],
  };
}

export function radarOption(
  dimensions: readonly { name: string; score: number }[],
  name: string,
): EChartsOption {
  const desktopLayout = {
    radius: "58%",
    axisNameGap: 10,
    axisName: {
      formatter: (name?: string) => name ?? "",
      fontSize: 11,
      lineHeight: 16,
      width: 100,
      overflow: "break" as const,
    },
  };
  return {
    tooltip: { trigger: "item" },
    radar: {
      indicator: dimensions.map((dimension) => ({
        name: dimension.name,
        min: 0,
        max: 100,
      })),
      center: ["50%", "51%"],
      splitNumber: 4,
      ...desktopLayout,
    },
    series: dimensions.length
      ? [
          {
            type: "radar",
            name,
            symbol: "circle",
            symbolSize: 5,
            lineStyle: { width: 2 },
            areaStyle: { opacity: 0.14 },
            data: [
              { name, value: dimensions.map((dimension) => dimension.score) },
            ],
          },
        ]
      : [],
    media: [
      {
        query: { maxWidth: 360 },
        option: {
          radar: {
            radius: "48%",
            axisNameGap: 6,
            axisName: {
              fontSize: 10,
              lineHeight: 13,
              width: 72,
              // Radar axis names override width/overflow; wrap words explicitly.
              formatter: (name?: string) => name?.replace(/\s+/g, "\n") ?? "",
            },
          },
        },
      },
      {
        query: { minWidth: 361, maxWidth: 600 },
        option: {
          radar: {
            ...desktopLayout,
            radius: "52%",
            axisName: { ...desktopLayout.axisName, width: 86 },
          },
        },
      },
      { option: { radar: desktopLayout } },
    ],
  };
}
