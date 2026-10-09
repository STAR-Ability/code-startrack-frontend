/** Keep the chart engine outside the route's initial JavaScript bundle. */
export function loadChartEngine() {
  return import("echarts");
}
