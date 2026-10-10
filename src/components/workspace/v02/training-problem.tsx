"use client";
import Link from "next/link";
import { ExternalLinkIcon, PlusIcon } from "lucide-react";
import { v02 } from "@/lib/api/v02";
import type {
  CreateTrainingRecordInput,
  ProblemSummary,
  TrainingRecord,
} from "@/lib/api/v02-schemas";
import { useV02Mutation } from "@/lib/query/v02-hooks";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ErrorNotice } from "../feedback";
import { learningProblemHref } from "./learning-model";

export function TrainingProblem({
  problem,
  link = false,
}: {
  problem: ProblemSummary;
  link?: boolean;
}) {
  const { t } = useLocale();
  const title =
    problem.title ??
    `${problem.problemRef.platform} · ${problem.problemRef.problemId}`;
  const href = learningProblemHref(problem);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="wrap-anywhere font-medium">
        {link && href ? (
          <Link
            className="auth-text-link"
            href={href}
            target={
              problem.problemRef.source === "EXTERNAL" ? "_blank" : undefined
            }
            rel={
              problem.problemRef.source === "EXTERNAL"
                ? "noopener noreferrer"
                : undefined
            }
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge wrap variant="outline">
          {t(`v02.source.${problem.problemRef.source}`)}
        </Badge>
        <Badge wrap variant="secondary">
          {t(`v02.scale.${problem.difficultyScale}`)}
          {problem.difficulty !== null && ` · ${problem.difficulty}`}
        </Badge>
        {problem.tags.map((tag) => (
          <Badge key={tag} variant="outline" wrap>
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function TrainingProblemAction({
  problem,
  record,
}: {
  problem: ProblemSummary;
  record?: TrainingRecord;
}) {
  const { t } = useLocale();
  const href = learningProblemHref(problem);
  if (!href)
    return (
      <p className="text-sm text-muted-foreground">
        {t("v02.externalUrlMissing")}
      </p>
    );
  return (
    <Link
      href={
        record && problem.problemRef.source === "PLATFORM"
          ? `${href}&trainingRecordId=${record.trainingRecordId}`
          : href
      }
      target={problem.problemRef.source === "EXTERNAL" ? "_blank" : undefined}
      rel={
        problem.problemRef.source === "EXTERNAL"
          ? "noopener noreferrer"
          : undefined
      }
      className={buttonVariants({ variant: "outline", wrap: true })}
    >
      {t(
        problem.problemRef.source === "EXTERNAL"
          ? "v02.externalProblem"
          : "v02.continueTraining",
      )}
      {problem.problemRef.source === "EXTERNAL" && (
        <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
      )}
    </Link>
  );
}

export function TrainingPlanAction({
  problem,
  batchId,
}: {
  problem: ProblemSummary;
  batchId?: string;
}) {
  const { t } = useLocale();
  const body: CreateTrainingRecordInput = {
    problemRef: problem.problemRef,
    ...(batchId ? { recommendationBatchId: batchId } : {}),
  };
  const mutation = useV02Mutation(
    "create-training",
    (input: CreateTrainingRecordInput, key) =>
      v02.createTrainingRecord(input, key),
  );
  return (
    <div className="flex flex-col gap-3">
      <ErrorNotice
        error={mutation.error}
        retry={() => mutation.mutate(body)}
        pending={mutation.isPending}
      />
      {mutation.data ? (
        <>
          <p role="status">{t("v02.planned")}</p>
          <div className="flex flex-wrap gap-2">
            <TrainingProblemAction problem={problem} record={mutation.data} />
            <Link
              href={`/training/detail?trainingRecordId=${mutation.data.trainingRecordId}`}
              className={buttonVariants({ variant: "ghost", wrap: true })}
            >
              {t("v02.viewTraining")}
            </Link>
          </div>
        </>
      ) : (
        <Button
          wrap
          className="self-start"
          disabled={mutation.blocked}
          onClick={() => mutation.mutate(body)}
        >
          {mutation.isPending && <Spinner aria-hidden="true" />}
          {!mutation.isPending && (
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
          )}
          {t("v02.plan")}
        </Button>
      )}
      {problem.problemRef.source === "EXTERNAL" && (
        <p className="text-sm text-muted-foreground">
          {t("v02.externalCompletionNote")}
        </p>
      )}
    </div>
  );
}
