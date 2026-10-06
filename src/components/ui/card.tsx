import * as React from "react";
import { cn } from "cn";

function Card({
  className,
  size = "default",
  interaction = "none",
  variant = "default",
  tone,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm" | "lg";
  interaction?: "none" | "surface" | "lift";
  variant?: "default" | "metric" | "recommendation" | "analysis" | "supporting";
  tone?: "info" | "insight" | "support";
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-interaction={interaction}
      data-variant={variant}
      data-tone={
        tone ??
        (variant === "analysis"
          ? "insight"
          : variant === "recommendation"
            ? "info"
            : undefined)
      }
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-surface-reading py-(--card-spacing) text-sm text-card-foreground ring-1 ring-surface-border data-[variant=metric]:bg-surface-panel data-[variant=recommendation]:ring-info/20 data-[variant=supporting]:bg-surface-supporting data-[variant=supporting]:shadow-none [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        "shadow-surface transition-[box-shadow,translate,background-color] duration-(--motion-panel) ease-(--motion-ease) data-[interaction=surface]:hover:shadow-raised data-[interaction=surface]:hover:ring-foreground/20 data-[interaction=surface]:focus-within:ring-ring/50 data-[interaction=lift]:hover:shadow-raised data-[interaction=lift]:hover:ring-foreground/20 data-[interaction=lift]:focus-within:ring-ring/50 motion-safe:data-[interaction=lift]:hover:-translate-y-0.5 motion-reduce:transition-none",
        size === "lg" &&
          "rounded-2xl [--card-spacing:--spacing(4)] sm:[--card-spacing:--spacing(8)]",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({
  className,
  titleRole = "default",
  ...props
}: React.ComponentProps<"div"> & {
  titleRole?: "default" | "section" | "supporting";
}) {
  return (
    <div
      data-slot="card-title"
      data-title-role={titleRole}
      className={cn(
        "min-w-0 font-heading text-base leading-snug font-semibold wrap-anywhere data-[title-role=section]:text-xl data-[title-role=supporting]:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
