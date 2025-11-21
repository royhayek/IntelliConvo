import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DateRange = "7d" | "30d" | "90d" | "all";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  options?: Array<{
    value: DateRange;
    label: string;
  }>;
  className?: string;
}

const defaultOptions = [
  { value: "7d" as DateRange, label: "7 Days" },
  { value: "30d" as DateRange, label: "30 Days" },
  { value: "90d" as DateRange, label: "90 Days" },
];

export function DateRangeFilter({
  value,
  onChange,
  options = defaultOptions,
  className,
}: DateRangeFilterProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant="outline"
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            "transition-colors",
            value === option.value &&
              "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
