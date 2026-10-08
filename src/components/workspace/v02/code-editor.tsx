"use client";

import { useId } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/components/layout/locale-provider";
import { SOURCE_BYTE_LIMIT, sourceByteCount } from "./problem-state";

export function CodeEditor({
  source,
  onChange,
  filename,
  error,
  disabled = false,
}: {
  source: string;
  onChange: (source: string) => void;
  filename: string;
  error?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const { t } = useLocale();
  return (
    <Field data-invalid={!!error} data-disabled={disabled}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel htmlFor={id}>{t("v02.problem.sourceCode")}</FieldLabel>
        <code className="text-xs text-muted-foreground wrap-anywhere">
          {filename}
        </code>
      </div>
      <Textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        value={source}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        dir="ltr"
        wrap="off"
        className="min-h-80 max-w-full overflow-x-auto font-mono text-sm leading-6"
      />
      <FieldDescription id={`${id}-hint`}>
        {t("v02.problem.codeHint")}
      </FieldDescription>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        <span>
          {t("v02.problem.lines", { count: String(source.split("\n").length) })}
        </span>
        <span>
          {t("v02.problem.byteCount", {
            count: String(sourceByteCount(source)),
            limit: String(SOURCE_BYTE_LIMIT),
          })}
        </span>
      </div>
    </Field>
  );
}
