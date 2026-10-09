import type { EChartsOption } from "echarts";
export function trendOption(
  labels: string[],
  series: { id?: string; name: string; values: number[] }[],
  score = false,
): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line" },
    },
    legend: {
      show: false,
      type: "scroll",
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 16,
      icon: "roundRect",
    },
    grid: {
      left: 12,
      right: 24,
      top: 24,
      bottom: 32,
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
      id: item.id ?? item.name,
      name: item.name,
      data: item.values,
      // Keep straight segments: interpolation can imply unobserved peaks.
      smooth: false,
      symbol: ["circle", "diamond", "rect"][index % 3],
      showSymbol: labels.length < 12,
      symbolSize: 6,
      lineStyle: {
        width: index === 0 ? 3 : 2.25,
        type: index === 2 ? "dashed" : "solid",
      },
      areaStyle: index === 0 ? { opacity: 1 } : undefined,
      emphasis: { focus: "series", scale: 1.4 },
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
      show: false,
      type: "scroll",
      itemWidth: 10,
      itemHeight: 8,
      itemGap: 16,
      icon: "roundRect",
    },
    grid: {
      left: 12,
      right: horizontal ? 42 : 20,
      top: 22,
      bottom: 32,
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
            interval: 0,
          },
        }
      : values,
    series: [
      {
        type: "bar",
        id: "distribution-attempted",
        name: names[0],
        data: attempted,
        barMaxWidth: 14,
        barGap: "40%",
        barCategoryGap: "32%",
        itemStyle: {
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
          opacity: 0.85,
        },
        emphasis: { focus: "series" },
      },
      {
        type: "bar",
        id: "distribution-solved",
        name: names[1],
        data: solved,
        barMaxWidth: 14,
        label: horizontal
          ? { show: true, position: "right", distance: 7, fontSize: 11 }
          : undefined,
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
  const axisName = (name = "", wrap = false) => {
    const score = dimensions.find(
      (dimension) => dimension.name === name,
    )?.score;
    const label = wrap ? name.replace(/\s+/g, "\n") : name;
    return score === undefined ? label : `${label}\n{score|${score} / 100}`;
  };
  const desktopLayout = {
    radius: "58%",
    axisNameGap: 10,
    axisName: {
      formatter: (name?: string) => axisName(name),
      fontSize: 11,
      lineHeight: 16,
      width: 100,
      overflow: "break" as const,
      rich: {
        score: { fontSize: 11, fontWeight: 600, lineHeight: 20 },
      },
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
      shape: "polygon",
      ...desktopLayout,
    },
    series: dimensions.length
      ? [
          {
            type: "radar",
            id: "ability",
            name,
            symbol: "circle",
            symbolSize: 7,
            lineStyle: { width: 2.5 },
            areaStyle: { opacity: 1 },
            emphasis: { focus: "self", lineStyle: { width: 3 } },
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
              formatter: (name?: string) => axisName(name, true),
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
