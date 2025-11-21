"use client";

import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SelectField({
  label,
  value,
  onChange,
  options,
  description
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  description?: string;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{description}</p>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FormSelectField<TFieldValues extends FieldValues>({
  name,
  label,
  options,
  description,
  control
}: {
  name: FieldPath<TFieldValues>;
  label: string;
  options: { value: string; label: string }[];
  description?: string;
  control: Control<TFieldValues>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <SelectField
          label={label}
          value={field.value as string}
          onChange={field.onChange}
          options={options}
          description={description}
        />
      )}
    />
  );
}
