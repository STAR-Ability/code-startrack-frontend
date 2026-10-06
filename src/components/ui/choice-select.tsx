"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
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
  density = "standard",
  name,
  onBlur,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  disabled?: boolean;
  density?: "dense" | "standard" | "comfortable";
  name?: string;
  onBlur?: () => void;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
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
        aria-describedby={describedBy}
        density={density}
        className="w-full min-w-0"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
