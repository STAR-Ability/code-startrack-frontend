"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { v02 } from "@/lib/api/v02";
import { idSchema, uuidSchema } from "@/lib/api/schemas";
import type { PlatformProblemDetail } from "@/lib/api/v02-schemas";
import { useV02Query } from "@/lib/query/v02-hooks";
import { deniedV02 } from "@/lib/query/v02";
import { useWorkspaceSession } from "../account-provider";
import { EmptyState, QueryFeedback } from "../feedback";
import { ProblemStatement } from "./problem-statement";
import { ProblemEditor } from "./problem-editor";

export function ProblemDetailPage() {
  const params = useSearchParams();
  const { t } = useLocale();
  const { data: user } = useWorkspaceSession();
  const problemId = params.get("problemId") ?? "";
  const versionId = params.get("problemVersionId");
  const trainingRecordId = params.get("trainingRecordId");
  if (
    !idSchema.safeParse(problemId).success ||
    (versionId !== null && !uuidSchema.safeParse(versionId).success) ||
    (trainingRecordId !== null &&
      !uuidSchema.safeParse(trainingRecordId).success)
  )
    return (
      <EmptyState
        title={t("v02.problem.invalidRoute")}
        description={t("v02.problem.invalidRouteDescription")}
        href="/problems"
        action={t("v02.problem.back")}
      />
    );
  return (
    <ProblemDetailContent
      key={`${user?.publicId}:${problemId}:${versionId ?? "current"}`}
      problemId={problemId}
      versionId={versionId}
      trainingRecordId={trainingRecordId ?? undefined}
    />
  );
}

function ProblemDetailContent({
  problemId,
  versionId,
  trainingRecordId,
}: {
  problemId: string;
  versionId: string | null;
  trainingRecordId?: string;
}) {
  const { t } = useLocale();
  const [activeVersion, setActiveVersion] = useState(versionId);
  const [previous, setPrevious] = useState<PlatformProblemDetail>();
  const query = useV02Query(
    "problem",
    { problemId, problemVersionId: activeVersion },
    (signal) =>
      activeVersion
        ? v02.problemVersion(problemId, activeVersion, signal)
        : v02.problem(problemId, signal),
  );
  const languages = useV02Query("judge-languages", {}, (signal) =>
    v02.languages(signal),
  );
  if (query.data && query.data !== previous) setPrevious(query.data);
  const problem =
    query.data ?? (!deniedV02(query.error) ? previous : undefined);

  function refreshCurrent() {
    setActiveVersion(null);
    if (activeVersion === null) void query.refetch();
    void languages.refetch();
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Link
        href="/problems"
        className="max-w-full self-start text-sm wrap-anywhere underline underline-offset-4"
      >
        {t("v02.problem.back")}
      </Link>
      <QueryFeedback query={query} />
      {!query.data && problem && query.error && (
        <Alert>
          <AlertDescription>
            {t("v02.problem.previousStatement")}
          </AlertDescription>
        </Alert>
      )}
      {problem && (
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-2">
          <ProblemStatement
            problem={problem}
            historical={activeVersion !== null}
          />
          <div className="flex min-w-0 flex-col gap-4">
            <QueryFeedback query={languages} />
            {languages.data && (
              <ProblemEditor
                problem={problem}
                capabilities={languages.data}
                refreshing={
                  query.isFetching || languages.isFetching || !query.data
                }
                refreshProblem={refreshCurrent}
                refreshLanguages={() => void languages.refetch()}
                trainingRecordId={trainingRecordId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
