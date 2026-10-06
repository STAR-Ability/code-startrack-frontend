import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "group/button interaction-control inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm leading-normal font-medium outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-destructive dark:aria-invalid:focus-visible:border-destructive dark:aria-invalid:focus-visible:ring-destructive dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground active:bg-accent aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] active:bg-accent aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground active:bg-accent aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30 focus-visible:border-destructive focus-visible:ring-destructive dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-link underline-offset-4 hover:underline active:text-foreground",
      },
      size: {
        xl: "min-h-(--control-comfortable) gap-2 rounded-xl px-5 py-3 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        default:
          "min-h-(--control-standard) gap-1.5 px-3 py-2 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "min-h-(--control-dense) gap-1 rounded-md px-2 py-1 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "min-h-(--control-dense) gap-1 rounded-md px-2.5 py-1 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-(--control-comfortable) gap-2 px-4 py-3 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-(--control-icon-standard) min-h-(--control-icon-standard) p-0",
        "icon-xs":
          "size-(--control-icon-dense) min-h-(--control-icon-dense) rounded-md p-0 in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm":
          "size-(--control-icon-dense) min-h-(--control-icon-dense) rounded-md p-0 in-data-[slot=button-group]:rounded-lg",
        "icon-lg":
          "size-(--control-icon-comfortable) min-h-(--control-icon-comfortable) p-0",
      },
      wrap: {
        false: "whitespace-nowrap",
        true: "h-auto min-w-0 max-w-full text-center wrap-anywhere whitespace-normal",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      wrap: false,
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  density,
  wrap,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    density?: "dense" | "standard" | "comfortable";
  }) {
  const densitySizes = size?.startsWith("icon")
    ? ({ dense: "icon-sm", standard: "icon", comfortable: "icon-lg" } as const)
    : ({ dense: "sm", standard: "default", comfortable: "lg" } as const);
  const resolvedSize = density ? densitySizes[density] : size;
  const resolvedDensity =
    density ??
    (resolvedSize === "xs" ||
    resolvedSize === "sm" ||
    resolvedSize === "icon-xs" ||
    resolvedSize === "icon-sm"
      ? "dense"
      : resolvedSize === "lg" ||
          resolvedSize === "xl" ||
          resolvedSize === "icon-lg"
        ? "comfortable"
        : "standard");
  return (
    <ButtonPrimitive
      data-slot="button"
      data-density={resolvedDensity}
      className={cn(
        buttonVariants({ variant, size: resolvedSize, wrap, className }),
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
