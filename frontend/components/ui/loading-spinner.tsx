import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
  centered?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function LoadingSpinner({
  size = "md",
  text,
  className,
  centered = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn("flex flex-col items-center", centered && "justify-center min-h-[200px]")}>
      <Loader2
        className={cn(
          sizeClasses[size],
          "animate-spin text-indigo-600 dark:text-indigo-400",
          !text && "mx-auto",
          text && "mb-4",
          className
        )}
      />
      {text && (
        <p className={cn(
          textSizeClasses[size],
          "text-gray-600 dark:text-gray-400"
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-surface">
        {content}
      </div>
    );
  }

  return content;
}

// Inline variant for buttons and small spaces
export function LoadingSpinnerInline({
  size = "sm",
  className,
}: Omit<LoadingSpinnerProps, "text" | "centered">) {
  return (
    <Loader2
      className={cn(
        sizeClasses[size],
        "animate-spin",
        className
      )}
    />
  );
}
