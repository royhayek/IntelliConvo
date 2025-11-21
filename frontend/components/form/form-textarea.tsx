"use client";

import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function FormTextarea<TFieldValues extends FieldValues>({
  name,
  label,
  placeholder,
  rows = 3,
  description,
  control,
}: {
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  rows?: number;
  description?: string;
  control: Control<TFieldValues>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          {label && <Label className="text-sm">{label}</Label>}
          {description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{description}</p>}
          <Textarea {...field} placeholder={placeholder} rows={rows} className="mt-1" />
        </div>
      )}
    />
  );
}
