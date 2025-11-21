import { LucideIcon, Info, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

interface InfoAlertProps {
  title?: string;
  message: string;
  variant?: AlertVariant;
  icon?: LucideIcon;
  className?: string;
}

const variantConfig: Record<AlertVariant, { icon: LucideIcon; className: string }> = {
  info: {
    icon: Info,
    className: "border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800/30",
  },
  success: {
    icon: CheckCircle,
    className: "border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800/30",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-800/30",
  },
  error: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800/30",
  },
};

export function InfoAlert({
  title,
  message,
  variant = "info",
  icon: CustomIcon,
  className,
}: InfoAlertProps) {
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;

  return (
    <Alert className={cn(config.className, className)}>
      <Icon className="h-4 w-4" />
      <AlertDescription>
        {title && <strong>{title}: </strong>}
        {message}
      </AlertDescription>
    </Alert>
  );
}
