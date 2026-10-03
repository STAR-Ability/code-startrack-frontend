"use client";
import { useEffect, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import { chartTheme, type ChartPalette } from "@/lib/charts/theme";

export function Chart({
  option,
  label,
  palette = "core",
}: {
  option: EChartsOption;
  label: string;
  palette?: ChartPalette;
}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import("echarts").then((echarts) => {
      if (disposed || !element.current) return;
      const container = element.current;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      let chart: ECharts;
      const render = () => {
        chart?.dispose();
        chart = echarts.init(
          container,
          chartTheme(getComputedStyle(container), palette),
          { renderer: "svg" },
        );
        chart.setOption({
          ...option,
          animation: !reducedMotion.matches,
          animationDuration: 300,
          animationDurationUpdate: 200,
          animationEasing: "cubicOut",
          animationEasingUpdate: "cubicOut",
          aria: { enabled: true, label: { description: label } },
          tooltip: { ...option.tooltip, renderMode: "richText" },
        });
      };
      render();
      const updateMotion = () =>
        chart.setOption({ animation: !reducedMotion.matches });
      reducedMotion.addEventListener("change", updateMotion);
      const observer = new ResizeObserver(() => chart.resize());
      observer.observe(container);
      const themeObserver = new MutationObserver(render);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      cleanup = () => {
        reducedMotion.removeEventListener("change", updateMotion);
        observer.disconnect();
        themeObserver.disconnect();
        chart.dispose();
      };
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [option, label, palette]);
  return (
    <div
      ref={element}
      role="img"
      aria-label={label}
      data-palette={palette}
      className="chart-surface h-60 w-full min-w-0 rounded-lg"
    />
  );
}
