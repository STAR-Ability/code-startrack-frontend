"use client";
import { Fragment, useState, useId } from "react";
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
import { radarOption, trendOption } from "@/lib/charts/options";
import { formatTimestamp } from "@/lib/i18n/locale";
import { useLocale } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";
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
import { CompatibilityNotice } from "./compatibility-notice";
export function TeamAnalysisView({
  analysis,
  historical = false,
}: {
  analysis: TeamAnalysisDto;
  historical?: boolean;
}) {
  const { t, locale } = useLocale();
  const number = (value: number) =>
    new Intl.NumberFormat(locale, {
      maximumSignificantDigits: 21,
    }).format(value);
  const dimensions = [...analysis.dimensions].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  return (
    <>
      <CompatibilityNotice
        version={analysis.algorithmVersion}
        family="team-profile"
      />
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {t(`v12.audience.${analysis.audience}`)}
          </p>
          {historical && (
            <Badge variant="outline" wrap>
              {t("v12.teamHistoricalAnalysis")}
            </Badge>
          )}
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <div className="flex min-w-0 flex-wrap gap-x-2">
            <dt>{t("v.cutoff")}:</dt>
            <dd>
              <time dateTime={analysis.dataCutoffAt}>
                {formatTimestamp(analysis.dataCutoffAt, locale)}
              </time>
            </dd>
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-2">
            <dt>{t("v.createdAt")}:</dt>
            <dd>
              <time dateTime={analysis.createdAt}>
                {formatTimestamp(analysis.createdAt, locale)}
              </time>
            </dd>
          </div>
        </dl>
      </div>
      <MetricPanel
        title="v12.teamAnalysis"
        metrics={[
          [
            "v12.included",
            `${number(analysis.includedMemberCount)} / ${number(analysis.memberCount)}`,
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
      <Panel
        title="v.dimensions"
        variant="analysis"
        className="@container/ability"
      >
        {analysis.includedMemberCount === 0 ? (
          <EmptyState embedded title={t("v12.noAbilitySharing")} />
        ) : (
          <div className="analysis-ability-content">
            <div className="analysis-ability-chart">
              <Chart
                label={t("v.dimensions")}
                palette="ability"
                size="ability"
                option={radarOption(
                  dimensions.map((dimension) => ({
                    name: t(`data.dimension.${dimension.code}`),
                    score: dimension.score,
                  })),
                  t("v.overallScore"),
                )}
              />
            </div>
            <dl className="analysis-dimension-list">
              {dimensions.map((dimension) => (
                <div
                  key={dimension.code}
                  className="analysis-dimension-row"
                  data-weakest={dimension.code === analysis.weakestDimension}
                >
                  <dt>
                    {t(`data.dimension.${dimension.code}`)}
                    {dimension.code === analysis.weakestDimension && (
                      <Badge variant="outline" wrap>
                        {t("v.weakest")}
                      </Badge>
                    )}
                  </dt>
                  <dd className="flex min-w-0 flex-col gap-1 @min-[14rem]/dimension-values:items-end">
                    <span className="font-mono tabular-nums">
                      {number(dimension.score)} / {number(100)}
                    </span>
                    <span className="font-sans text-xs text-muted-foreground">
                      {t("v12.dimensionSamples")}:{" "}
                      {number(dimension.memberSampleCount)}
                    </span>
                  </dd>
                  <dd aria-hidden="true" className="analysis-dimension-track">
                    <div
                      className="analysis-dimension-fill"
                      style={{ width: `${dimension.score}%` }}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Panel>
      <Panel title="v12.teamActivity">
        {analysis.trainingMemberCount === 0 ? (
          <EmptyState embedded title={t("v12.noTrainingSharing")} />
        ) : analysis.activityStats.length ? (
          <>
            <Chart
              label={t("v12.teamActivity")}
              palette="teamActivity"
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
            <DetailsDisclosure
              title={t("metrics.chartValues")}
              keepMounted={false}
            >
              <dl className="flex flex-col gap-2">
                {analysis.activityStats.map((item) => (
                  <div
                    key={item.date}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <dt>
                      <time dateTime={item.date}>{item.date}</time>
                    </dt>
                    <dd>
                      {t("v.submissions")}: {item.submissionCount} ·{" "}
                      {t("v.accepted")}: {item.acceptedSubmissionCount} ·{" "}
                      {t("v12.activeMembers")}: {item.activeMemberCount}
                    </dd>
                  </div>
                ))}
              </dl>
            </DetailsDisclosure>
          </>
        ) : (
          <EmptyState embedded title={t("v.noRecords")} />
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
  historical = false,
}: {
  batch: TeamRecommendationBatchDto;
  historical?: boolean;
}) {
  const { t, locale } = useLocale();
  const number = (value: number) =>
    new Intl.NumberFormat(locale, {
      maximumSignificantDigits: 21,
    }).format(value);
  return (
    <div className="flex flex-col gap-3" data-team-audience={batch.audience}>
      <CompatibilityNotice
        version={batch.algorithmVersion}
        family="team-recommendation"
      />
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {t(`v12.audience.${batch.audience}`)}
          </p>
          {historical && (
            <Badge variant="outline" wrap>
              {t("v12.teamHistoricalBatch")}
            </Badge>
          )}
        </div>
        <dl className="text-xs text-muted-foreground">
          <div className="flex min-w-0 flex-wrap gap-x-2">
            <dt>{t("v.createdAt")}:</dt>
            <dd>
              <time dateTime={batch.generatedAt}>
                {formatTimestamp(batch.generatedAt, locale)}
              </time>
            </dd>
          </div>
        </dl>
      </div>
      <p>
        {t("v12.targetRating")}: {number(batch.targetRating)} ·{" "}
        {t(`data.dimension.${batch.targetDimension}`)}
      </p>
      <p>
        {t("v.candidateCount")}: {number(batch.candidateCount)} ·{" "}
        {t("v.resultCount")}: {number(batch.resultCount)}
      </p>
      {batch.stale && <Badge variant="warning">{t("v.stale")}</Badge>}
      {batch.recommendations.length === 0 && (
        <EmptyState
          embedded
          title={t("v12.candidateShortage")}
          description={t("v.noCandidates")}
        />
      )}
      {batch.recommendations.map((item, index) => {
        const primary = index === 0;
        if (primary)
          return (
            <Card
              key={item.rank}
              variant="recommendation"
              size="lg"
              interaction="none"
              className="recommendation-card @container/recommendation"
              data-recommendation-rank={item.rank}
            >
              <CardHeader>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="info" wrap>
                    {t("v12.primaryRecommendation")}
                  </Badge>
                </div>
                <CardTitle>
                  <h3 className="recommendation-heading recommendation-title">
                    <span className="recommendation-rank">
                      #{number(item.rank)}
                    </span>
                    <span className="min-w-0 wrap-anywhere">
                      {item.problem.title ?? item.problem.externalProblemKey}
                    </span>
                  </h3>
                </CardTitle>
                <CardDescription>
                  <span className="wrap-anywhere">
                    {item.problem.externalProblemKey}
                  </span>
                  {" · Codeforces"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="recommendation-content recommendation-content-featured">
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="recommendation-reason">
                      <h4 className="text-xs font-medium text-info">
                        {t("recommendation.reason")}
                      </h4>
                      <p className="wrap-anywhere">{item.reason}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.problem.tags.map((tag) => (
                        <Badge key={tag} wrap variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="recommendation-action-panel">
                    <dl className="recommendation-facts grid-cols-1 @sm/recommendation:grid-cols-2">
                      <div>
                        <dt>{t("v12.problemDifficulty")}</dt>
                        <dd>
                          {item.problem.difficulty === null
                            ? t("v.unrated")
                            : number(item.problem.difficulty)}
                        </dd>
                      </div>
                      <div>
                        <dt>{t("v12.recommendationScore")}</dt>
                        <dd className="wrap-anywhere">{number(item.score)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-wrap gap-3">
                <ProblemLink problem={item.problem} primary />
              </CardFooter>
            </Card>
          );
        return (
          <Fragment key={item.rank}>
            {index === 1 && (
              <div className="recommendation-queue-heading">
                <h3>{t("recommendation.moreOptions")}</h3>
                <p>{t("recommendation.orderNote")}</p>
              </div>
            )}
            <article
              className="flex min-w-0 flex-col gap-2 py-3"
              data-recommendation-rank={item.rank}
            >
              <h4 className="recommendation-heading font-medium">
                <span className="recommendation-rank">
                  #{number(item.rank)}
                </span>
                <span className="min-w-0 wrap-anywhere">
                  {item.problem.title ?? item.problem.externalProblemKey}
                </span>
              </h4>
              <p className="text-xs wrap-anywhere text-muted-foreground">
                {item.problem.externalProblemKey} · Codeforces
              </p>
              <p>
                {t("v12.problemDifficulty")}:{" "}
                {item.problem.difficulty === null
                  ? t("v.unrated")
                  : number(item.problem.difficulty)}{" "}
                · {t("v12.recommendationScore")}: {number(item.score)}
              </p>
              <p className="wrap-anywhere">{item.reason}</p>
              <div className="flex flex-wrap gap-2">
                {item.problem.tags.map((tag) => (
                  <Badge key={tag} wrap variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap">
                <ProblemLink problem={item.problem} />
              </div>
            </article>
            {index < batch.recommendations.length - 1 && <Separator />}
          </Fragment>
        );
      })}
    </div>
  );
}
export function TeamInsights({ team }: { team: TeamDetailDto }) {
  const { t, locale } = useLocale();
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
        <TeamAnalysisView analysis={displayed} historical={!!snapshotId} />
      ) : (
        !latest.isFetching &&
        !latest.error && <EmptyState title={t("v12.noTeamAnalysis")} />
      )}
      <Panel title="v12.teamHistory">
        <QueryFeedback query={history} />
        {history.data?.data.map((item) => (
          <div
            key={item.snapshotId}
            className="flex flex-wrap justify-between gap-3"
          >
            <span>
              <time dateTime={item.createdAt}>
                {formatTimestamp(item.createdAt, locale)}
              </time>{" "}
              · {item.includedMemberCount}/{item.memberCount}
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
    </>
  );
}
export function TeamRecommendations({ team }: { team: TeamDetailDto }) {
  const analysis = useTeamQuery(
    team.teamId,
    "analysis",
    {
      endpoint: "latest",
      membershipRole: team.myMembershipRole,
      canManage: team.canManage,
    },
    (signal) => v012.teamAnalysis(team.teamId, signal),
  );
  const levelReady = !!analysis.data && analysis.data.levelMemberCount > 0;
  const { t, locale } = useLocale();
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
    <section
      className="flex min-w-0 flex-col gap-4"
      aria-label={t("v12.teamRecommendations")}
    >
      <h2 className="section-heading">{t("v12.teamRecommendations")}</h2>
      <div className="flex flex-wrap gap-3">
        {team.canManage && (
          <Field className="max-w-sm">
            <FieldLabel htmlFor={`${id}-audience`}>
              {t("v12.audience")}
            </FieldLabel>
            <ChoiceSelect
              id={`${id}-audience`}
              value={audience}
              onValueChange={(value) => {
                setAudience(value as TeamAnalysisAudience);
                setPage(1);
                setBatchId(null);
              }}
              options={(["MEMBER", "COACH"] as const).map((value) => ({
                value,
                label: t(`v12.audience.${value}`),
              }))}
            />
          </Field>
        )}
        <Field className="max-w-sm">
          <FieldLabel htmlFor={`${id}-mode`}>{t("v.mode")}</FieldLabel>
          <ChoiceSelect
            id={`${id}-mode`}
            value={mode}
            onValueChange={(value) => {
              setMode(value as TeamRecommendationMode);
              setPage(1);
              setBatchId(null);
            }}
            options={(["HYBRID", "WEAKNESS"] as const).map((value) => ({
              value,
              label: t(`v.mode.${value}`),
            }))}
          />
        </Field>
      </div>
      <QueryFeedback query={analysis} />
      {!analysis.isFetching && !analysis.error && !levelReady && (
        <p>{t("v12.noLevel")}</p>
      )}
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
      {displayed.data && (
        <TeamBatchView batch={displayed.data} historical={!!batchId} />
      )}
      {!displayed.isFetching && !displayed.error && displayed.data === null && (
        <EmptyState title={t("v12.noTeamRecommendations")} />
      )}
      <QueryFeedback query={history} />
      {history.data?.data.map((item) => (
        <div
          key={item.batchId}
          className="flex flex-wrap justify-between gap-2"
        >
          <time dateTime={item.generatedAt}>
            {formatTimestamp(item.generatedAt, locale)}
          </time>
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
    </section>
  );
}
