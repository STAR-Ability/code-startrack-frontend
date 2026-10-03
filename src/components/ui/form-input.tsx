"use client";
import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon, type LucideIcon } from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "./input-group";
import { Field, FieldLabel, FieldDescription } from "./field";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";

export function FormInput({
  label,
  error,
  hint,
  icon: Icon,
  labelAction,
  comfortable = false,
  type,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  labelAction?: React.ReactNode;
  comfortable?: boolean;
}) {
  const id = useId();
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputProps = {
    ...props,
    id,
    type: isPassword && visible ? "text" : type,
    "aria-invalid": !!error,
    "aria-describedby": error || hint ? `${id}-description` : undefined,
  };
  return (
    <Field data-invalid={!!error} data-disabled={props.disabled}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {labelAction}
      </div>
      {Icon || isPassword ? (
        <InputGroup className={cn(comfortable && "h-12")}>
          {Icon && (
            <InputGroupAddon>
              <Icon aria-hidden="true" />
            </InputGroupAddon>
          )}
          <InputGroupInput
            {...inputProps}
            className={cn(comfortable && "h-12")}
          />
          {isPassword && (
            <InputGroupAddon align="inline-end">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <InputGroupButton
                      size="icon-sm"
                      aria-label={t(
                        visible ? "ui.hidePassword" : "ui.showPassword",
                      )}
                      aria-pressed={visible}
                      disabled={props.disabled}
                      onClick={() => setVisible(!visible)}
                    />
                  }
                >
                  {visible ? (
                    <EyeOffIcon aria-hidden="true" />
                  ) : (
                    <EyeIcon aria-hidden="true" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {t(visible ? "ui.hidePassword" : "ui.showPassword")}
                </TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          )}
        </InputGroup>
      ) : (
        <Input {...inputProps} className={cn(comfortable && "h-12")} />
      )}
      {(error || hint) && (
        <FieldDescription id={`${id}-description`}>
          {error ?? hint}
        </FieldDescription>
      )}
    </Field>
  );
}
