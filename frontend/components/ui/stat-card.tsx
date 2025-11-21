import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconValue?: string | number;
  color?: "blue" | "green" | "purple" | "red" | "orange" | "indigo";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-600 dark:text-green-400",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-600 dark:text-orange-400",
  },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  iconValue,
  color = "blue",
  trend,
  className,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          {/* Icon/Value Display */}
          <div
            className={cn(
              "h-12 w-12 rounded-lg flex items-center justify-center",
              colors.bg
            )}
          >
            {Icon ? (
              <Icon className={cn("h-6 w-6", colors.text)} />
            ) : (
              <span className={cn("text-xl font-semibold", colors.text)}>
                {iconValue ?? value}
              </span>
            )}
          </div>

          {/* Label and Value */}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {label}
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {value}
              </p>
              {trend && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
