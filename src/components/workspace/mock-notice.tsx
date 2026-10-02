"use client";
import { FlaskConicalIcon } from "lucide-react";
import { useMockMode } from "@/lib/api/data-state";
import { useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";

export function MockNotice() {
  const mock = useMockMode();
  const { t } = useLocale();
  if (!mock) return null;
  return (
    <div
      role="status"
      data-state="mock"
      className="flex flex-wrap items-center gap-2 border-b bg-background/80 px-5 py-2 text-xs text-muted-foreground"
    >
      <Badge variant="outline" wrap>
        <FlaskConicalIcon aria-hidden="true" />
        {t("data.mockTitle")}
      </Badge>
      <p>{t("data.mockDescription")}</p>
    </div>
  );
}
