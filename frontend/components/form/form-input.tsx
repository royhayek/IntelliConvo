"use client";

import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormInput<TFieldValues extends FieldValues>({
  name,
  label,
  placeholder,
  type = "text",
  description,
  control,
}: {
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  type?: string;
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
          <Input {...field} type={type} placeholder={placeholder} className="mt-1" />
        </div>
      )}
    />
  );
}
