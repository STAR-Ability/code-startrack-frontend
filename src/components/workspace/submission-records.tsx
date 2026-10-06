"use client";

import type { SubmissionDto } from "@/lib/api/schemas";
import { verdictTone } from "@/lib/ui/status";
import { formatTimestamp } from "@/lib/i18n/locale";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { ProblemLink } from "./recommendation-card";

function SubmissionVerdict({ item }: { item: SubmissionDto }) {
  const { t } = useLocale();
  return (
    <Badge variant={verdictTone[item.verdict]} wrap>
      {item.verdict === "PENDING" ? t("v.pending") : item.verdict}
    </Badge>
  );
}

function SubmissionTime({ item }: { item: SubmissionDto }) {
  const { locale } = useLocale();
  return (
    <time dateTime={item.submittedAt} className="wrap-anywhere">
      {formatTimestamp(item.submittedAt, locale)}
    </time>
  );
}

function SubmissionDetails({
  item,
  measurements = false,
}: {
  item: SubmissionDto;
  measurements?: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className="flex min-w-0 flex-col gap-3 text-sm text-foreground">
      {measurements && (
        <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{t("v.language")}</dt>
            <dd className="wrap-anywhere">
              {item.programmingLanguage ?? t("v.unavailable")}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{t("v.time")}</dt>
            <dd className="tabular-nums">
              {item.timeMs ?? t("v.unavailable")}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{t("v.memory")}</dt>
            <dd className="tabular-nums">
              {item.memoryBytes === null
                ? t("v.unavailable")
                : (item.memoryBytes / 1048576).toFixed(2)}
            </dd>
          </div>
        </dl>
      )}
      {(item.teamName || item.memberHandles.length > 1) && (
        <p className="wrap-anywhere">
          {t("v.team")}: {item.teamName} · {item.memberHandles.join(", ")}
        </p>
      )}
      <p className="wrap-anywhere font-mono text-xs text-muted-foreground">
        ID: {item.submissionId} · CF: {item.externalSubmissionId}
      </p>
    </div>
  );
}

/** Account records keep backend order and remain readable in a narrow Sheet. */
export function SubmissionRecords({ items }: { items: SubmissionDto[] }) {
  const { t } = useLocale();
  if (!items.length) return null;
  return (
    <div className="submission-records min-w-0 rounded-xl border bg-card">
      <table className="submission-table">
        <caption className="sr-only">{t("v.submissions")}</caption>
        <colgroup>
          <col style={{ width: "30%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "24%" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{t("v.problemId")}</th>
            <th scope="col">{t("v.verdict")}</th>
            <th scope="col">{t("v.language")}</th>
            <th scope="col">{t("v.time")}</th>
            <th scope="col">{t("v.memory")}</th>
            <th scope="col">{t("v.lastSubmitted")}</th>
          </tr>
        </thead>
        {items.map((item) => (
          <tbody key={item.submissionId} data-submission-id={item.submissionId}>
            <tr data-submission-primary>
              <th scope="row">
                <h3 className="wrap-anywhere font-medium">
                  {item.problem.title ?? item.problem.externalProblemKey}
                </h3>
                {item.problem.title && (
                  <p className="wrap-anywhere text-xs font-normal text-muted-foreground">
                    {item.problem.externalProblemKey}
                  </p>
                )}
              </th>
              <td>
                <SubmissionVerdict item={item} />
              </td>
              <td className="wrap-anywhere">
                {item.programmingLanguage ?? t("v.unavailable")}
              </td>
              <td className="tabular-nums">
                {item.timeMs ?? t("v.unavailable")}
              </td>
              <td className="tabular-nums">
                {item.memoryBytes === null
                  ? t("v.unavailable")
                  : (item.memoryBytes / 1048576).toFixed(2)}
              </td>
              <td>
                <SubmissionTime item={item} />
              </td>
            </tr>
            <tr data-submission-detail>
              <td colSpan={6}>
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <DetailsDisclosure
                      title={t("v.submissionDetails")}
                      accessibleLabel={t("v.submissionDetailsFor", {
                        problem:
                          item.problem.title ?? item.problem.externalProblemKey,
                        id: item.externalSubmissionId,
                      })}
                    >
                      <SubmissionDetails item={item} />
                    </DetailsDisclosure>
                  </div>
                  <ProblemLink problem={item.problem} />
                </div>
              </td>
            </tr>
          </tbody>
        ))}
      </table>
      <ul className="submission-mobile-list flex min-w-0 flex-col px-4">
        {items.map((item) => (
          <li
            key={item.submissionId}
            data-submission-id={item.submissionId}
            className="flex min-w-0 flex-col gap-3 py-4"
          >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1 basis-40">
                <h3 className="wrap-anywhere font-medium">
                  {item.problem.title ?? item.problem.externalProblemKey}
                </h3>
                {item.problem.title && (
                  <p className="wrap-anywhere text-xs text-muted-foreground">
                    {item.problem.externalProblemKey}
                  </p>
                )}
              </div>
              <SubmissionVerdict item={item} />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("v.lastSubmitted")}: <SubmissionTime item={item} />
            </p>
            <DetailsDisclosure
              title={t("v.submissionDetails")}
              accessibleLabel={t("v.submissionDetailsFor", {
                problem: item.problem.title ?? item.problem.externalProblemKey,
                id: item.externalSubmissionId,
              })}
              variant="panel"
            >
              <SubmissionDetails item={item} measurements />
            </DetailsDisclosure>
            <div className="flex min-w-0 flex-wrap">
              <ProblemLink problem={item.problem} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
