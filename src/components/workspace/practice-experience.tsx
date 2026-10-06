"use client";
import { useState } from "react";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  HistoryIcon,
  OrbitIcon,
} from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PracticeModePicker } from "./practice-mode-picker";
import { type RecommendationMode } from "@/lib/api/schemas";
import { LoginPrompt, PersonalDataGate } from "./personal-data-gate";
import { useOptionalAccounts } from "./account-provider";
import { RecommendationsPage } from "./recommendations-page";
import { SyncPanel } from "./sync-panel";

function GuestPracticePanels() {
  const { t } = useLocale();
  return (
    <div className="practice-panels grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <Card
        variant="recommendation"
        size="lg"
        interaction="none"
        className="practice-panel"
      >
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2">
              <BookOpenIcon className="size-4" aria-hidden="true" />
              {t("practice.forYou")}
            </h2>
          </CardTitle>
          <CardDescription>{t("practice.forYouDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginPrompt />
        </CardContent>
      </Card>
      <section className="flex min-w-0 flex-col gap-3 px-1 py-5">
        <h2 className="flex items-center gap-2 font-medium">
          <HistoryIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          {t("v.recommendationHistory")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("practice.historyDescription")}
        </p>
      </section>
    </div>
  );
}

export function PracticeExperience() {
  const { t } = useLocale();
  const context = useOptionalAccounts();
  const [mode, setMode] = useState<RecommendationMode>("HYBRID");
  return (
    <>
      {!context?.account && (
        <Card
          size={context?.user ? "default" : "lg"}
          interaction="none"
          className="practice-intro data-[compact=true]:bg-transparent data-[compact=true]:shadow-none data-[compact=true]:ring-0 data-[compact=true]:[--card-spacing:0px]"
          data-compact={!!context?.user}
        >
          <CardHeader>
            {!context?.user && (
              <div className="mb-4">
                <Badge variant="outline" wrap>
                  <OrbitIcon aria-hidden="true" />
                  {t("practice.eyebrow")}
                </Badge>
              </div>
            )}
            <CardTitle>
              <h2 className="practice-heading">{t("practice.introTitle")}</h2>
            </CardTitle>
            <CardDescription>{t("practice.introDescription")}</CardDescription>
          </CardHeader>
          {!context?.user && (
            <CardContent>
              <ol
                className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-muted-foreground"
                aria-label={t("practice.flow")}
              >
                {(
                  [
                    "practice.step.choose",
                    "practice.step.train",
                    "practice.step.review",
                  ] as const
                ).map((step, index) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="font-mono">0{index + 1}</span>
                    {t(step)}
                    {index < 2 && (
                      <ArrowUpRightIcon className="size-3" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          )}
        </Card>
      )}
      {!context?.account && (
        <PracticeModePicker mode={mode} onChange={setMode} />
      )}
      <PersonalDataGate guestContent={<GuestPracticePanels />}>
        <RecommendationsPage initialMode={mode} />
        {context?.account && <SyncPanel account={context.account} />}
      </PersonalDataGate>
    </>
  );
}
