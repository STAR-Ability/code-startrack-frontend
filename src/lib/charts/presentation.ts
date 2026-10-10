import type { EChartsOption, SeriesOption } from "echarts";
import type { chartTheme } from "./theme";

type ChartTheme = ReturnType<typeof chartTheme>;
export type ChartColorSlots = Readonly<Record<string, number>>;

export function chartSeriesKey(series: SeriesOption, index: number) {
  return `${series.type ?? "series"}:${String(series.id ?? series.name ?? index)}`;
}

/** Keep each series' palette position when it is reordered, removed or relabeled. */
export function chartColorSlots(
  option: EChartsOption,
  previous: ChartColorSlots,
): ChartColorSlots {
  let next = previous;
  const counts: Record<string, number> = {};
  for (const [key, slot] of Object.entries(previous)) {
    const family = key.split(":")[0];
    counts[family] = Math.max(counts[family] ?? 0, slot + 1);
  }
  for (const [index, series] of chartSeries(option).entries()) {
    const key = chartSeriesKey(series, index);
    if (Object.hasOwn(next, key)) continue;
    const family = series.type ?? "series";
    if (next === previous) next = { ...previous };
    next = { ...next, [key]: counts[family] ?? 0 };
    counts[family] = (counts[family] ?? 0) + 1;
  }
  return next;
}

export function chartSeries(option: EChartsOption): SeriesOption[] {
  return option.series
    ? Array.isArray(option.series)
      ? option.series
      : [option.series]
    : [];
}

function alpha(color: string, opacity: number) {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const expanded =
      hex.length === 3
        ? hex
            .split("")
            .map((value) => value + value)
            .join("")
        : hex;
    return `rgba(${parseInt(expanded.slice(0, 2), 16)},${parseInt(expanded.slice(2, 4), 16)},${parseInt(expanded.slice(4, 6), 16)},${opacity})`;
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)$/)?.[1].split(",");
  return rgb ? `rgba(${rgb.slice(0, 3).join(",")},${opacity})` : color;
}

/** Apply theme-resolved fills without changing supplied data or axis domains. */
export function chartPresentation(
  option: EChartsOption,
  theme: ChartTheme,
  slots = chartColorSlots(option, {}),
): EChartsOption {
  const axis = Array.isArray(option.yAxis) ? option.yAxis[0] : option.yAxis;
  const horizontal = axis?.type === "category";
  return {
    ...option,
    series: chartSeries(option).map((series, index): SeriesOption => {
      const color =
        theme.color[
          (slots[chartSeriesKey(series, index)] ?? index) % theme.color.length
        ];
      if (!color) return series;
      if (series.type === "line") {
        return {
          ...series,
          itemStyle: {
            color,
            borderColor: theme.tooltip.backgroundColor,
            borderWidth: 2,
            ...series.itemStyle,
          },
          lineStyle: { color, ...series.lineStyle },
          ...(series.areaStyle
            ? {
                areaStyle: {
                  color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: alpha(color, 0.22) },
                      { offset: 1, color: alpha(color, 0.015) },
                    ],
                  },
                  ...series.areaStyle,
                },
              }
            : {}),
        };
      }
      if (series.type === "bar") {
        return {
          ...series,
          itemStyle: {
            borderColor: color,
            borderWidth: 1,
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: horizontal ? 1 : 0,
              y2: horizontal ? 0 : 1,
              colorStops: [
                { offset: 0, color: horizontal ? alpha(color, 0.65) : color },
                { offset: 1, color: horizontal ? color : alpha(color, 0.65) },
              ],
            },
            ...series.itemStyle,
          },
          label: { color: theme.textStyle.color, ...series.label },
        };
      }
      if (series.type === "radar") {
        return {
          ...series,
          itemStyle: {
            color,
            borderColor: theme.tooltip.backgroundColor,
            borderWidth: 2,
            ...series.itemStyle,
          },
          lineStyle: { color, ...series.lineStyle },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 1,
              colorStops: [
                { offset: 0, color: alpha(color, 0.32) },
                { offset: 1, color: alpha(color, 0.07) },
              ],
            },
            ...series.areaStyle,
          },
        };
      }
      return series;
    }),
  };
}

/** Give paired horizontal bars enough room for every supplied category label. */
export function chartHeight(option: EChartsOption): number | undefined {
  const axis = Array.isArray(option.yAxis) ? option.yAxis[0] : option.yAxis;
  if (axis?.type !== "category" || !Array.isArray(axis.data)) return undefined;
  return Math.max(256, axis.data.length * 42 + 54);
}
