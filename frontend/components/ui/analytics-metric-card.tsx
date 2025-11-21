import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnalyticsMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor?: "blue" | "green" | "purple" | "orange" | "red" | "indigo";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

const iconColorClasses = {
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  purple: "text-purple-600 dark:text-purple-400",
  orange: "text-orange-600 dark:text-orange-400",
  red: "text-red-600 dark:text-red-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
};

export function AnalyticsMetricCard({
  icon: Icon,
  label,
  value,
  iconColor = "blue",
  trend,
  description,
  className,
}: AnalyticsMetricCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2">
          <Icon className={cn("h-5 w-5", iconColorClasses[iconColor])} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {label}
            </p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {typeof value === "number" ? value.toLocaleString() : value}
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
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
