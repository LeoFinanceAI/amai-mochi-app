import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipRadioGroupProps<T extends string> {
  legend: string;
  name: string;
  options: ReadonlyArray<ChipOption<T>>;
  value: T | null;
  onChange: (value: T) => void;
  // Extra content after the chips, e.g. a "+ New client" link.
  children?: ReactNode;
}

// A choice shown as large chips (44px targets, as in the mockups), still native
// radios for screen readers and keyboards.
export const ChipRadioGroup = <T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  children,
}: ChipRadioGroupProps<T>) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="text-sm font-semibold mb-2">{legend}</legend>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isChecked = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "relative inline-flex min-h-11 grow cursor-pointer items-center justify-center rounded-xl border px-4 text-sm font-semibold",
              isChecked
                ? "border-foreground bg-foreground text-background"
                : "bg-card",
              "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isChecked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
      {children}
    </div>
  </fieldset>
);
