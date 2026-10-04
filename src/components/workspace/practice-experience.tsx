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
    <div className="flex flex-col gap-6">
      <div className="practice-panels grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {(
          [
            {
              title: "practice.forYou",
              description: "practice.forYouDescription",
              icon: BookOpenIcon,
            },
            {
              title: "v.recommendationHistory",
              description: "practice.historyDescription",
              icon: HistoryIcon,
            },
          ] as const
        ).map(({ title, description, icon: Icon }) => (
          <Card key={title} size="lg" className="practice-panel">
            <CardHeader>
              <CardTitle>
                <h2 className="flex items-center gap-2">
                  <Icon className="size-4" aria-hidden="true" />
                  {t(title)}
                </h2>
              </CardTitle>
              <CardDescription>{t(description)}</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginPrompt />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PracticeExperience() {
  const { t } = useLocale();
  const context = useOptionalAccounts();
  const [mode, setMode] = useState<RecommendationMode>("HYBRID");
  return (
    <>
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
