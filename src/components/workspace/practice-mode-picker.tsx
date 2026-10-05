"use client";
import { CompassIcon, LayersIcon, TargetIcon } from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { modes, type RecommendationMode } from "@/lib/api/schemas";

const modeIcons = {
  HYBRID: LayersIcon,
  WEAKNESS: TargetIcon,
  LEVEL: CompassIcon,
};

export function PracticeModePicker({
  mode,
  onChange,
  disabled = false,
}: {
  mode: RecommendationMode;
  onChange: (value: RecommendationMode) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className="@container/practice-modes flex min-w-0 flex-col gap-3">
      <ToggleGroup
        aria-label={t("v.mode")}
        value={[mode]}
        variant="outline"
        size="lg"
        disabled={disabled}
        className="grid w-full min-w-0 grid-cols-1 items-stretch gap-1.5 @sm/practice-modes:grid-cols-3"
        onValueChange={(values) => {
          const value = values[0] as RecommendationMode;
          if (modes.includes(value)) onChange(value);
        }}
      >
        {modes.map((value) => {
          const Icon = modeIcons[value];
          return (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={t(`v.mode.${value}`)}
              className="h-auto min-h-11 min-w-0 gap-2 px-3 py-2"
            >
              <Icon aria-hidden="true" />
              <span className="min-w-0 wrap-anywhere whitespace-normal">
                {t(`v.mode.${value}`)}
              </span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      <p
        className="text-sm leading-relaxed text-muted-foreground"
        aria-live="polite"
      >
        {t(`practice.mode.${mode}`)}
      </p>
    </div>
  );
}
