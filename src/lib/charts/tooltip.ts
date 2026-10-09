import type {
  EChartsOption,
  TooltipComponentFormatterCallbackParams,
  TooltipComponentOption,
} from "echarts";

/** Native text nodes keep backend labels literal while letting long names wrap. */
export function chartTooltipContent(
  params: TooltipComponentFormatterCallbackParams,
  option: EChartsOption,
  width?: number,
): HTMLElement {
  const items = Array.isArray(params) ? params : [params];
  const first = items[0];
  const panel = document.createElement("div");
  panel.dataset.chartTooltip = "";
  Object.assign(panel.style, {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "max-content",
    maxWidth: width
      ? `min(300px, calc(100vw - 64px), ${Math.max(0, width - 40)}px)`
      : "min(300px, calc(100vw - 64px))",
    whiteSpace: "normal",
  });
  if (!first) return panel;

  const title = document.createElement("div");
  title.textContent =
    first.seriesType === "radar"
      ? first.name
      : first.name || first.seriesName || "";
  Object.assign(title.style, {
    fontWeight: "600",
    paddingBottom: "8px",
    borderBottom: "1px solid var(--border)",
    overflowWrap: "anywhere",
    lineHeight: "1.5",
  });
  panel.append(title);

  const rows = document.createElement("div");
  Object.assign(rows.style, { display: "grid", gap: "8px" });
  panel.append(rows);
  for (const item of items) {
    const color =
      typeof item.color === "string"
        ? item.color
        : item.color && "colorStops" in item.color
          ? item.color.colorStops[0]?.color
          : undefined;
    const series = Array.isArray(option.series)
      ? option.series
      : [option.series];
    const source = series[item.seriesIndex ?? 0];
    const radarIndex = source?.type === "radar" ? (source.radarIndex ?? 0) : 0;
    const radar = Array.isArray(option.radar)
      ? option.radar[radarIndex]
      : option.radar;
    const values = Array.isArray(item.value) ? item.value : [item.value];
    for (const [index, value] of values.entries()) {
      const dimension =
        item.seriesType === "radar" ? radar?.indicator?.[index] : undefined;
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "grid",
        gridTemplateColumns: "10px minmax(0, 1fr) auto",
        alignItems: "baseline",
        columnGap: "8px",
      });
      const marker = document.createElement("span");
      marker.setAttribute("aria-hidden", "true");
      Object.assign(marker.style, {
        width: "8px",
        height: "8px",
        borderRadius: item.seriesType === "bar" ? "2px" : "50%",
        backgroundColor: color ?? "var(--muted-foreground)",
        alignSelf: "center",
      });
      const label = document.createElement("span");
      label.textContent = dimension?.name ?? item.seriesName ?? item.name;
      Object.assign(label.style, {
        overflowWrap: "anywhere",
        lineHeight: "1.5",
        color: "var(--muted-foreground)",
      });
      const metric = document.createElement("span");
      metric.textContent =
        value === null || value === undefined ? "—" : String(value);
      if (dimension?.max !== undefined)
        metric.textContent += ` / ${dimension.max}`;
      Object.assign(metric.style, {
        fontWeight: "600",
        fontVariantNumeric: "tabular-nums",
        textAlign: "right",
        whiteSpace: "nowrap",
      });
      row.append(marker, label, metric);
      rows.append(row);
    }
  }
  return panel;
}

export function chartTooltip(
  option: EChartsOption,
  reducedMotion = false,
  container?: HTMLElement,
): EChartsOption["tooltip"] {
  const present = (
    tooltip: TooltipComponentOption,
  ): TooltipComponentOption => ({
    ...tooltip,
    // Existing custom formatters retain their text rendering and semantics.
    renderMode: tooltip.formatter !== undefined ? "richText" : "html",
    transitionDuration: reducedMotion
      ? 0
      : (tooltip.transitionDuration ?? 0.12),
    ...(tooltip.formatter !== undefined
      ? {}
      : {
          formatter: (params: TooltipComponentFormatterCallbackParams) =>
            chartTooltipContent(params, option, container?.clientWidth),
          extraCssText:
            "box-shadow: var(--raised-shadow); pointer-events: none;",
        }),
  });
  return Array.isArray(option.tooltip)
    ? option.tooltip.map(present)
    : present(option.tooltip ?? {});
}
