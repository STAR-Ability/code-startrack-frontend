"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export function ChoiceSelect({
  id,
  value,
  onValueChange,
  options,
  disabled,
  name,
  onBlur,
  "aria-invalid": invalid,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  disabled?: boolean;
  name?: string;
  onBlur?: () => void;
  "aria-invalid"?: boolean;
}) {
  return (
    <Select
      value={value}
      items={options}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next);
      }}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger
        id={id}
        onBlur={onBlur}
        aria-invalid={invalid}
        className="w-full min-w-0 h-auto min-h-9"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
