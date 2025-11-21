import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  description?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "indigo";
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
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
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-600 dark:text-orange-400",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
  },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};

const columnClasses = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
};

export function StatsGrid({
  stats,
  columns = 3,
  className,
}: StatsGridProps) {
  return (
    <div className={cn("grid gap-4", columnClasses[columns], className)}>
      {stats.map((stat, index) => {
        const colorConfig = colorClasses[stat.color || "indigo"];
        const Icon = stat.icon;
        const TrendIcon = stat.trend?.isPositive !== false ? TrendingUp : TrendingDown;

        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  {stat.trend && (
                    <div className="flex items-center gap-1 mt-2">
                      <TrendIcon
                        className={cn(
                          "h-4 w-4",
                          stat.trend.isPositive !== false
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          stat.trend.isPositive !== false
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {Math.abs(stat.trend.value)}%
                      </span>
                    </div>
                  )}
                  {stat.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stat.description}
                    </p>
                  )}
                </div>
                {Icon && (
                  <div
                    className={cn(
                      "h-12 w-12 rounded-lg flex items-center justify-center",
                      colorConfig.bg
                    )}
                  >
                    <Icon className={cn("h-6 w-6", colorConfig.text)} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
