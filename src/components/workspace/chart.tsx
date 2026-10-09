"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "cn";
import type { EChartsOption, ECharts } from "echarts";
import {
  chartTheme,
  chartPalettes,
  type ChartPalette,
} from "@/lib/charts/theme";
import {
  chartHeight,
  chartPresentation,
  chartSeries,
  chartColorSlots,
  chartSeriesKey,
  type ChartColorSlots,
} from "@/lib/charts/presentation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useLocale } from "@/components/layout/locale-provider";
import { loadChartEngine } from "@/lib/charts/engine";

export function Chart({
  option,
  label,
  palette = "core",
  size = "standard",
}: {
  option: EChartsOption;
  label: string;
  palette?: ChartPalette;
  size?: "standard" | "ability";
}) {
  const { t } = useLocale();
  const element = useRef<HTMLDivElement>(null);
  const instance = useRef<ECharts | null>(null);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const [colorSlots, setColorSlots] = useState(() =>
    chartColorSlots(option, {}),
  );
  const updatedSlots = chartColorSlots(option, colorSlots);
  if (updatedSlots !== colorSlots) setColorSlots(updatedSlots);
  const [renderState, setRenderState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const latest = useRef({ option, label, palette, hiddenSeries, colorSlots });
  const series = chartSeries(option);
  const legendSeries = option.legend
    ? series
        .map((item, index) => ({ item, index }))
        .filter(
          ({ item }) => typeof item.name === "string" && item.name.length > 0,
        )
    : [];
  useEffect(() => {
    // Reset the model when media is present or removed: replaceMerge applies to
    // partial media rules and clears their omitted series/radar indicators.
    const resetMedia =
      Boolean(latest.current.option.media?.length) ||
      Boolean(option.media?.length);
    latest.current = { option, label, palette, hiddenSeries, colorSlots };
    const chart = instance.current;
    if (!chart) return;
    chart.setOption(
      displayOption(
        option,
        label,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        chartTheme(getComputedStyle(element.current!), palette),
        hiddenSeries,
        colorSlots,
      ),
      resetMedia
        ? { notMerge: true }
        : { replaceMerge: ["series", "xAxis", "yAxis", "radar", "grid"] },
    );
  }, [option, label, palette, hiddenSeries, colorSlots]);
  useEffect(() => {
    if (instance.current && element.current)
      refreshTheme(
        instance.current,
        element.current,
        latest.current,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
  }, [palette]);
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void loadChartEngine()
      .then((echarts) => {
        if (disposed || !element.current) return;
        const container = element.current;
        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        );
        const current = latest.current;
        const theme = chartTheme(getComputedStyle(container), current.palette);
        const chart = echarts.init(container, theme, { renderer: "svg" });
        instance.current = chart;
        const observers: { resize?: ResizeObserver; theme?: MutationObserver } =
          {};
        const updateMotion = () =>
          chart.setOption({ animation: !reducedMotion.matches });
        // Install disposal before rendering so a failed first frame cannot leak an instance.
        cleanup = () => {
          reducedMotion.removeEventListener("change", updateMotion);
          observers.resize?.disconnect();
          observers.theme?.disconnect();
          chart.dispose();
          instance.current = null;
        };
        chart.setOption(
          displayOption(
            current.option,
            current.label,
            reducedMotion.matches,
            theme,
            current.hiddenSeries,
            current.colorSlots,
          ),
        );
        reducedMotion.addEventListener("change", updateMotion);
        observers.resize = new ResizeObserver(() => chart.resize());
        observers.resize.observe(container);
        observers.theme = new MutationObserver(() =>
          refreshTheme(chart, container, latest.current, reducedMotion.matches),
        );
        observers.theme.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });
        setRenderState("ready");
      })
      .catch(() => {
        cleanup?.();
        cleanup = undefined;
        if (!disposed) setRenderState("error");
      });
    return () => {
      disposed = true;
      cleanup?.();
      cleanup = undefined;
    };
  }, [attempt]);
  return (
    <div className="chart-frame">
      <div className="relative">
        <div
          ref={element}
          role="img"
          aria-label={label}
          aria-busy={renderState === "loading"}
          aria-hidden={renderState === "error" || undefined}
          data-palette={palette}
          data-chart-size={size}
          style={{
            height: size === "standard" ? chartHeight(option) : undefined,
          }}
          className={cn(
            "chart-surface w-full min-w-0 rounded-xl",
            size === "ability" ? "h-72 sm:h-80" : "h-64",
          )}
        />
        {renderState === "loading" && (
          <div
            role="status"
            className="absolute inset-0 flex items-center justify-center gap-2 overflow-hidden rounded-xl text-sm text-muted-foreground"
          >
            <Skeleton className="absolute inset-3 rounded-lg" />
            <span className="relative flex items-center gap-2">
              <Spinner aria-hidden="true" />
              {t("v.loading")}
            </span>
          </div>
        )}
        {renderState === "error" && (
          <div className="absolute inset-0 flex items-center p-5">
            <Alert>
              <AlertTitle>{t("charts.unavailable")}</AlertTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRenderState("loading");
                  setAttempt((value) => value + 1);
                }}
              >
                {t("v.retry")}
              </Button>
            </Alert>
          </div>
        )}
      </div>
      {legendSeries.length > 0 && (
        <div className="chart-legend" role="group" aria-label={label}>
          {legendSeries.map(({ item, index }) => {
            const name = String(item.name);
            const key = String(item.id ?? item.name);
            return (
              <Button
                key={key}
                type="button"
                variant="ghost"
                size="sm"
                wrap
                className="chart-legend-item"
                disabled={renderState !== "ready"}
                aria-pressed={!hiddenSeries.includes(key)}
                style={
                  {
                    "--legend-color": `var(${chartPalettes[palette][(colorSlots[chartSeriesKey(item, index)] ?? index) % chartPalettes[palette].length]})`,
                  } as CSSProperties
                }
                onClick={() =>
                  setHiddenSeries((hidden) =>
                    hidden.includes(key)
                      ? hidden.filter((item) => item !== key)
                      : [...hidden, key],
                  )
                }
              >
                <span
                  className="chart-legend-swatch"
                  aria-hidden="true"
                  data-chart-mark={
                    item.type === "bar"
                      ? "bar"
                      : item.type === "line" && typeof item.symbol === "string"
                        ? item.symbol
                        : "circle"
                  }
                  data-line-style={
                    item.type === "line"
                      ? (item.lineStyle?.type ?? "solid")
                      : "solid"
                  }
                />
                <span>{name}</span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function refreshTheme(
  chart: ECharts,
  container: HTMLElement,
  {
    option,
    label,
    palette,
    hiddenSeries,
    colorSlots,
  }: {
    option: EChartsOption;
    label: string;
    palette: ChartPalette;
    hiddenSeries: string[];
    colorSlots: ChartColorSlots;
  },
  reducedMotion: boolean,
) {
  const theme = chartTheme(getComputedStyle(container), palette);
  chart.setTheme(theme);
  // ECharts 6.1 setTheme restores its initial option snapshot, including motion.
  chart.setOption(
    displayOption(
      option,
      label,
      reducedMotion,
      theme,
      hiddenSeries,
      colorSlots,
    ),
    {
      notMerge: true,
    },
  );
}

function displayOption(
  option: EChartsOption,
  label: string,
  reducedMotion: boolean,
  theme: ReturnType<typeof chartTheme>,
  hiddenSeries: string[],
  colorSlots: ChartColorSlots,
): EChartsOption {
  const tooltip = Array.isArray(option.tooltip)
    ? option.tooltip.map((item) => ({
        ...item,
        renderMode: "richText" as const,
      }))
    : { ...option.tooltip, renderMode: "richText" as const };
  return {
    ...chartPresentation(option, theme, colorSlots),
    ...(option.legend
      ? {
          legend: {
            ...(Array.isArray(option.legend)
              ? option.legend[0]
              : option.legend),
            show: false,
            selected: Object.fromEntries(
              chartSeries(option).map((series) => [
                String(series.name),
                !hiddenSeries.includes(String(series.id ?? series.name)),
              ]),
            ),
          },
        }
      : {}),
    animation: !reducedMotion,
    animationDuration: 360,
    animationDurationUpdate: 220,
    animationEasing: "cubicOut",
    animationEasingUpdate: "cubicOut",
    aria: { enabled: true, label: { description: label } },
    tooltip,
  };
}
