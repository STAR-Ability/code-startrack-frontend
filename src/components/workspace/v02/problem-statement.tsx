"use client";

import Link from "next/link";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
import { Separator } from "@/components/ui/separator";
import type { PlatformProblemDetail } from "@/lib/api/v02-schemas";
import { ProblemDifficulty } from "./problem-bank-page";
import { problemHref } from "./problem-state";
import { SafeMarkdown, safeStatementUrl } from "./safe-markdown";

export function ProblemStatement({
  problem,
  historical = false,
}: {
  problem: PlatformProblemDetail;
  historical?: boolean;
}) {
  const { t } = useLocale();
  const sourceUrl = safeStatementUrl(problem.license.sourceUrl);
  return (
    <article className="flex min-w-0 flex-col gap-5 rounded-xl border bg-card p-5 sm:p-6">
      <header className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          #{problem.problemRef.problemId}
        </p>
        <h2 className="text-2xl font-semibold wrap-anywhere">
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
        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">
              {t("v02.problem.timeLimit")}
            </dt>
            <dd className="font-medium tabular-nums">
              {problem.timeLimitMs} ms
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
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
      <section aria-label={t("v02.problem.statement")}>
        <h3 className="sr-only">{t("v02.problem.statement")}</h3>
        <SafeMarkdown
          content={problem.statement.content}
          codeLabel={`${t("v02.problem.statement")} · ${t("v02.problem.codeBlock")}`}
          tableLabel={`${t("v02.problem.statement")} · ${t("v02.problem.statementTable")}`}
        />
      </section>
      {problem.statement.input !== null && (
        <section aria-labelledby="problem-input">
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
        <section aria-labelledby="problem-output">
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
            <div key={index} className="flex min-w-0 flex-col gap-2">
              <h4 className="text-sm font-medium">
                {t("v02.problem.sample", { number: String(index + 1) })}
              </h4>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                {(["input", "output"] as const).map((kind) => (
                  <div key={kind} className="min-w-0">
                    <p className="mb-2 text-xs text-muted-foreground">
                      {t(
                        kind === "input"
                          ? "v02.problem.sampleInput"
                          : "v02.problem.sampleOutput",
                      )}
                    </p>
                    <pre
                      tabIndex={0}
                      role="region"
                      aria-label={`${t("v02.problem.sample", { number: String(index + 1) })} · ${t(kind === "input" ? "v02.problem.sampleInput" : "v02.problem.sampleOutput")}`}
                      className="max-w-full overflow-auto rounded-lg bg-muted p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <code>{sample[kind]}</code>
                    </pre>
                  </div>
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
      <DetailsDisclosure title={t("v02.problem.license")}>
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t("v02.problem.spdx")}</dt>
            <dd>
              {problem.license.spdxId ?? t("v02.problem.unspecifiedLicense")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("v02.problem.notice")}</dt>
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
    </article>
  );
}
