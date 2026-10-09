"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCwIcon, SendIcon } from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
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
import { CodeEditor } from "./code-editor";
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
  const sourceInput = useRef<HTMLTextAreaElement>(null);
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

  if (!student)
    return (
      <Alert>
        <AlertDescription>{t("v02.problem.studentRequired")}</AlertDescription>
      </Alert>
    );

  return (
    <section
      className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6"
      aria-labelledby="problem-editor-title"
    >
      <div className="flex flex-col gap-2">
        <h2 id="problem-editor-title" className="text-xl font-semibold">
          {t("v02.problem.editor")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("v02.problem.editorDescription")}
        </p>
      </div>
      {!languages.length && (
        <EmptyState
          embedded
          title={t("v02.problem.noLanguages")}
          description={t("v02.problem.noLanguagesDescription")}
        />
      )}
      <form onSubmit={submit} className="min-w-0">
        <FieldGroup className="min-w-0">
          <Field
            className="min-w-0"
            data-disabled={mutation.isPending || refreshing}
            data-invalid={!!draft.language && !selected}
          >
            <FieldLabel
              htmlFor={languageId}
              className="max-w-full wrap-anywhere"
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
            <FieldDescription id={`${languageId}-description`}>
              {selected
                ? `${t("v02.problem.compiler")}: ${selected.compilerVersion} · ${t("v02.problem.filename")}: ${selected.sourceFilename}`
                : t("v02.problem.languageRemoved")}
            </FieldDescription>
          </Field>
          {selected &&
            (selected.analysisSupported ? (
              <Badge variant="outline" wrap className="self-start">
                {t("v02.problem.analysisSupported")}
              </Badge>
            ) : (
              <Alert>
                <AlertDescription>
                  {t("v02.problem.analysisUnavailable")}
                </AlertDescription>
              </Alert>
            ))}
          <CodeEditor
            inputRef={sourceInput}
            source={draft.source}
            filename={selected?.sourceFilename ?? draft.language}
            onChange={(source) => {
              setDraft({ ...draft, source });
              if (mutation.error) mutation.reset();
            }}
            error={sourceError}
            disabled={mutation.isPending || refreshing}
          />
          <Field className="min-w-0">
            {refreshed && (
              <p role="status" className="text-sm text-muted-foreground">
                {t("v02.problem.versionRefreshed")}
              </p>
            )}
            {mutation.error && (
              <Alert>
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
            <div className="flex flex-wrap items-center gap-3">
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
              <Link
                href="/submissions"
                className="text-sm underline underline-offset-4"
              >
                {t("v02.problem.submissions")}
              </Link>
            </div>
          </Field>
        </FieldGroup>
      </form>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          wrap
          disabled={refreshing || mutation.isPending}
          onClick={refreshLanguages}
        >
          <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
          {t("v02.problem.refreshLanguages")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          wrap
          disabled={refreshing || mutation.isPending}
          onClick={() => {
            refreshProblem();
          }}
        >
          {t("v02.problem.refreshProblem")}
        </Button>
      </div>
      <DetailsDisclosure title={t("v02.problem.capabilityVersion")}>
        <p className="text-xs font-mono wrap-anywhere">
          {capabilities.capabilityVersion}
        </p>
      </DetailsDisclosure>
    </section>
  );
}
