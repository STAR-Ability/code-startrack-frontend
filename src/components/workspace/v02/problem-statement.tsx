"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpenIcon,
  CheckIcon,
  Clock3Icon,
  CopyIcon,
  CpuIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { PlatformProblemDetail } from "@/lib/api/v02-schemas";
import { ProblemDifficulty } from "./problem-bank-page";
import { problemHref } from "./problem-state";
import { SafeMarkdown, safeStatementUrl } from "./safe-markdown";

export function SampleValue({
  value,
  kind,
  label,
}: {
  value: string;
  kind: "input" | "output";
  label: string;
}) {
  const { t } = useLocale();
  const [copyState, setCopyState] = useState<{
    value: string;
    status: "success" | "error";
  } | null>(null);
  const copied = copyState?.value === value ? copyState.status : null;
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState({ value, status: "success" });
    } catch {
      setCopyState({ value, status: "error" });
    }
  }
  return (
    <div className="sample-value">
      <div className="sample-value-label">
        <span>
          {t(
            kind === "input"
              ? "v02.problem.sampleInput"
              : "v02.problem.expected",
          )}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t(
            kind === "input"
              ? "v02.problem.copyInput"
              : "v02.problem.copyOutput",
          )}
          title={t(
            kind === "input"
              ? "v02.problem.copyInput"
              : "v02.problem.copyOutput",
          )}
          onClick={() => void copy()}
        >
          {copied === "success" ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>
      <pre
        tabIndex={0}
        role="region"
        aria-label={label}
        className="max-w-full overflow-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <code>{value}</code>
      </pre>
      {copied && (
        <span role="status" className="px-3 pb-2 text-xs text-muted-foreground">
          {t(
            copied === "success"
              ? "v02.problem.copied"
              : "v02.problem.copyFailed",
          )}
        </span>
      )}
    </div>
  );
}

export function ProblemStatement({
  problem,
  historical = false,
}: {
  problem: PlatformProblemDetail;
  historical?: boolean;
}) {
  const { t } = useLocale();
  const sourceUrl = safeStatementUrl(problem.license.sourceUrl);
  const firstHeading =
    /^(?:[ \t]*\r?\n)* {0,3}#{1,6}[ \t]+([^\r\n]+)(?:\r?\n|$)/.exec(
      problem.statement.content,
    );
  const content =
    problem.title && firstHeading?.[1].trim() === problem.title.trim()
      ? problem.statement.content.slice(firstHeading[0].length)
      : problem.statement.content;
  return (
    <article className="problem-statement-panel">
      <nav
        className="workspace-pane-tabs"
        aria-label={t("v02.problem.statement")}
      >
        <a href="#problem-description">
          <BookOpenIcon className="size-4" aria-hidden="true" />
          {t("v02.problem.statement")}
        </a>
        <a href="#problem-samples">{t("v02.problem.samples")}</a>
        <a href="#problem-license">{t("v02.problem.license")}</a>
      </nav>
      <div className="statement-body">
        <header id="problem-description" className="statement-heading">
          <p className="text-sm text-muted-foreground">
            #{problem.problemRef.problemId}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight wrap-anywhere">
            {problem.title ?? t("v02.problem.untitled")}
          </h2>
          <div className="flex flex-wrap gap-2">
            <ProblemDifficulty problem={problem} />
            <Badge
              variant={problem.status === "PUBLISHED" ? "outline" : "warning"}
            >
              {t(`v02.problem.${problem.status}`)}
            </Badge>
            {problem.tags.map((tag) => (
              <Badge key={tag} variant="outline" wrap>
                {tag}
              </Badge>
            ))}
          </div>
          <dl className="statement-limits">
            <div>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Clock3Icon className="size-3.5" aria-hidden="true" />
                {t("v02.problem.timeLimit")}
              </dt>
              <dd className="font-medium tabular-nums">
                {problem.timeLimitMs} ms
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <CpuIcon className="size-3.5" aria-hidden="true" />
                {t("v02.problem.memoryLimit")}
              </dt>
              <dd className="font-medium tabular-nums">
                {problem.memoryLimitBytes} B
              </dd>
            </div>
          </dl>
        </header>
        {historical && (
          <Alert>
            <AlertDescription>
              <p>{t("v02.problem.historyNotice")}</p>
              <Link
                href={problemHref(problem.problemRef.problemId)}
                className="underline underline-offset-4"
              >
                {t("v02.problem.currentVersion")}
              </Link>
            </AlertDescription>
          </Alert>
        )}
        {problem.status !== "PUBLISHED" && (
          <Alert>
            <AlertDescription>
              {t("v02.problem.withdrawnNotice")}
            </AlertDescription>
          </Alert>
        )}
        <section
          className="statement-section"
          aria-label={t("v02.problem.statement")}
        >
          <h3 className="sr-only">{t("v02.problem.statement")}</h3>
          <SafeMarkdown
            content={content}
            codeLabel={`${t("v02.problem.statement")} · ${t("v02.problem.codeBlock")}`}
            tableLabel={`${t("v02.problem.statement")} · ${t("v02.problem.statementTable")}`}
          />
        </section>
        {problem.statement.input !== null && (
          <section
            className="statement-section"
            aria-labelledby="problem-input"
          >
            <h3 id="problem-input" className="font-semibold">
              {t("v02.problem.input")}
            </h3>
            <SafeMarkdown
              content={problem.statement.input}
              codeLabel={`${t("v02.problem.input")} · ${t("v02.problem.codeBlock")}`}
              tableLabel={`${t("v02.problem.input")} · ${t("v02.problem.statementTable")}`}
            />
          </section>
        )}
        {problem.statement.output !== null && (
          <section
            className="statement-section"
            aria-labelledby="problem-output"
          >
            <h3 id="problem-output" className="font-semibold">
              {t("v02.problem.output")}
            </h3>
            <SafeMarkdown
              content={problem.statement.output}
              codeLabel={`${t("v02.problem.output")} · ${t("v02.problem.codeBlock")}`}
              tableLabel={`${t("v02.problem.output")} · ${t("v02.problem.statementTable")}`}
            />
          </section>
        )}
        <Separator />
        <section
          className="flex min-w-0 flex-col gap-3"
          aria-labelledby="problem-samples"
        >
          <h3 id="problem-samples" className="font-semibold">
            {t("v02.problem.samples")}
          </h3>
          {problem.samples.length ? (
            problem.samples.map((sample, index) => (
              <div key={index} className="statement-sample">
                <h4 className="sample-heading">
                  {t("v02.problem.sample", { number: String(index + 1) })}
                </h4>
                <div className="sample-pair">
                  {(["input", "output"] as const).map((kind) => (
                    <SampleValue
                      key={kind}
                      kind={kind}
                      value={sample[kind]}
                      label={`${t("v02.problem.sample", { number: String(index + 1) })} · ${t(kind === "input" ? "v02.problem.sampleInput" : "v02.problem.sampleOutput")}`}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("v02.problem.noSamples")}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("v02.problem.sampleNotice")}
          </p>
        </section>
        <Separator />
        <div id="problem-license">
          <DetailsDisclosure title={t("v02.problem.license")}>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">
                  {t("v02.problem.spdx")}
                </dt>
                <dd>
                  {problem.license.spdxId ??
                    t("v02.problem.unspecifiedLicense")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("v02.problem.notice")}
                </dt>
                <dd className="whitespace-pre-wrap wrap-anywhere">
                  {problem.license.notice}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("v02.problem.version")}
                </dt>
                <dd className="font-mono text-xs wrap-anywhere">
                  {problem.problemRef.problemVersionId}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("v02.problem.catalogVersion")}
                </dt>
                <dd className="font-mono text-xs">{problem.catalogVersion}</dd>
              </div>
            </dl>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-link underline underline-offset-4"
              >
                {t("v02.problem.source")}
              </a>
            ) : (
              <p className="mt-3 text-xs wrap-anywhere">
                {problem.license.sourceUrl}
              </p>
            )}
          </DetailsDisclosure>
        </div>
      </div>
    </article>
  );
}
