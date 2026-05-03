import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
    variant?: "default" | "gradient" | "outline";
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "p-8",
    icon: "h-14 w-14 rounded-2xl mb-4",
    iconSize: "h-7 w-7",
    title: "text-lg",
    description: "text-sm",
  },
  md: {
    container: "p-10",
    icon: "h-16 w-16 rounded-2xl mb-5",
    iconSize: "h-8 w-8",
    title: "text-xl",
    description: "text-base",
  },
  lg: {
    container: "p-12",
    icon: "h-20 w-20 rounded-3xl mb-6",
    iconSize: "h-10 w-10",
    title: "text-2xl",
    description: "text-lg",
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "lg",
  className,
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  const ActionButton = action ? (
    <Button
      variant={action.variant || "gradient"}
      size={size === "sm" ? "default" : "lg"}
      onClick={action.onClick}
      asChild={!!action.href}
    >
      {action.href ? (
        <Link href={action.href}>
          {action.icon && <action.icon className="w-5 h-5 mr-2" />}
          {action.label}
        </Link>
      ) : (
        <>
          {action.icon && <action.icon className="w-5 h-5 mr-2" />}
          {action.label}
        </>
      )}
    </Button>
  ) : null;

  return (
    <div
      className={cn(
        "dashboard-card border-2 border-dashed rounded-3xl text-center",
        sizes.container,
        className
      )}
    >
      <div
        className={cn(
          "mx-auto bg-gradient-to-br from-cyan-100 to-indigo-100 dark:from-cyan-900/20 dark:to-indigo-900/20 flex items-center justify-center",
          sizes.icon
        )}
      >
        <Icon
          className={cn(
            "text-cyan-600 dark:text-cyan-400",
            sizes.iconSize
          )}
        />
      </div>
      <h3
        className={cn(
          "font-bold text-gray-900 dark:text-white mb-3",
          sizes.title
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto",
          sizes.description
        )}
      >
        {description}
      </p>
      {ActionButton}
    </div>
  );
}
