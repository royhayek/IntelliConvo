"use client";

import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  description,
  suffix
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  suffix?: string;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{description}</p>}
      <div className="flex items-center gap-2 mt-1">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        {suffix && <span className="text-sm text-gray-500 dark:text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

export function FormNumberField<TFieldValues extends FieldValues>({
  name,
  label,
  min,
  max,
  step,
  description,
  suffix,
  control
}: {
  name: FieldPath<TFieldValues>;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  suffix?: string;
  control: Control<TFieldValues>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <NumberField
          label={label}
          value={field.value as number}
          onChange={field.onChange}
          min={min}
          max={max}
          step={step}
          description={description}
          suffix={suffix}
        />
      )}
    />
  );
}
