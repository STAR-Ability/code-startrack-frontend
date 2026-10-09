"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  GripVerticalIcon,
  Maximize2Icon,
  PanelsLeftBottomIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { v02 } from "@/lib/api/v02";
import { idSchema, uuidSchema } from "@/lib/api/schemas";
import type { PlatformProblemDetail } from "@/lib/api/v02-schemas";
import { useV02Query } from "@/lib/query/v02-hooks";
import { deniedV02 } from "@/lib/query/v02";
import { useWorkspaceSession } from "../account-provider";
import { EmptyState, QueryFeedback } from "../feedback";
import { ProblemStatement } from "./problem-statement";
import { ProblemEditor } from "./problem-editor";
import "./problem-workspace.css";

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
  const [split, setSplit] = useState(43);
  const [focused, setFocused] = useState(false);
  const workspace = useRef<HTMLDivElement>(null);
  const focusToggle = useRef<HTMLButtonElement>(null);
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
      {!problem && (
        <Link
          href="/problems"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            wrap: true,
          })}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          {t("v02.problem.back")}
        </Link>
      )}
      <QueryFeedback query={query} />
      {!query.data && problem && query.error && (
        <Alert>
          <AlertDescription>
            {t("v02.problem.previousStatement")}
          </AlertDescription>
        </Alert>
      )}
      {problem && (
        <div className="coding-workspace" data-focused={focused}>
          <nav
            className="workspace-titlebar"
            aria-label={t("v02.problem.workspace")}
          >
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <Link
                href="/problems"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  wrap: true,
                })}
              >
                <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
                {t("v02.problem.back")}
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  wrap
                  onClick={() => {
                    setSplit(43);
                    setFocused(false);
                  }}
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  {t("v02.problem.resetLayout")}
                </Button>
                <Button
                  ref={focusToggle}
                  type="button"
                  variant="outline"
                  size="sm"
                  wrap
                  aria-pressed={focused}
                  onClick={() => setFocused(!focused)}
                >
                  {focused ? (
                    <PanelsLeftBottomIcon data-icon="inline-start" />
                  ) : (
                    <Maximize2Icon data-icon="inline-start" />
                  )}
                  {t(
                    focused
                      ? "v02.problem.restoreLayout"
                      : "v02.problem.focusEditor",
                  )}
                </Button>
              </div>
            </div>
          </nav>
          <div
            ref={workspace}
            className="problem-workspace-grid"
            style={{ "--statement-width": `${split}%` } as CSSProperties}
          >
            <div id="workspace-statement" className="workspace-statement">
              <ProblemStatement
                problem={problem}
                historical={activeVersion !== null}
              />
            </div>
            <div
              role="separator"
              tabIndex={0}
              aria-label={t("v02.problem.resizeStatement")}
              aria-orientation="vertical"
              aria-controls="workspace-statement"
              aria-valuemin={30}
              aria-valuemax={60}
              aria-valuenow={split}
              className="workspace-splitter"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  setFocused(!focused);
                  const input = workspace.current?.querySelector<HTMLElement>(
                    'textarea:not(:disabled), [role="textbox"][contenteditable="true"]',
                  );
                  (input ?? focusToggle.current)?.focus();
                  return;
                }
                const step = event.shiftKey ? 10 : 2;
                const next =
                  event.key === "ArrowLeft"
                    ? split - step
                    : event.key === "ArrowRight"
                      ? split + step
                      : event.key === "Home"
                        ? 30
                        : event.key === "End"
                          ? 60
                          : null;
                if (next !== null) {
                  event.preventDefault();
                  setSplit(Math.min(60, Math.max(30, next)));
                }
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (
                  !event.currentTarget.hasPointerCapture(event.pointerId) ||
                  !workspace.current
                )
                  return;
                const rect = workspace.current.getBoundingClientRect();
                setSplit(
                  Math.round(
                    Math.min(
                      60,
                      Math.max(
                        30,
                        ((event.clientX - rect.left) / rect.width) * 100,
                      ),
                    ),
                  ),
                );
              }}
              onPointerUp={(event) =>
                event.currentTarget.releasePointerCapture(event.pointerId)
              }
            >
              <GripVerticalIcon className="size-4" aria-hidden="true" />
            </div>
            <div className="workspace-code">
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
        </div>
      )}
    </div>
  );
}
