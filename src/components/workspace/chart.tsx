"use client";
import { useEffect, useRef } from "react";
import { cn } from "cn";
import type { EChartsOption, ECharts } from "echarts";
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
  const element = useRef<HTMLDivElement>(null);
  const instance = useRef<ECharts | null>(null);
  const latest = useRef({ option, label, palette });
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
    let cleanup: (() => void) | undefined;
    void import("echarts").then((echarts) => {
      if (disposed || !element.current) return;
      const container = element.current;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      const current = latest.current;
      const chart = echarts.init(
        container,
        chartTheme(getComputedStyle(container), current.palette),
        { renderer: "svg" },
      );
      instance.current = chart;
      chart.setOption(
        displayOption(current.option, current.label, reducedMotion.matches),
      );
      const updateMotion = () =>
        chart.setOption({ animation: !reducedMotion.matches });
      reducedMotion.addEventListener("change", updateMotion);
      const observer = new ResizeObserver(() => chart.resize());
      observer.observe(container);
      const themeObserver = new MutationObserver(() =>
        refreshTheme(chart, container, latest.current, reducedMotion.matches),
      );
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      cleanup = () => {
        reducedMotion.removeEventListener("change", updateMotion);
        observer.disconnect();
        themeObserver.disconnect();
        chart.dispose();
        instance.current = null;
      };
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
  return (
    <div
      ref={element}
      role="img"
      aria-label={label}
      data-palette={palette}
      data-chart-size={size}
      className={cn(
        "chart-surface w-full min-w-0 rounded-lg",
        size === "ability" ? "h-72 sm:h-80" : "h-60",
      )}
    />
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
