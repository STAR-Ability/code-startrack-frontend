"use client";

import { InfoIcon } from "lucide-react";
import {
  classifyAlgorithmVersion,
  type AlgorithmFamily,
} from "@/lib/api/algorithm-compatibility";
import { useLocale } from "@/components/layout/locale-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailsDisclosure } from "@/components/ui/details-disclosure";

export function CompatibilityNotice({
  version,
  family,
}: {
  version: string;
  family: AlgorithmFamily;
}) {
  const { t } = useLocale();
  if (classifyAlgorithmVersion(version, family) === "known") return null;
  return (
    <Alert role="note" data-algorithm-compatibility="unknown">
      <InfoIcon aria-hidden="true" />
      <AlertDescription>
        <p>{t("compatibility.notice")}</p>
        <DetailsDisclosure title={t("compatibility.details")}>
          <p className="break-all font-mono">{version}</p>
        </DetailsDisclosure>
      </AlertDescription>
    </Alert>
  );
}
