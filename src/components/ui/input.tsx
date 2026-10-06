import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";

function Input({
  className,
  type,
  density = "standard",
  ...props
}: React.ComponentProps<"input"> & {
  density?: "dense" | "standard" | "comfortable";
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-density={density}
      className={cn(
        "w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-base leading-normal transition-[border-color,box-shadow,background-color] duration-(--motion-control) ease-(--motion-ease) enabled:hover:border-ring/60 motion-reduce:transition-none outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-destructive dark:aria-invalid:focus-visible:border-destructive dark:aria-invalid:focus-visible:ring-destructive md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        density === "dense" && "min-h-(--control-dense) py-0.5",
        density === "standard" && "min-h-(--control-standard) py-1.5",
        density === "comfortable" && "min-h-(--control-comfortable) py-2.5",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
