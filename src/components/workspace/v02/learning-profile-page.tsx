"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { v02 } from "@/lib/api/v02";
import { uuidSchema, type AnalysisWindow } from "@/lib/api/schemas";
import {
  useV02LatestProfile,
  useV02Mutation,
  useV02ProfileJob,
  useV02Query,
} from "@/lib/query/v02-hooks";
import { useLocale } from "@/components/layout/locale-provider";
import { formatTimestamp } from "@/lib/i18n/locale";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useWorkspaceSession } from "../account-provider";
import { WindowSelector } from "../analysis-page";
import {
  EmptyState,
  ErrorNotice,
  Pagination,
  QueryFeedback,
} from "../feedback";
import { Panel } from "../v012-shared";
import { LearningProfileView } from "./learning-profile-view";
import { isLearningProfileJobPending } from "./learning-model";

export function LearningProfileRebuild() {
  const { t } = useLocale();
  const [jobId, setJobId] = useState<string | null>(null);
  const mutation = useV02Mutation(
    "rebuild-profile",
    (_: void, key) => v02.rebuildProfile(key),
    (job) => setJobId(job.jobId),
  );
  const job = useV02ProfileJob(jobId);
  const active = isLearningProfileJobPending(jobId, job.data, job.error);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button
          wrap
          disabled={mutation.blocked || active}
          onClick={() => mutation.mutate()}
        >
          {(mutation.isPending || active) && <Spinner aria-hidden="true" />}
          {t(mutation.isPending || active ? "v02.rebuilding" : "v02.rebuild")}
        </Button>
      </div>
      <ErrorNotice
        error={mutation.error}
        retry={() => mutation.mutate()}
        pending={mutation.isPending}
      />
      {!!jobId && <QueryFeedback query={job} compact />}
      {job.data && (
        <Alert>
          <AlertDescription>
            <p role="status">{t(`v02.profileJob.${job.data.status}`)}</p>
            {job.data.error && (
              <p>
                {job.data.error.code} · {job.data.error.message}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function LearningProfilePage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { data: user } = useWorkspaceSession();
  const raw = useSearchParams().get("snapshotId");
  const valid = uuidSchema.safeParse(raw);
  const [window, setWindow] = useState<AnalysisWindow>("ALL");
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<string | null>(
    valid.success ? valid.data : null,
  );
  const [selectionUrl, setSelectionUrl] = useState(raw);
  const [ignoreInvalid, setIgnoreInvalid] = useState(false);
  if (selectionUrl !== raw) {
    setSelectionUrl(raw);
    setSelection(valid.success ? valid.data : null);
    setIgnoreInvalid(false);
  }
  const publicId = user?.publicId ?? "";
  const latest = useV02LatestProfile(window, !selection);
  const history = useV02Query("learning-history", { window, page }, (signal) =>
    v02.learningHistory(publicId, window, { page }, signal),
  );
  const snapshot = useV02Query(
    "learning-snapshot",
    { snapshotId: selection },
    (signal) => v02.learningSnapshot(publicId, selection!, signal),
    !!selection,
  );
  const current = selection ? snapshot : latest;
  const invalid = !!raw && !valid.success && !ignoreInvalid;
  return (
    <>
      <p className="text-muted-foreground">{t("v02.learningNote")}</p>
      <LearningProfileRebuild />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WindowSelector
          value={window}
          onChange={(next) => {
            setWindow(next);
            setPage(1);
            setSelection(null);
            setIgnoreInvalid(true);
            router.replace("/learning-profile", { scroll: false });
          }}
        />
        {(selection || invalid) && (
          <Link
            href="/learning-profile"
            className={buttonVariants({ variant: "outline", wrap: true })}
            onClick={() => {
              setSelection(null);
              setIgnoreInvalid(true);
            }}
          >
            {t("v02.latest")}
          </Link>
        )}
      </div>
      {selection && (
        <p className="text-sm">
          {t("v02.snapshot")} ·{" "}
          {current.data ? t(`v.window.${current.data.window}`) : selection}
        </p>
      )}
      {invalid ? (
        <EmptyState title={t("v02.invalidSnapshotId")} />
      ) : (
        <>
          <QueryFeedback query={current} />
          {current.data ? (
            <LearningProfileView profile={current.data} />
          ) : (
            current.data === null && (
              <EmptyState
                title={t("v02.profileNull")}
                description={t("v02.profileNullNote")}
              />
            )
          )}
        </>
      )}
      <Panel title="v02.history" description={t(`v.window.${window}`)}>
        <QueryFeedback query={history} />
        {history.data?.data.length === 0 && (
          <EmptyState embedded title={t("v.noRecords")} />
        )}
        {history.data?.data.map((item) => (
          <div
            key={item.snapshotId}
            className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <time dateTime={item.dataCutoffAt}>
                {formatTimestamp(item.dataCutoffAt, locale)}
              </time>
              <p className="text-sm text-muted-foreground">
                {t("v.overallScore")}: {item.overallScore} / 100 ·{" "}
                {t("v.submissions")}: {item.summary.submissionCount}
                {item.stale && (
                  <>
                    {" "}
                    · <Badge variant="warning">{t("v.stale")}</Badge>
                  </>
                )}
              </p>
            </div>
            <Link
              href={`/learning-profile?snapshotId=${item.snapshotId}`}
              scroll={false}
              className={buttonVariants({ variant: "outline", wrap: true })}
              onClick={() => {
                setSelection(item.snapshotId);
                setIgnoreInvalid(true);
              }}
            >
              {t("v02.viewSnapshot")}
            </Link>
          </div>
        ))}
        <Pagination
          meta={history.data?.meta}
          page={page}
          setPage={setPage}
          pending={history.isFetching}
        />
      </Panel>
    </>
  );
}
