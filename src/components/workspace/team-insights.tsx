"use client";
import { useState, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v012 } from "@/lib/api/v012";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentUser } from "@/lib/query/session";
import type {
  TeamAnalysisDto,
  TeamDetailDto,
  TeamAnalysisAudience,
  TeamRecommendationBatchDto,
  TeamRecommendationMode,
} from "@/lib/api/v012-schemas";
import { trendOption } from "@/lib/charts/options";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Panel, AiJobNotice, useTeamQuery } from "./v012-shared";
import {
  EmptyState,
  ErrorNotice,
  Pagination,
  QueryFeedback,
  useCountdown,
} from "./feedback";
import { Chart } from "./chart";
import { MetricPanel } from "./metric-panel";
import { useAccounts } from "./account-provider";
import { ProblemLink } from "./recommendation-card";
import { isAiJobPending } from "./use-ai-job";
export function TeamAnalysisView({ analysis }: { analysis: TeamAnalysisDto }) {
  const { t } = useLocale();
  const dimensions = [...analysis.dimensions].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  return (
    <>
      <MetricPanel
        title="v12.teamAnalysis"
        description={t(`v12.audience.${analysis.audience}`)}
        metrics={[
          [
            "v12.included",
            `${analysis.includedMemberCount} / ${analysis.memberCount}`,
          ],
          ["v12.excluded", analysis.excludedMemberCount],
          ["v12.trainingMembers", analysis.trainingMemberCount],
          ["v12.levelMembers", analysis.levelMemberCount],
        ]}
        secondary={[
          ["v12.targetRating", analysis.targetRating],
          [
            "v.overallScore",
            analysis.includedMemberCount ? analysis.overallScore : null,
          ],
          [
            "v.weakest",
            analysis.includedMemberCount
              ? t(`data.dimension.${analysis.weakestDimension}`)
              : "—",
          ],
        ]}
      />
      {analysis.stale && (
        <Alert>
          <AlertDescription>{t("v12.staleNote")}</AlertDescription>
        </Alert>
      )}
      <Panel title="v.dimensions">
        {analysis.includedMemberCount === 0 ? (
          <EmptyState title={t("v12.noAbilitySharing")} />
        ) : (
          <>
            <Chart
              label={t("v.dimensions")}
              palette="ability"
              option={{
                radar: {
                  indicator: dimensions.map((dimension) => ({
                    name: t(`data.dimension.${dimension.code}`),
                    max: 100,
                  })),
                  radius: "52%",
                  axisName: {
                    fontSize: 10,
                    formatter: (name = "") => name.replaceAll(" ", "\n"),
                  },
                },
                series: [
                  {
                    type: "radar",
                    data: [
                      { value: dimensions.map((dimension) => dimension.score) },
                    ],
                  },
                ],
              }}
            />
            <dl className="grid gap-3 sm:grid-cols-2">
              {dimensions.map((dimension) => (
                <div
                  key={dimension.code}
                  className="flex flex-wrap justify-between gap-2"
                >
                  <dt>
                    {t(`data.dimension.${dimension.code}`)}
                    {dimension.code === analysis.weakestDimension && (
                      <Badge variant="outline" className="ml-2">
                        {t("v.weakest")}
                      </Badge>
                    )}
                  </dt>
                  <dd>
                    {dimension.score} / 100 · {dimension.memberSampleCount}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </Panel>
      <Panel title="v12.teamActivity">
        {analysis.trainingMemberCount === 0 ? (
          <EmptyState title={t("v12.noTrainingSharing")} />
        ) : analysis.activityStats.length ? (
          <>
            <Chart
              label={t("v12.teamActivity")}
              palette="activity"
              option={trendOption(
                analysis.activityStats.map((item) => item.date),
                [
                  {
                    name: t("v.submissions"),
                    values: analysis.activityStats.map(
                      (item) => item.submissionCount,
                    ),
                  },
                  {
                    name: t("v.accepted"),
                    values: analysis.activityStats.map(
                      (item) => item.acceptedSubmissionCount,
                    ),
                  },
                  {
                    name: t("v12.activeMembers"),
                    values: analysis.activityStats.map(
                      (item) => item.activeMemberCount,
                    ),
                  },
                ],
              )}
            />
            <dl className="flex flex-col gap-2">
              {analysis.activityStats.map((item) => (
                <div
                  key={item.date}
                  className="flex flex-wrap justify-between gap-2"
                >
                  <dt>{item.date}</dt>
                  <dd>
                    {t("v.submissions")}: {item.submissionCount} ·{" "}
                    {t("v.accepted")}: {item.acceptedSubmissionCount} ·{" "}
                    {t("v12.activeMembers")}: {item.activeMemberCount}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <EmptyState title={t("v.noRecords")} />
        )}
      </Panel>
      {analysis.levelMemberCount === 0 && (
        <Alert>
          <AlertDescription>{t("v12.noLevel")}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
export function TeamBatchView({
  batch,
}: {
  batch: TeamRecommendationBatchDto;
}) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-3" data-team-audience={batch.audience}>
      <p>
        {t(`v12.audience.${batch.audience}`)} · {t("v12.targetRating")}:{" "}
        {batch.targetRating} · {t(`data.dimension.${batch.targetDimension}`)}
      </p>
      <p>
        {t("v.candidateCount")}: {batch.candidateCount} · {t("v.resultCount")}:{" "}
        {batch.resultCount}
      </p>
      {batch.stale && <Badge variant="warning">{t("v.stale")}</Badge>}
      {batch.recommendations.length === 0 && (
        <EmptyState
          title={t("v12.candidateShortage")}
          description={t("v.noCandidates")}
        />
      )}{" "}
      {batch.recommendations.map((item) => {
        return (
          <article
            key={item.rank}
            className="flex flex-col gap-2 border-b py-3 last:border-0"
          >
            <h3 className="break-words font-medium">
              {item.rank}.{" "}
              {item.problem.title ?? item.problem.externalProblemKey}
            </h3>
            <p>
              {item.problem.difficulty ?? t("v.unrated")} · {item.score}
            </p>
            <p className="break-words">{item.reason}</p>
            <div className="flex flex-wrap gap-2">
              {item.problem.tags.map((tag) => (
                <Badge key={tag} wrap variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <ProblemLink problem={item.problem} />
          </article>
        );
      })}
    </div>
  );
}
export function TeamInsights({ team }: { team: TeamDetailDto }) {
  const { t } = useLocale();
  const { user } = useAccounts();
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const latest = useTeamQuery(
    team.teamId,
    "analysis",
    {
      endpoint: "latest",
      membershipRole: team.myMembershipRole,
      canManage: team.canManage,
    },
    (signal) => v012.teamAnalysis(team.teamId, signal),
  );
  const history = useTeamQuery(
    team.teamId,
    "analysis",
    {
      endpoint: "history",
      page,
      membershipRole: team.myMembershipRole,
      canManage: team.canManage,
    },
    (signal) => v012.teamAnalysisHistory(team.teamId, { page }, signal),
  );
  const displayed = snapshotId
    ? history.data?.data.find((item) => item.snapshotId === snapshotId)
    : latest.data;
  const [jobId, setJobId] = useState<string | null>(null);
  const mutation = useMutation({
    meta: { publicId: user.publicId, v012: true },
    mutationFn: () => v012.rebuildTeam(team.teamId),
    onSuccess: (job) => {
      if (!isCurrentUser(client, user.publicId)) return;
      client.setQueryData(keys.aiJob(user.publicId, job.jobId), job);
      setJobId(job.jobId);
    },
  });
  const job = useQuery({
    queryKey: keys.aiJob(user.publicId, jobId ?? "none"),
    queryFn: ({ signal }) => v012.aiJob(jobId!, signal),
    enabled: false,
  });
  const remaining = useCountdown(
    mutation.error instanceof ApiError ? mutation.error.retryAt : 0,
  );
  return (
    <>
      <QueryFeedback query={latest} />
      {team.canManage && team.status !== "DISSOLVED" && (
        <Button
          wrap
          className="self-start"
          disabled={
            mutation.isPending ||
            remaining > 0 ||
            (mutation.error instanceof ApiError &&
              mutation.error.status === 403) ||
            isAiJobPending(jobId, job.data, job.error)
          }
          onClick={() => mutation.mutate()}
        >
          {t("v12.rebuildTeam")}
        </Button>
      )}
      <ErrorNotice error={mutation.error} />
      <AiJobNotice jobId={jobId} teamId={team.teamId} />
      {displayed ? (
        <TeamAnalysisView analysis={displayed} />
      ) : (
        !latest.isFetching && <EmptyState title={t("v12.noTeamAnalysis")} />
      )}
      <Panel title="v12.teamHistory">
        <QueryFeedback query={history} />
        {history.data?.data.map((item) => (
          <div
            key={item.snapshotId}
            className="flex flex-wrap justify-between gap-3"
          >
            <span>
              {item.createdAt} · {item.includedMemberCount}/{item.memberCount}
            </span>
            <Button
              wrap
              variant="outline"
              onClick={() => setSnapshotId(item.snapshotId)}
            >
              {t("v.snapshot")}
            </Button>
          </div>
        ))}
        {snapshotId && (
          <Button wrap variant="outline" onClick={() => setSnapshotId(null)}>
            {t("v.latest")}
          </Button>
        )}
        <Pagination
          meta={history.data?.meta}
          page={page}
          setPage={(value) => {
            setPage(value);
            setSnapshotId(null);
          }}
          pending={history.isFetching}
        />
      </Panel>
      <TeamRecommendations
        key={`${team.teamId}:${team.canManage}`}
        team={team}
        levelReady={latest.data ? latest.data.levelMemberCount > 0 : false}
      />
    </>
  );
}
function TeamRecommendations({
  team,
  levelReady,
}: {
  team: TeamDetailDto;
  levelReady: boolean;
}) {
  const { t } = useLocale();
  const { user } = useAccounts();
  const client = useQueryClient();
  const id = useId();
  const [audience, setAudience] = useState<TeamAnalysisAudience>(
    team.canManage ? "COACH" : "MEMBER",
  );
  const [mode, setMode] = useState<TeamRecommendationMode>("HYBRID");
  const [page, setPage] = useState(1);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const latest = useTeamQuery(
    team.teamId,
    "recommendations",
    { endpoint: "latest", audience, mode },
    (signal) => v012.teamRecommendations(team.teamId, audience, mode, signal),
  );
  const history = useTeamQuery(
    team.teamId,
    "recommendations",
    { endpoint: "history", audience, mode, page },
    (signal) =>
      v012.teamRecommendationHistory(
        team.teamId,
        audience,
        mode,
        { page },
        signal,
      ),
  );
  const detail = useTeamQuery(
    team.teamId,
    "recommendations",
    { endpoint: "detail", audience, batchId },
    (signal) => v012.teamBatch(team.teamId, batchId!, audience, signal),
    !!batchId,
  );
  const mutation = useMutation({
    meta: { publicId: user.publicId, v012: true },
    mutationFn: () =>
      v012.generateTeamRecommendations(team.teamId, { audience, mode }),
    onSuccess: (job) => {
      if (!isCurrentUser(client, user.publicId)) return;
      client.setQueryData(keys.aiJob(user.publicId, job.jobId), job);
      setJobId(job.jobId);
    },
  });
  const job = useQuery({
    queryKey: keys.aiJob(user.publicId, jobId ?? "none"),
    queryFn: ({ signal }) => v012.aiJob(jobId!, signal),
    enabled: false,
  });
  const remaining = useCountdown(
    mutation.error instanceof ApiError ? mutation.error.retryAt : 0,
  );
  const displayed = batchId ? detail : latest;
  return (
    <Panel title="v12.teamRecommendations">
      <div className="flex flex-wrap gap-3">
        {team.canManage && (
          <Field className="max-w-sm">
            <FieldLabel htmlFor={`${id}-audience`}>
              {t("v12.audience")}
            </FieldLabel>
            <NativeSelect
              id={`${id}-audience`}
              value={audience}
              onChange={(event) => {
                setAudience(event.target.value as TeamAnalysisAudience);
                setPage(1);
                setBatchId(null);
              }}
            >
              {(["MEMBER", "COACH"] as const).map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {t(`v12.audience.${value}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        )}
        <Field className="max-w-sm">
          <FieldLabel htmlFor={`${id}-mode`}>{t("v.mode")}</FieldLabel>
          <NativeSelect
            id={`${id}-mode`}
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as TeamRecommendationMode);
              setPage(1);
              setBatchId(null);
            }}
          >
            <NativeSelectOption value="HYBRID">
              {t("v.mode.HYBRID")}
            </NativeSelectOption>
            <NativeSelectOption value="WEAKNESS">
              {t("v.mode.WEAKNESS")}
            </NativeSelectOption>
          </NativeSelect>
        </Field>
      </div>
      {!levelReady && <p>{t("v12.noLevel")}</p>}
      {team.canManage && team.status === "ACTIVE" && (
        <Button
          wrap
          className="self-start"
          disabled={
            !levelReady ||
            mutation.isPending ||
            remaining > 0 ||
            (mutation.error instanceof ApiError &&
              mutation.error.status === 403) ||
            isAiJobPending(jobId, job.data, job.error)
          }
          onClick={() => mutation.mutate()}
        >
          {t("v12.generateTeam")}
        </Button>
      )}
      <ErrorNotice error={mutation.error} />
      <AiJobNotice jobId={jobId} teamId={team.teamId} />
      <QueryFeedback query={displayed} />
      {displayed.data && <TeamBatchView batch={displayed.data} />}
      <QueryFeedback query={history} />
      {history.data?.data.map((item) => (
        <div
          key={item.batchId}
          className="flex flex-wrap justify-between gap-2"
        >
          <time dateTime={item.generatedAt}>{item.generatedAt}</time>
          <Button
            wrap
            variant="outline"
            onClick={() => setBatchId(item.batchId)}
          >
            {t("v12.open")}
          </Button>
        </div>
      ))}
      {batchId && (
        <Button wrap variant="outline" onClick={() => setBatchId(null)}>
          {t("v.latest")}
        </Button>
      )}
      <Pagination
        meta={history.data?.meta}
        page={page}
        setPage={setPage}
        pending={history.isFetching}
      />
    </Panel>
  );
}
