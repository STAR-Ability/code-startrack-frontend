"use client";
import { useEffect, useRef } from "react";
import type { EChartsOption } from "echarts";

export function Chart({
  option,
  label,
}: {
  option: EChartsOption;
  label: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import("echarts").then((echarts) => {
      if (disposed || !element.current) return;
      const styles = getComputedStyle(element.current);
      const foreground = styles.getPropertyValue("--muted-foreground").trim();
      const border = styles.getPropertyValue("--border").trim();
      const chart = echarts.init(
        element.current,
        {
          color: [
            styles.getPropertyValue("--link").trim(),
            styles.getPropertyValue("--chart-2").trim(),
            styles.getPropertyValue("--chart-3").trim(),
          ],
          textStyle: { color: foreground, fontFamily: styles.fontFamily },
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
            axisLine: { lineStyle: { color: border } },
            splitLine: { lineStyle: { color: border } },
            splitArea: {
              areaStyle: {
                color: [
                  "transparent",
                  styles.getPropertyValue("--muted").trim(),
                ],
              },
            },
          },
        },
        {
          renderer: "svg",
        },
      );
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
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
      const updateMotion = () => {
        chart.setOption({ animation: !reducedMotion.matches });
      };
      reducedMotion.addEventListener("change", updateMotion);
      const observer = new ResizeObserver(() => chart.resize());
      observer.observe(element.current);
      cleanup = () => {
        reducedMotion.removeEventListener("change", updateMotion);
        observer.disconnect();
        chart.dispose();
      };
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [option, label]);
  return (
    <div
      ref={element}
      role="img"
      aria-label={label}
      className="h-60 w-full min-w-0"
    />
  );
}
