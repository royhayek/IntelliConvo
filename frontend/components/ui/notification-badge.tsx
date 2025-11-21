import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count?: number;
  max?: number;
  showZero?: boolean;
  dot?: boolean;
  children?: ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}

const variantClasses = {
  default: "bg-indigo-600 text-white",
  success: "bg-green-600 text-white",
  warning: "bg-yellow-600 text-white",
  error: "bg-red-600 text-white",
};

const positionClasses = {
  "top-right": "-top-1 -right-1",
  "top-left": "-top-1 -left-1",
  "bottom-right": "-bottom-1 -right-1",
  "bottom-left": "-bottom-1 -left-1",
};

export function NotificationBadge({
  count = 0,
  max = 99,
  showZero = false,
  dot = false,
  children,
  variant = "error",
  position = "top-right",
  className,
}: NotificationBadgeProps) {
  const shouldShow = count > 0 || showZero;
  const displayCount = count > max ? `${max}+` : count.toString();

  if (!shouldShow) {
    return children ? <div className="relative inline-block">{children}</div> : null;
  }

  const badge = (
    <span
      className={cn(
        "flex items-center justify-center font-semibold text-xs rounded-full",
        dot ? "h-2 w-2" : "h-5 min-w-[20px] px-1",
        variantClasses[variant],
        children && ["absolute", positionClasses[position]],
        className
      )}
    >
      {!dot && displayCount}
    </span>
  );

  if (!children) {
    return badge;
  }

  return (
    <div className="relative inline-block">
      {children}
      {badge}
    </div>
  );
}
