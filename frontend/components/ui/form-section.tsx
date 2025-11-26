import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  asCard?: boolean;
  className?: string;
}

export function FormSection({
  title,
  description,
  icon: Icon,
  children,
  action,
  asCard = false,
  className,
}: FormSectionProps) {
  const header = (
    <div className={cn("space-y-2", !asCard && "mb-6")}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0 w-full sm:w-auto">{action}</div>}
      </div>
      {!asCard && <Separator />}
    </div>
  );

  const content = <div className="space-y-4">{children}</div>;

  if (asCard) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {Icon && (
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
                {description && <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>}
              </div>
            </div>
            {action && <div className="w-full sm:w-auto">{action}</div>}
          </div>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {header}
      {content}
    </div>
  );
}
