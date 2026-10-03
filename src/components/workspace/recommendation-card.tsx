"use client";
import { ExternalLinkIcon } from "lucide-react";
import type { RecommendationBatchDto, ProblemDto } from "@/lib/api/schemas";
import { safeProblemUrl } from "@/lib/charts/data";
import { useLocale } from "@/components/layout/locale-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "./feedback";

export function ProblemLink({ problem }: { problem: ProblemDto }) {
  const { t } = useLocale();
  const url = safeProblemUrl(problem.url);
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: "outline", wrap: true })}
    >
      <span>
        {t("recommendation.openExternal", { platform: "Codeforces" })}
      </span>
      <ExternalLinkIcon data-icon="inline-end" />
      <span className="sr-only">{t("recommendation.newTab")}</span>
    </a>
  ) : (
    <Button disabled variant="outline" wrap>
      {t("recommendation.linkUnavailable")}
    </Button>
  );
}
export function BatchView({
  batch,
  firstOnly = false,
}: {
  batch: RecommendationBatchDto | null;
  firstOnly?: boolean;
}) {
  const { t } = useLocale();
  if (!batch)
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("practice.forYou")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title={t("practice.noData")}
            description={t("v.noBatch")}
          />
        </CardContent>
      </Card>
    );
  return (
    <>
      {batch.stale && (
        <Alert>
          <AlertDescription>
            <Badge variant="warning">{t("v.stale")}</Badge>
            <p>{t("v.staleNote")}</p>
          </AlertDescription>
        </Alert>
      )}
      <p className="text-xs text-muted-foreground">
        {t("recommendation.generatedAt")}: {batch.generatedAt} ·{" "}
        {t(`v.mode.${batch.mode}`)} · {t("v.targetRating")}:{" "}
        {batch.targetRating} · {t("v.candidateCount")}: {batch.candidateCount} ·{" "}
        {t("v.resultCount")}: {batch.resultCount}
      </p>
      {!batch.recommendations.length && (
        <EmptyState
          title={t("practice.noData")}
          description={t("v.noCandidates")}
        />
      )}
      {(firstOnly
        ? batch.recommendations.slice(0, 1)
        : batch.recommendations
      ).map((item) => (
        <RecommendationCard key={item.rank} item={item} />
      ))}
    </>
  );
}

export function RecommendationCard({
  item,
}: {
  item: RecommendationBatchDto["recommendations"][number];
}) {
  const { t } = useLocale();
  return (
    <Card interaction="lift" className="feedback-enter">
      <CardHeader>
        <CardTitle>
          <h2 className="wrap-anywhere">
            <span className="mr-3 font-mono text-muted-foreground">
              #{item.rank}
            </span>{" "}
            {item.problem.title ?? item.problem.externalProblemKey}
          </h2>
        </CardTitle>
        <CardDescription>
          {item.problem.externalProblemKey} · {t("recommendation.difficulty")}:{" "}
          {item.problem.difficulty ?? t("v.unrated")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p>{t(`v.reason.${item.reasonCode}`)}</p>
        <div className="flex flex-wrap gap-2">
          {item.problem.tags.map((tag) => (
            <Badge variant="outline" key={tag} wrap>
              {tag}
            </Badge>
          ))}
          {item.solvedSinceGeneration && (
            <Badge variant="success">{t("v.solvedSince")}</Badge>
          )}
          {item.problem.isGym && <Badge variant="outline">Gym</Badge>}
          {item.problem.catalogSource === "INFERRED" && (
            <Badge variant="outline">INFERRED</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("v.cfSolved")}: {item.problem.solvedCount ?? t("v.unavailable")}
        </p>
      </CardContent>
      <CardFooter>
        <ProblemLink problem={item.problem} />
      </CardFooter>
    </Card>
  );
}
