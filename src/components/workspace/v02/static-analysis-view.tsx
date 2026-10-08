"use client";

import { useId } from "react";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type {
  StaticAnalysisResult,
  SubmissionAnalysisView,
  SubmissionView,
} from "@/lib/api/v02-schemas";
import { EmptyState } from "../feedback";
import { Panel } from "../v012-shared";
import { TaskErrorView } from "./submission-judge";

export function analysisCanRetry(
  analysis: SubmissionAnalysisView,
  submission: SubmissionView,
) {
  if (submission.judgeStatus !== "COMPLETED") return false;
  if (analysis.status === "PARTIAL" || analysis.status === "FAILED")
    return true;
  return analysis.status === "SKIPPED" && analysis.error?.retryable === true;
}

const metrics = [
  "sourceLines",
  "functionCount",
  "maxCyclomaticComplexity",
  "meanCyclomaticComplexity",
  "duplicateLines",
  "maintainabilityIndex",
] as const;

export function StaticAnalysisView({
  analysis,
  previousResult = null,
  retry,
  retrying = false,
  retryBlocked = false,
}: {
  analysis: SubmissionAnalysisView;
  previousResult?: StaticAnalysisResult | null;
  retry?: () => void;
  retrying?: boolean;
  retryBlocked?: boolean;
}) {
  const { t } = useLocale();
  const synthesisTitle = useId();
  const result = analysis.result ?? previousResult;
  const previous = !!result && result.analysisId !== analysis.analysisId;
  const pending = analysis.status === "QUEUED" || analysis.status === "RUNNING";
  return (
    <Panel
      title="v02.staticAnalysis"
      description={t("v02.analysisIndependent")}
      variant="analysis"
    >
      <div
        className="flex flex-wrap items-center gap-3"
        role="status"
        aria-live="polite"
      >
        <Badge
          wrap
          variant={
            analysis.status === "SUCCEEDED"
              ? "success"
              : ["PARTIAL", "FAILED"].includes(analysis.status)
                ? "warning"
                : "secondary"
          }
        >
          {t(`v02.analysis.${analysis.status}`)}
        </Badge>
        {retry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            wrap
            disabled={retrying || retryBlocked}
            onClick={retry}
          >
            {retrying && (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            )}
            {t(retrying ? "v02.analysisRetryPending" : "v02.analysisRetry")}
          </Button>
        )}
      </div>
      {analysis.status === "NOT_REQUESTED" && (
        <p>{t("v02.analysisNotRequested")}</p>
      )}
      {pending && <p>{t("v02.analysisPending")}</p>}
      {analysis.status === "PARTIAL" && <p>{t("v02.analysisPartial")}</p>}
      {previous && <p role="status">{t("v02.analysisPreviousEvidence")}</p>}
      {analysis.error && <TaskErrorView error={analysis.error} />}
      {!result && !pending && analysis.status !== "NOT_REQUESTED" && (
        <EmptyState embedded title={t("v02.analysisUnavailable")} />
      )}
      <dl className="grid gap-3 text-xs sm:grid-cols-2">
        <div>
          <dt>{t("v02.analysisId")}</dt>
          <dd className="font-mono break-all">
            {analysis.analysisId ?? t("v.unavailable")}
          </dd>
        </div>
        <div>
          <dt>{t("v02.revision")}</dt>
          <dd>{analysis.revision}</dd>
        </div>
      </dl>
      {result && <StaticAnalysisEvidence result={result} previous={previous} />}
      <Separator />
      <section className="flex flex-col gap-2" aria-labelledby={synthesisTitle}>
        <h3 id={synthesisTitle} className="font-medium">
          {t("v02.synthesis")}
        </h3>
        <Badge variant="secondary" className="self-start">
          {t("v02.analysis.NOT_REQUESTED")}
        </Badge>
        <p className="text-sm text-muted-foreground">
          {t("v02.synthesisNotRequested")}
        </p>
      </section>
    </Panel>
  );
}

export function StaticAnalysisEvidence({
  result,
  previous = false,
}: {
  result: StaticAnalysisResult;
  previous?: boolean;
}) {
  const { t, locale } = useLocale();
  const titleId = useId();
  const number = (value: number | null) =>
    value === null
      ? t("v.unavailable")
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
          value,
        );
  return (
    <div
      className="flex min-w-0 flex-col gap-5"
      data-analysis-evidence={previous ? "previous" : "current"}
    >
      <section
        className="flex flex-col gap-3"
        aria-labelledby={`${titleId}-metrics`}
      >
        <h3 id={`${titleId}-metrics`} className="font-medium">
          {t("v02.metrics")}
        </h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric}>
              <dt className="text-muted-foreground">
                {t(`v02.metric.${metric}`)}
              </dt>
              <dd>{number(result.metrics[metric])}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">{t("v02.metricCaveat")}</p>
      </section>
      <Separator />
      <section
        className="flex flex-col gap-3"
        aria-labelledby={`${titleId}-findings`}
      >
        <h3 id={`${titleId}-findings`} className="font-medium">
          {t("v02.findings")}
        </h3>
        {result.findings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("v02.noFindings")}</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {result.findings.map((finding) => (
              <li
                key={finding.findingId}
                className="flex min-w-0 flex-col gap-2 rounded-lg border p-3 wrap-anywhere"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    wrap
                    variant={
                      finding.severity === "ERROR"
                        ? "destructive"
                        : finding.severity === "WARNING"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {t(`v02.findingSeverity.${finding.severity}`)}
                  </Badge>
                  <Badge variant="outline" wrap>
                    {t(`v02.findingCategory.${finding.category}`)}
                  </Badge>
                  <span className="text-xs">
                    {finding.tool} · <code>{finding.ruleId}</code>
                  </span>
                </div>
                <p>{finding.message}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {t("v02.findingLocation", {
                    file: finding.file,
                    start: String(finding.startLine),
                    end: String(finding.endLine),
                  })}
                  {finding.column !== null &&
                    ` · ${t("v02.findingColumn", { column: String(finding.column) })}`}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
      <Separator />
      <section
        className="flex flex-col gap-3"
        aria-labelledby={`${titleId}-tools`}
      >
        <h3 id={`${titleId}-tools`} className="font-medium">
          {t("v02.tools")}
        </h3>
        {result.tools.length === 0 ? (
          <p>{t("v02.noTools")}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {result.tools.map((tool, index) => (
              <li
                key={`${tool.tool}:${index}`}
                className="flex min-w-0 flex-col gap-3 rounded-lg border p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-medium wrap-anywhere">{tool.tool}</h4>
                  <Badge
                    wrap
                    variant={tool.status === "FAILED" ? "warning" : "secondary"}
                  >
                    {t(`v02.tool.${tool.status}`)}
                  </Badge>
                </div>
                <dl className="grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <dt>{t("v02.toolVersion")}</dt>
                    <dd className="wrap-anywhere">{tool.version}</dd>
                  </div>
                  <div>
                    <dt>{t("v02.toolDuration")}</dt>
                    <dd>{number(tool.durationMs)} ms</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt>{t("v02.toolConfig")}</dt>
                    <dd className="font-mono break-all">{tool.configSha256}</dd>
                  </div>
                </dl>
                {tool.error && <TaskErrorView error={tool.error} />}
              </li>
            ))}
          </ul>
        )}
      </section>
      <DetailsDisclosure title={t("v02.reproducibility")} variant="panel">
        <dl className="grid gap-4 text-xs sm:grid-cols-2">
          <div>
            <dt>{t("v02.evidenceAnalysisId")}</dt>
            <dd className="font-mono break-all">{result.analysisId}</dd>
          </div>
          <div>
            <dt>{t("v02.submissionId")}</dt>
            <dd className="font-mono break-all">{result.submissionId}</dd>
          </div>
          <div>
            <dt>{t("v02.schemaVersion")}</dt>
            <dd>{result.schemaVersion}</dd>
          </div>
          <div>
            <dt>{t("v.language")}</dt>
            <dd>{result.languageId}</dd>
          </div>
          <div>
            <dt>{t("v02.toolchainVersion")}</dt>
            <dd className="wrap-anywhere">{result.toolchainVersion}</dd>
          </div>
          <div>
            <dt>{t("v02.resultHash")}</dt>
            <dd className="font-mono break-all">{result.resultHash}</dd>
          </div>
          <div>
            <dt>{t("v02.sourceSha256")}</dt>
            <dd className="font-mono break-all">{result.sourceSha256}</dd>
          </div>
          <div>
            <dt>{t("v02.imageDigest")}</dt>
            <dd className="font-mono break-all">
              {result.reproducibility.imageDigest}
            </dd>
          </div>
          <div>
            <dt>{t("v02.analysisConfig")}</dt>
            <dd className="font-mono break-all">
              {result.reproducibility.configSha256}
            </dd>
          </div>
          <div>
            <dt>{t("v02.reproductionSource")}</dt>
            <dd className="font-mono break-all">
              {result.reproducibility.sourceSha256}
            </dd>
          </div>
        </dl>
      </DetailsDisclosure>
    </div>
  );
}
