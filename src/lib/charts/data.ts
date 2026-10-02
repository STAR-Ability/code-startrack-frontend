import type { AnalysisDto } from "@/lib/api/schemas";

function dateKey(instant: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instant));
}
// Only chart presentation fills gaps; the DTO and persisted counts remain untouched.
export function activitySeries(analysis: AnalysisDto) {
  const stats = analysis.activityStats;
  if (!stats.length) return [];
  const start = analysis.period.start
    ? dateKey(analysis.period.start, analysis.timezone)
    : stats[0].date;
  const end = dateKey(
    new Date(Date.parse(analysis.period.end) - 1).toISOString(),
    analysis.timezone,
  );
  const days = new Map(stats.map((stat) => [stat.date, stat]));
  const result = [];
  for (
    let cursor = Date.parse(`${start}T00:00:00Z`);
    cursor <= Date.parse(`${end}T00:00:00Z`);
    cursor += 86_400_000
  ) {
    const date = new Date(cursor).toISOString().slice(0, 10);
    result.push(
      days.get(date) ?? {
        date,
        submissionCount: 0,
        acceptedSubmissionCount: 0,
        failedSubmissionCount: 0,
        pendingSubmissionCount: 0,
        solvedCount: 0,
      },
    );
  }
  return result;
}
export function safeProblemUrl(value: string | null) {
  if (!value || value !== value.trim()) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? value
      : null;
  } catch {
    return null;
  }
}
