"use client";
import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon, type LucideIcon } from "lucide-react";
import { useLocale } from "@/components/layout/locale-provider";
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
  density,
  className,
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
  const resolvedDensity = density ?? (comfortable ? "comfortable" : "standard");
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
        <InputGroup density={resolvedDensity}>
          {Icon && (
            <InputGroupAddon className="hidden @[12rem]/input-group:flex">
              <Icon aria-hidden="true" />
            </InputGroupAddon>
          )}
          <InputGroupInput
            {...inputProps}
            density={resolvedDensity}
            className={className}
          />
          {isPassword && (
            <InputGroupAddon align="inline-end">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <InputGroupButton
                      size="icon-sm"
                      density={
                        resolvedDensity === "comfortable" ? "standard" : "dense"
                      }
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
        <Input
          {...inputProps}
          density={resolvedDensity}
          className={className}
        />
      )}
      {(error || hint) && (
        <FieldDescription id={`${id}-description`}>
          {error ?? hint}
        </FieldDescription>
      )}
    </Field>
  );
}
