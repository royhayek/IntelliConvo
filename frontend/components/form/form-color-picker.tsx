"use client";

import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ColorPicker({
  label,
  value,
  onChange,
  description
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{description}</p>}
      <div className="flex items-center gap-2 mt-1">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded border cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );
}

export function FormColorPicker<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  control
}: {
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  control: Control<TFieldValues>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <ColorPicker
          label={label}
          value={field.value as string}
          onChange={field.onChange}
          description={description}
        />
      )}
    />
  );
}
