import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "page" | "section";
  animated?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  variant = "page",
  animated = true,
  className,
}: PageHeaderProps) {
  const isPage = variant === "page";

  const titleClasses = cn(
    "font-bold",
    isPage
      ? "text-4xl md:text-5xl text-gray-900 dark:text-white"
      : "text-xl text-gray-900 dark:text-white"
  );

  const descriptionClasses = cn(
    "text-gray-600 dark:text-gray-400",
    isPage ? "mt-3 text-xl" : "text-sm"
  );

  const content = (
    <div
      className={cn(
        "flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0",
        isPage && "mb-10",
        className
      )}
    >
      <div>
        <h1 className={titleClasses}>{title}</h1>
        {description && <p className={descriptionClasses}>{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );

  if (!animated) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {content}
    </motion.div>
  );
}

// Convenience component for section headers in tabs
export function SectionHeader({
  title,
  description,
  action,
  className,
}: Omit<PageHeaderProps, "variant" | "animated">) {
  return (
    <div className={cn("space-y-1 mb-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
