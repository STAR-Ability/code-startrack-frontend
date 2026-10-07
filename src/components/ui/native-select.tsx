import * as React from "react";
import { cn } from "cn";

import { ChevronDownIcon } from "lucide-react";

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default";
  density?: "dense" | "standard" | "comfortable";
};

function NativeSelect({
  className,
  size = "default",
  density = size === "sm" ? "dense" : "standard",
  ...props
}: NativeSelectProps) {
  return (
    <div
      className={cn(
        "group/native-select relative w-fit has-[select:disabled]:opacity-50",
        className,
      )}
      data-slot="native-select-wrapper"
      data-size={size}
      data-density={density}
    >
      <select
        data-slot="native-select"
        data-size={size}
        data-density={density}
        className="w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent pr-9 pl-3 text-base leading-normal transition-[border-color,box-shadow,background-color] duration-(--motion-control) ease-(--motion-ease) enabled:not-aria-invalid:not-focus-visible:hover:border-ring motion-reduce:transition-none outline-none select-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-destructive dark:aria-invalid:focus-visible:border-destructive dark:aria-invalid:focus-visible:ring-destructive data-[density=dense]:min-h-(--control-dense) data-[density=dense]:rounded-md data-[density=dense]:py-0.5 data-[density=standard]:min-h-(--control-standard) data-[density=standard]:py-1.5 data-[density=comfortable]:min-h-(--control-comfortable) data-[density=comfortable]:py-2.5 md:text-sm dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
