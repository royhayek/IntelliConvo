import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string | null;
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "h-8 w-8 rounded-lg",
    icon: "h-4 w-4",
    text: "text-lg",
  },
  md: {
    container: "h-9 w-9 rounded-xl",
    icon: "h-5 w-5",
    text: "text-xl",
  },
  lg: {
    container: "h-12 w-12 rounded-lg",
    icon: "h-6 w-6",
    text: "text-2xl",
  },
};

export function BrandLogo({
  size = "md",
  showText = true,
  href = "/dashboard",
  animated = true,
  className,
}: BrandLogoProps) {
  const sizes = sizeClasses[size];

  const LogoIcon = (
    <div
      className={cn(
        sizes.container,
        "bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg",
        className
      )}
    >
      <Sparkles className={cn(sizes.icon, "text-white")} />
    </div>
  );

  const Content = (
    <div className="flex items-center space-x-3">
      {LogoIcon}
      {showText && (
        <span
          className={cn(
            sizes.text,
            "font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent hidden sm:block"
          )}
        >
          Intelligentconvo
        </span>
      )}
    </div>
  );

  if (!href) {
    return animated ? (
      <motion.div whileHover={{ scale: 1.02 }}>{Content}</motion.div>
    ) : (
      Content
    );
  }

  return (
    <Link href={href} className="flex items-center space-x-3">
      {animated ? (
        <motion.div whileHover={{ scale: 1.02 }}>{Content}</motion.div>
      ) : (
        Content
      )}
    </Link>
  );
}
