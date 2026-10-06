"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const toggleVariants = cva(
  "group/toggle interaction-control inline-flex items-center justify-center gap-1 rounded-lg text-sm leading-normal font-medium outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-destructive dark:aria-invalid:focus-visible:border-destructive dark:aria-invalid:focus-visible:ring-destructive aria-pressed:bg-muted aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-foreground/15 data-[state=on]:bg-muted dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent hover:bg-muted",
      },
      size: {
        default:
          "min-h-(--control-standard) min-w-(--control-standard) px-3 py-2 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        sm: "min-h-(--control-dense) min-w-(--control-dense) rounded-md px-2.5 py-1 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-(--control-comfortable) min-w-(--control-comfortable) px-4 py-3 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
      },
      wrap: {
        false: "whitespace-nowrap",
        true: "min-w-0 max-w-full text-center wrap-anywhere whitespace-normal",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      wrap: false,
    },
  },
);

function Toggle({
  className,
  variant = "default",
  size = "default",
  density,
  wrap,
  ...props
}: TogglePrimitive.Props &
  VariantProps<typeof toggleVariants> & {
    density?: "dense" | "standard" | "comfortable";
  }) {
  const resolvedSize = density
    ? ({ dense: "sm", standard: "default", comfortable: "lg" } as const)[
        density
      ]
    : size;
  return (
    <TogglePrimitive
      data-slot="toggle"
      data-density={
        density ??
        (resolvedSize === "sm"
          ? "dense"
          : resolvedSize === "lg"
            ? "comfortable"
            : "standard")
      }
      className={cn(
        toggleVariants({ variant, size: resolvedSize, wrap, className }),
      )}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
