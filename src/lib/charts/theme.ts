/** CSS owns the colors; ECharts receives resolved values for its color parsing. */
export const chartPalettes = {
  core: ["--info", "--muted-foreground", "--support", "--insight"],
  activity: ["--info", "--success", "--warning"],
  teamActivity: ["--info", "--success", "--support"],
  distribution: ["--muted-foreground", "--success"],
  ability: ["--insight", "--support", "--muted-foreground"],
} as const;
export type ChartPalette = keyof typeof chartPalettes;

export function chartTheme(styles: CSSStyleDeclaration, palette: ChartPalette) {
  let context: CanvasRenderingContext2D | null | undefined;
  const token = (name: string) => {
    const value = styles.getPropertyValue(name).trim();
    if (!value || value.startsWith("#")) return value;
    // ECharts 6.1 cannot parse modern CSS colors such as the dark theme's OKLCH.
    // Resolve through the browser rather than duplicate CSS color conversion rules.
    if (context === undefined) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      context = canvas.getContext("2d", { willReadFrequently: true });
    }
    if (!context) return value;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, alpha] = context.getImageData(0, 0, 1, 1).data;
    return `rgba(${r},${g},${b},${alpha / 255})`;
  };
  const foreground = token("--muted-foreground");
  const border = token("--border");
  return {
    color: chartPalettes[palette].map(token),
    backgroundColor: "transparent",
    textStyle: { color: foreground, fontFamily: styles.fontFamily },
    legend: {
      textStyle: { color: token("--foreground"), fontSize: 11 },
      pageTextStyle: { color: foreground },
      pageIconColor: token("--info"),
      pageIconInactiveColor: border,
    },
    tooltip: {
      confine: true,
      showDelay: 60,
      hideDelay: 80,
      transitionDuration: 0.12,
      backgroundColor: token("--popover"),
      borderColor: border,
      borderWidth: 1,
      padding: [10, 12],
      borderRadius: 8,
      textStyle: { color: token("--popover-foreground"), fontSize: 12 },
    },
    axisPointer: {
      lineStyle: { color: border, type: "dashed" },
      shadowStyle: { color: token("--info-soft"), opacity: 0.55 },
      label: { show: false },
    },
    categoryAxis: {
      axisLine: { show: false },
      axisLabel: { color: foreground },
    },
    valueAxis: {
      axisLine: { show: false },
      axisLabel: { color: foreground },
      splitLine: { lineStyle: { color: border, opacity: 0.75 } },
    },
    radar: {
      axisName: { color: token("--foreground") },
      axisLine: { lineStyle: { color: border, opacity: 0.7 } },
      splitLine: { lineStyle: { color: border, opacity: 0.85 } },
      splitArea: { areaStyle: { color: ["transparent", token("--muted")] } },
    },
  };
}
