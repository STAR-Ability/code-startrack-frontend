"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Code2Icon,
  InfoIcon,
  PlayIcon,
  RefreshCwIcon,
  SendIcon,
  TerminalIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/errors";
import { v02 } from "@/lib/api/v02";
import type {
  CreateSubmissionInput,
  LanguageCapabilities,
  PlatformProblemDetail,
} from "@/lib/api/v02-schemas";
import { useV02Mutation } from "@/lib/query/v02-hooks";
import { isCurrentUser } from "@/lib/query/session";
import { useWorkspaceSession } from "../account-provider";
import { EmptyState, ErrorNotice, useSlowRequest } from "../feedback";
import { CodeEditor, type CodeEditorHandle } from "./code-editor";
import { SampleValue } from "./problem-statement";
import {
  problemDraftKey,
  problemLanguages,
  sourceValidation,
} from "./problem-state";

export function ProblemEditor({
  problem,
  capabilities,
  refreshProblem,
  refreshLanguages,
  refreshing = false,
  trainingRecordId,
}: {
  problem: PlatformProblemDetail;
  capabilities: LanguageCapabilities;
  refreshProblem: () => void;
  refreshLanguages: () => void;
  refreshing?: boolean;
  trainingRecordId?: string;
}) {
  const { t } = useLocale();
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const router = useRouter();
  const languageId = useId();
  const sourceInput = useRef<CodeEditorHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const consoleToggle = useRef<HTMLButtonElement>(null);
  const [consoleLimit, setConsoleLimit] = useState(180);
  const resizeStart = useRef<{ y: number; height: number } | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(140);
  const [sampleIndex, setSampleIndex] = useState(0);
  const languages = problemLanguages(problem, capabilities.languages);
  const initialLanguage =
    languages.find((language) => language.languageId === "cpp17") ??
    languages[0];
  const [draft, setDraft] = useState(() => ({
    version: problem.problemRef.problemVersionId,
    language: initialLanguage?.languageId ?? "",
    source:
      user && initialLanguage
        ? (client.getQueryData<string>(
            problemDraftKey(user.publicId, problem, initialLanguage.languageId),
          ) ?? "")
        : "",
  }));
  const [showValidation, setShowValidation] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const selected = languages.find(
    (language) => language.languageId === draft.language,
  );
  if (draft.version !== problem.problemRef.problemVersionId) {
    setDraft({ ...draft, version: problem.problemRef.problemVersionId });
    setRefreshed(true);
  }
  useEffect(() => {
    if (user && draft.language && isCurrentUser(client, user.publicId))
      client.setQueryData(
        problemDraftKey(user.publicId, problem, draft.language),
        draft.source,
      );
  }, [client, user, problem, draft.language, draft.source]);

  const mutation = useV02Mutation(
    "submission-create",
    (body: CreateSubmissionInput, key) => v02.createSubmission(body, key),
    (submission) => {
      router.push(
        `/submissions/detail?submissionId=${encodeURIComponent(submission.submissionId)}`,
      );
    },
  );
  useSlowRequest(mutation.isPending);
  const invalidSource = sourceValidation(draft.source);
  const sourceError =
    invalidSource && (showValidation || invalidSource === "large")
      ? t(
          invalidSource === "blank"
            ? "v02.problem.blankSource"
            : "v02.problem.largeSource",
        )
      : undefined;
  const errorCode =
    mutation.error instanceof ApiError ? mutation.error.code : null;
  const errorMessage =
    errorCode === "PROBLEM_VERSION_CONFLICT"
      ? "v02.problem.versionConflict"
      : errorCode === "PROBLEM_NOT_SUBMITTABLE" ||
          errorCode === "PROBLEM_NOT_FOUND"
        ? "v02.problem.notSubmittable"
        : errorCode === "LANGUAGE_NOT_SUPPORTED"
          ? "v02.problem.languageRemoved"
          : errorCode === "REQUEST_IN_PROGRESS"
            ? "v02.problem.requestInProgress"
            : errorCode === "IDEMPOTENCY_CONFLICT"
              ? "v02.problem.idempotencyConflict"
              : ["NETWORK_ERROR", "TIMEOUT"].includes(errorCode ?? "")
                ? "v02.problem.retryUncertain"
                : "v02.problem.submitFailure";
  const student =
    user?.roles.includes("STUDENT") && user.accountStatus === "ACTIVE";
  const blocked =
    mutation.blocked ||
    refreshing ||
    !selected ||
    problem.status !== "PUBLISHED" ||
    !student;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowValidation(true);
    if (invalidSource) {
      sourceInput.current?.focus();
      return;
    }
    if (blocked) return;
    mutation.mutate({
      problemRef: problem.problemRef,
      languageId: draft.language,
      sourceCode: draft.source,
      ...(trainingRecordId ? { trainingRecordId } : {}),
    });
  }

  function changeLanguage(next: string) {
    if (!user) return;
    const saved = client.getQueryData<string>(
      problemDraftKey(user.publicId, problem, next),
    );
    setDraft({
      ...draft,
      language: next,
      source: saved ?? (!selected ? draft.source : ""),
    });
    setShowValidation(false);
    mutation.reset();
  }

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const measure = () => {
      const fixed = Array.from(form.children)
        .filter(
          (child) =>
            !child.classList.contains("code-editor-field") &&
            !child.classList.contains("editor-console"),
        )
        .reduce(
          (height, child) => height + child.getBoundingClientRect().height,
          0,
        );
      const chrome = Array.from(
        form.querySelectorAll(".console-header, .console-resizer"),
      ).reduce(
        (height, child) => height + child.getBoundingClientRect().height,
        0,
      );
      setConsoleLimit(
        Math.max(
          100,
          Math.min(320, Math.floor(form.clientHeight - fixed - chrome - 240)),
        ),
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(form);
    return () => observer.disconnect();
  }, [mutation.error, mutation.isPending, refreshed, selected]);

  if (!student)
    return (
      <Alert>
        <AlertDescription>{t("v02.problem.studentRequired")}</AlertDescription>
      </Alert>
    );

  const activeSampleIndex = Math.min(
    sampleIndex,
    Math.max(0, problem.samples.length - 1),
  );
  const sample = problem.samples[activeSampleIndex];
  const status = mutation.isPending
    ? "pending"
    : mutation.error
      ? "error"
      : blocked
        ? "unavailable"
        : "ready";

  return (
    <section
      className="problem-editor-panel"
      aria-labelledby="problem-editor-title"
    >
      <header className="editor-heading editor-language-toolbar">
        <h2 id="problem-editor-title" className="sr-only">
          {t("v02.problem.editor")}
        </h2>
        <Field
          data-disabled={mutation.isPending || refreshing}
          data-invalid={!!draft.language && !selected}
        >
          <FieldLabel
            htmlFor={languageId}
            className="sr-only"
            style={{ width: "1px" }}
          >
            {t("v02.problem.language")}
          </FieldLabel>
          <NativeSelect
            id={languageId}
            value={draft.language}
            disabled={mutation.isPending || refreshing || !languages.length}
            onChange={(event) => changeLanguage(event.target.value)}
            aria-invalid={!!draft.language && !selected}
            aria-describedby={`${languageId}-description`}
            className="w-full min-w-0"
          >
            {!selected && (
              <NativeSelectOption value={draft.language}>
                {draft.language || t("v02.problem.noLanguages")}
              </NativeSelectOption>
            )}
            {languages.map((language) => (
              <NativeSelectOption
                key={language.languageId}
                value={language.languageId}
              >
                {language.displayName} · {language.compilerVersion}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription
            id={`${languageId}-description`}
            className="sr-only"
            style={{ width: "1px" }}
          >
            {selected
              ? `${t("v02.problem.compiler")}: ${selected.compilerVersion} · ${t("v02.problem.filename")}: ${selected.sourceFilename}`
              : t("v02.problem.languageRemoved")}
          </FieldDescription>
        </Field>
        <div className="flex flex-wrap items-center gap-1">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("v02.problem.editorDescription")}
                  title={t("v02.problem.editorDescription")}
                />
              }
            >
              <InfoIcon />
            </PopoverTrigger>
            <PopoverContent align="end">
              <PopoverTitle>{t("v02.problem.draftMemory")}</PopoverTitle>
              <p className="text-xs text-muted-foreground">
                {t("v02.problem.editorDescription")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("v02.problem.keyboardHint")}
              </p>
              {selected?.analysisSupported && (
                <Badge variant="outline" wrap>
                  {t("v02.problem.analysisSupported")}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                {t("v02.problem.capabilityVersion")}
              </p>
              <code className="text-xs wrap-anywhere">
                {capabilities.capabilityVersion}
              </code>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("v02.problem.refreshLanguages")}
            title={t("v02.problem.refreshLanguages")}
            disabled={refreshing || mutation.isPending}
            onClick={refreshLanguages}
          >
            <RefreshCwIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("v02.problem.refreshProblem")}
            title={t("v02.problem.refreshProblem")}
            disabled={refreshing || mutation.isPending}
            onClick={() => {
              if (
                [
                  "PROBLEM_VERSION_CONFLICT",
                  "PROBLEM_NOT_SUBMITTABLE",
                  "PROBLEM_NOT_FOUND",
                ].includes(errorCode ?? "")
              )
                mutation.reset();
              refreshProblem();
            }}
            wrap
          >
            <Code2Icon />
          </Button>
        </div>
      </header>
      {!languages.length && (
        <EmptyState
          embedded
          title={t("v02.problem.noLanguages")}
          description={t("v02.problem.noLanguagesDescription")}
        />
      )}
      <form ref={formRef} onSubmit={submit} className="editor-form">
        {selected && !selected.analysisSupported && (
          <p className="editor-notice">
            {t("v02.problem.analysisUnavailable")}
          </p>
        )}
        <CodeEditor
          languageId={draft.language}
          inputRef={sourceInput}
          source={draft.source}
          filename={selected?.sourceFilename ?? draft.language}
          languageFamily={selected?.languageFamily}
          onChange={(source) => {
            setDraft({ ...draft, source });
            if (mutation.error) mutation.reset();
          }}
          error={sourceError}
          disabled={mutation.isPending || refreshing}
        />
        <section
          className="editor-console"
          aria-labelledby={`${languageId}-console-title`}
        >
          {consoleOpen && (
            <div
              role="separator"
              tabIndex={0}
              className="console-resizer"
              aria-label={t("v02.problem.resizeResults")}
              aria-orientation="horizontal"
              aria-controls={`${languageId}-console`}
              aria-valuemin={100}
              aria-valuemax={consoleLimit}
              aria-valuenow={Math.min(consoleHeight, consoleLimit)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  setConsoleOpen(false);
                  consoleToggle.current?.focus();
                  return;
                }
                const next =
                  event.key === "ArrowUp"
                    ? consoleHeight + 20
                    : event.key === "ArrowDown"
                      ? consoleHeight - 20
                      : event.key === "Home"
                        ? 100
                        : event.key === "End"
                          ? consoleLimit
                          : null;
                if (next !== null) {
                  event.preventDefault();
                  setConsoleHeight(Math.min(consoleLimit, Math.max(100, next)));
                }
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                resizeStart.current = {
                  y: event.clientY,
                  height: Math.min(consoleHeight, consoleLimit),
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (
                  !event.currentTarget.hasPointerCapture(event.pointerId) ||
                  !resizeStart.current
                )
                  return;
                setConsoleHeight(
                  Math.round(
                    Math.min(
                      consoleLimit,
                      Math.max(
                        100,
                        resizeStart.current.height +
                          resizeStart.current.y -
                          event.clientY,
                      ),
                    ),
                  ),
                );
              }}
              onPointerUp={(event) => {
                resizeStart.current = null;
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
            />
          )}
          <div className="console-header">
            <h3 id={`${languageId}-console-title`}>
              <TerminalIcon className="size-4 text-info" aria-hidden="true" />
              {t("v02.problem.console")}
            </h3>
            <div className="flex items-center gap-2">
              {problem.samples.length > 1 && (
                <NativeSelect
                  aria-label={t("v02.problem.samples")}
                  size="sm"
                  value={activeSampleIndex}
                  onChange={(event) =>
                    setSampleIndex(Number(event.target.value))
                  }
                >
                  {problem.samples.map((_, index) => (
                    <NativeSelectOption key={index} value={index}>
                      {t("v02.problem.sample", { number: String(index + 1) })}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                ref={consoleToggle}
                aria-expanded={consoleOpen}
                aria-controls={`${languageId}-console`}
                aria-label={t(
                  consoleOpen
                    ? "v02.problem.collapseConsole"
                    : "v02.problem.expandConsole",
                )}
                title={t(
                  consoleOpen
                    ? "v02.problem.collapseConsole"
                    : "v02.problem.expandConsole",
                )}
                onClick={() => setConsoleOpen(!consoleOpen)}
              >
                {consoleOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
              </Button>
            </div>
          </div>
          <div
            id={`${languageId}-console`}
            hidden={!consoleOpen}
            className="console-body"
            style={{ height: Math.min(consoleHeight, consoleLimit) }}
          >
            {sample ? (
              <div className="sample-pair">
                <SampleValue
                  value={sample.input}
                  kind="input"
                  label={`${t("v02.problem.console")} · ${t("v02.problem.sampleInput")}`}
                />
                <SampleValue
                  value={sample.output}
                  kind="output"
                  label={`${t("v02.problem.console")} · ${t("v02.problem.expected")}`}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("v02.problem.noSamples")}
              </p>
            )}
            <div className="console-output">
              <span>{t("v02.problem.actual")}</span>
              <Badge variant="secondary">{t("v02.problem.notRun")}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("v02.problem.resultHint")}
            </p>
          </div>
        </section>
        {(refreshed || mutation.error) && (
          <div className="editor-feedback">
            {refreshed && (
              <p role="status" className="mb-2 text-xs text-muted-foreground">
                {t("v02.problem.versionRefreshed")}
              </p>
            )}
            {mutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  <p role="alert">{t(errorMessage)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      "PROBLEM_VERSION_CONFLICT",
                      "PROBLEM_NOT_SUBMITTABLE",
                      "PROBLEM_NOT_FOUND",
                    ].includes(errorCode ?? "") && (
                      <Button
                        type="button"
                        variant="outline"
                        wrap
                        onClick={() => {
                          mutation.reset();
                          refreshProblem();
                        }}
                        disabled={refreshing}
                      >
                        {t("v02.problem.refreshProblem")}
                      </Button>
                    )}
                    {errorCode === "LANGUAGE_NOT_SUPPORTED" && (
                      <Button
                        type="button"
                        variant="outline"
                        wrap
                        onClick={refreshLanguages}
                        disabled={refreshing}
                      >
                        {t("v02.problem.refreshLanguages")}
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <ErrorNotice
              error={mutation.error}
              pending={mutation.isPending}
              compact
            />
          </div>
        )}
        <div className="editor-actionbar">
          <span
            className="editor-actionbar-status"
            data-state={status}
            role="status"
          >
            {t(
              status === "pending"
                ? "v02.problem.statusPending"
                : status === "error"
                  ? "v02.problem.statusError"
                  : status === "unavailable"
                    ? "v02.problem.statusUnavailable"
                    : "v02.problem.statusReady",
            )}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled
              aria-describedby={`${languageId}-run-unavailable`}
            >
              <PlayIcon data-icon="inline-start" />
              {t("v02.problem.run")}
            </Button>
            <Button
              type="submit"
              size="lg"
              wrap
              disabled={
                blocked ||
                invalidSource === "large" ||
                errorCode === "IDEMPOTENCY_CONFLICT"
              }
            >
              {mutation.isPending ? (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              ) : (
                <SendIcon data-icon="inline-start" aria-hidden="true" />
              )}
              {t(
                mutation.isPending
                  ? "v02.problem.submitting"
                  : mutation.error
                    ? "v02.problem.retrySubmission"
                    : "v02.problem.submit",
              )}
            </Button>
          </div>
        </div>
        <div className="editor-notice flex flex-wrap items-center justify-between gap-2">
          <p id={`${languageId}-run-unavailable`}>
            {t("v02.problem.runUnavailable")}
          </p>
          <Link href="/submissions" className="underline underline-offset-4">
            {t("v02.problem.submissions")}
          </Link>
        </div>
      </form>
    </section>
  );
}
