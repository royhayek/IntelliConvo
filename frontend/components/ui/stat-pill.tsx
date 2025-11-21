import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatPillProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "blue" | "green" | "purple" | "red" | "orange" | "indigo";
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "vertical";
  className?: string;
}

const variantClasses = {
  default: {
    bg: "bg-gray-100 dark:bg-gray-800",
    value: "text-gray-900 dark:text-white",
    label: "text-gray-600 dark:text-gray-400",
    icon: "text-gray-600 dark:text-gray-400",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    value: "text-blue-900 dark:text-blue-100",
    label: "text-blue-700 dark:text-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    value: "text-green-900 dark:text-green-100",
    label: "text-green-700 dark:text-green-400",
    icon: "text-green-600 dark:text-green-400",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    value: "text-purple-900 dark:text-purple-100",
    label: "text-purple-700 dark:text-purple-400",
    icon: "text-purple-600 dark:text-purple-400",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    value: "text-red-900 dark:text-red-100",
    label: "text-red-700 dark:text-red-400",
    icon: "text-red-600 dark:text-red-400",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    value: "text-orange-900 dark:text-orange-100",
    label: "text-orange-700 dark:text-orange-400",
    icon: "text-orange-600 dark:text-orange-400",
  },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    value: "text-indigo-900 dark:text-indigo-100",
    label: "text-indigo-700 dark:text-indigo-400",
    icon: "text-indigo-600 dark:text-indigo-400",
  },
};

const sizeClasses = {
  sm: {
    container: "p-2",
    value: "text-lg font-semibold",
    label: "text-xs",
    icon: "h-4 w-4",
    gap: "gap-1",
  },
  md: {
    container: "p-3",
    value: "text-2xl font-bold",
    label: "text-sm",
    icon: "h-5 w-5",
    gap: "gap-2",
  },
  lg: {
    container: "p-4",
    value: "text-3xl font-bold",
    label: "text-base",
    icon: "h-6 w-6",
    gap: "gap-3",
  },
};

export function StatPill({
  value,
  label,
  icon: Icon,
  variant = "default",
  size = "md",
  layout = "vertical",
  className,
}: StatPillProps) {
  const colors = variantClasses[variant];
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "rounded-lg transition-all duration-200",
        colors.bg,
        sizes.container,
        className
      )}
    >
      <div
        className={cn(
          "flex items-center",
          layout === "vertical" ? "flex-col text-center" : "flex-row justify-between",
          sizes.gap
        )}
      >
        <div className={cn("flex items-center", sizes.gap)}>
          {Icon && (
            <Icon className={cn(sizes.icon, colors.icon)} />
          )}
          <div className={cn(sizes.value, colors.value)}>{value}</div>
        </div>
        <div className={cn(sizes.label, colors.label)}>{label}</div>
      </div>
    </div>
  );
}
