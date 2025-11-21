import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "p-6",
    icon: "h-12 w-12",
    iconSize: "h-6 w-6",
    title: "text-base",
    message: "text-sm",
  },
  md: {
    container: "p-7",
    icon: "h-14 w-14",
    iconSize: "h-7 w-7",
    title: "text-lg",
    message: "text-base",
  },
  lg: {
    container: "p-8",
    icon: "h-16 w-16",
    iconSize: "h-8 w-8",
    title: "text-lg",
    message: "text-base",
  },
};

export function ErrorState({
  title,
  message = "Please try again or contact support if the problem persists.",
  onRetry,
  retryLabel = "Retry",
  size = "lg",
  className,
}: ErrorStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "glass-effect border-2 border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800/30 rounded-2xl text-center",
        sizes.container,
        className
      )}
    >
      <div
        className={cn(
          "rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4",
          sizes.icon
        )}
      >
        <AlertCircle
          className={cn("text-red-600 dark:text-red-400", sizes.iconSize)}
        />
      </div>
      <h3
        className={cn(
          "font-semibold text-red-800 dark:text-red-300 mb-2",
          sizes.title
        )}
      >
        {title}
      </h3>
      <p className={cn("text-red-600 dark:text-red-400", sizes.message)}>
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          className="mt-4 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
