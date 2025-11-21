import { motion } from "framer-motion";
import { LucideIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  text: string;
  icon?: LucideIcon;
  variant?: "gradient" | "solid" | "outline";
  animated?: boolean;
  delay?: number;
  className?: string;
}

const variantClasses = {
  gradient: "bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50",
  solid: "bg-indigo-600 dark:bg-indigo-700 text-white border border-indigo-700 dark:border-indigo-800",
  outline: "bg-transparent text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700",
};

export function TrustBadge({
  text,
  icon: Icon = Star,
  variant = "gradient",
  animated = true,
  delay = 0.2,
  className,
}: TrustBadgeProps) {
  const content = (
    <div
      className={cn(
        "inline-flex items-center space-x-2 rounded-full px-6 py-2 text-sm font-medium",
        variantClasses[variant],
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{text}</span>
    </div>
  );

  if (!animated) {
    return content;
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      className="inline-block"
    >
      {content}
    </motion.div>
  );
}
