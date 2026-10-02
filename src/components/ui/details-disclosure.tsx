"use client";

import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function DetailsDisclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Collapsible className="w-full text-xs text-muted-foreground">
      <CollapsibleTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="group/disclosure"
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
      <CollapsibleContent keepMounted>
        <div className="flex flex-col gap-2 pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
