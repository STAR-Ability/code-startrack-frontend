"use client";

import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function DetailsDisclosure({
  title,
  accessibleLabel,
  children,
  keepMounted = true,
  variant = "inline",
  defaultOpen = false,
}: {
  title: string;
  accessibleLabel?: string;
  children: React.ReactNode;
  keepMounted?: boolean;
  variant?: "inline" | "panel";
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn(
        "w-full",
        variant === "inline"
          ? "text-xs text-muted-foreground"
          : "text-sm text-foreground",
      )}
    >
      <CollapsibleTrigger
        aria-label={accessibleLabel}
        render={
          <Button
            type="button"
            variant={variant === "panel" ? "outline" : "ghost"}
            size={variant === "panel" ? "default" : "xs"}
            wrap
            className={cn(
              "group/disclosure",
              variant === "panel" && "w-full justify-between",
            )}
          />
        }
      >
        {title}
        <ChevronDownIcon
          data-icon="inline-end"
          aria-hidden="true"
          className="transition-transform duration-200 group-data-panel-open/disclosure:rotate-180 motion-reduce:transition-none"
        />
      </CollapsibleTrigger>
      <CollapsibleContent keepMounted={keepMounted}>
        <div
          className={cn(
            "flex min-w-0 flex-col",
            variant === "panel" ? "gap-4 pt-4" : "gap-2 pt-2",
          )}
        >
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
