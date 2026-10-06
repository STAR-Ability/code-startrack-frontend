"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import type { EChartsOption, ECharts } from "echarts";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { chartTheme, type ChartPalette } from "@/lib/charts/theme";

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
  const latest = useRef({ option, label, palette });
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    // Reset the model when media is present or removed: replaceMerge applies to
    // partial media rules and clears their omitted series/radar indicators.
    const resetMedia =
      Boolean(latest.current.option.media?.length) ||
      Boolean(option.media?.length);
    latest.current = { option, label, palette };
    const chart = instance.current;
    if (!chart) return;
    chart.setOption(
      displayOption(
        option,
        label,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      resetMedia
        ? { notMerge: true }
        : { replaceMerge: ["series", "xAxis", "yAxis", "radar", "grid"] },
    );
  }, [option, label, palette]);
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
    let chart: ECharts | undefined;
    let reducedMotion: MediaQueryList | undefined;
    let updateMotion: (() => void) | undefined;
    let observer: ResizeObserver | undefined;
    let themeObserver: MutationObserver | undefined;
    // Setup can fail after creating an instance or attaching an observer.
    const cleanup = () => {
      if (reducedMotion && updateMotion)
        reducedMotion.removeEventListener("change", updateMotion);
      updateMotion = undefined;
      observer?.disconnect();
      observer = undefined;
      themeObserver?.disconnect();
      themeObserver = undefined;
      if (instance.current === chart) instance.current = null;
      chart?.dispose();
      chart = undefined;
    };
    void import("echarts")
      .then((echarts) => {
        if (disposed || !element.current) return;
        const container = element.current;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        reducedMotion = motion;
        const current = latest.current;
        const initialized = echarts.init(
          container,
          chartTheme(getComputedStyle(container), current.palette),
          { renderer: "svg" },
        );
        chart = initialized;
        instance.current = initialized;
        initialized.setOption(
          displayOption(current.option, current.label, motion.matches),
        );
        updateMotion = () =>
          initialized.setOption({ animation: !motion.matches });
        motion.addEventListener("change", updateMotion);
        observer = new ResizeObserver(() => initialized.resize());
        observer.observe(container);
        themeObserver = new MutationObserver(() =>
          refreshTheme(initialized, container, latest.current, motion.matches),
        );
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });
        setStatus("ready");
      })
      .catch(() => {
        cleanup();
        if (!disposed) setStatus("unavailable");
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [attempt]);
  return (
    <div
      aria-busy={status === "loading" || undefined}
      data-chart-state={status}
      data-chart-size={size}
      className={cn(
        "chart-frame relative w-full min-w-0 rounded-lg",
        size === "ability" ? "h-72 sm:h-80" : "h-60",
      )}
    >
      <div
        ref={element}
        role={status === "ready" ? "img" : undefined}
        aria-label={status === "ready" ? label : undefined}
        aria-hidden={status !== "ready" || undefined}
        data-palette={palette}
        data-chart-size={size}
        className={cn(
          "chart-surface h-full w-full min-w-0 rounded-lg",
          status !== "ready" && "invisible",
        )}
      />
      {status !== "ready" && (
        <div
          role={status === "loading" ? "status" : "alert"}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center text-sm text-muted-foreground"
        >
          {status === "loading" ? (
            <>
              <Skeleton className="h-24 w-full max-w-sm" aria-hidden="true" />
              <p>{t("chart.loading")}</p>
            </>
          ) : (
            <>
              <p>{t("chart.unavailable")}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                wrap
                onClick={() => {
                  setStatus("loading");
                  setAttempt((value) => value + 1);
                }}
              >
                {t("chart.retry")}
              </Button>
            </>
          )}
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
  }: {
    option: EChartsOption;
    label: string;
    palette: ChartPalette;
  },
  reducedMotion: boolean,
) {
  chart.setTheme(chartTheme(getComputedStyle(container), palette));
  // ECharts 6.1 setTheme restores its initial option snapshot, including motion.
  chart.setOption(displayOption(option, label, reducedMotion), {
    notMerge: true,
  });
}

function displayOption(
  option: EChartsOption,
  label: string,
  reducedMotion: boolean,
): EChartsOption {
  const tooltip = Array.isArray(option.tooltip)
    ? option.tooltip.map((item) => ({
        ...item,
        renderMode: "richText" as const,
      }))
    : { ...option.tooltip, renderMode: "richText" as const };
  return {
    ...option,
    animation: !reducedMotion,
    animationDuration: 360,
    animationDurationUpdate: 220,
    animationEasing: "cubicOut",
    animationEasingUpdate: "cubicOut",
    aria: { enabled: true, label: { description: label } },
    tooltip,
  };
}
