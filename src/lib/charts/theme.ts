/** CSS owns the colors; ECharts receives resolved values for its color parsing. */
export const chartPalettes = {
  core: ["--info", "--muted-foreground", "--support", "--insight"],
  activity: ["--info", "--success", "--warning"],
  distribution: ["--muted-foreground", "--success"],
  ability: ["--insight", "--support", "--muted-foreground"],
} as const;
export type ChartPalette = keyof typeof chartPalettes;

export function chartTheme(styles: CSSStyleDeclaration, palette: ChartPalette) {
  const token = (name: string) => styles.getPropertyValue(name).trim();
  const foreground = token("--muted-foreground");
  const border = token("--border");
  return {
    color: chartPalettes[palette].map(token),
    backgroundColor: "transparent",
    textStyle: { color: foreground, fontFamily: styles.fontFamily },
    legend: { textStyle: { color: foreground } },
    categoryAxis: {
      axisLine: { lineStyle: { color: border } },
      axisLabel: { color: foreground },
    },
    valueAxis: {
      axisLine: { show: false },
      axisLabel: { color: foreground },
      splitLine: { lineStyle: { color: border } },
    },
    radar: {
      axisName: { color: foreground },
      axisLine: { lineStyle: { color: border } },
      splitLine: { lineStyle: { color: border } },
      splitArea: { areaStyle: { color: ["transparent", token("--muted")] } },
    },
  };
}
