import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  showText?: boolean;
  href?: string | null;
  animated?: boolean;
  className?: string;
  variant?: "default" | "icon-only";
}

const sizeConfig = {
  xs: {
    container: 32,
    bubble: 19,
    fontSize: 6,
    sparkle: 8,
    sparkleOffset: -2,
    text: "text-base",
    borderRadius: 8,
  },
  sm: {
    container: 40,
    bubble: 24,
    fontSize: 7.5,
    sparkle: 10,
    sparkleOffset: -2.5,
    text: "text-lg",
    borderRadius: 10,
  },
  md: {
    container: 56,
    bubble: 34,
    fontSize: 10.5,
    sparkle: 14,
    sparkleOffset: -3.5,
    text: "text-xl",
    borderRadius: 14,
  },
  lg: {
    container: 80,
    bubble: 48,
    fontSize: 15,
    sparkle: 20,
    sparkleOffset: -5,
    text: "text-2xl",
    borderRadius: 20,
  },
  xl: {
    container: 120,
    bubble: 72,
    fontSize: 22.5,
    sparkle: 30,
    sparkleOffset: -7.5,
    text: "text-3xl",
    borderRadius: 30,
  },
};

export function BrandLogo({
  size = "md",
  showText = true,
  href = "/dashboard",
  animated = true,
  className,
  variant = "default",
}: BrandLogoProps) {
  const config =
    typeof size === "number"
      ? {
          container: size,
          bubble: size * 0.6,
          fontSize: size * 0.1875,
          sparkle: size * 0.25,
          sparkleOffset: size * -0.0625,
          text: "text-xl",
          borderRadius: size * 0.25,
        }
      : sizeConfig[size];

  const LogoIcon = (
    <div
      className={cn(
        "relative bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg overflow-hidden",
        className
      )}
      style={{
        width: config.container,
        height: config.container,
        borderRadius: config.borderRadius,
      }}
    >
      {/* Subtle light gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 60%)",
        }}
      />

      {/* Chat bubble with IC letters */}
      <div className="relative z-10">
        <div
          className="relative bg-white flex items-center justify-center"
          style={{
            width: config.bubble,
            height: config.bubble,
            borderRadius: "50% 50% 50% 0",
          }}
        >
          <span
            className="font-extrabold text-indigo-600 select-none"
            style={{
              fontSize: config.fontSize,
              letterSpacing: "-0.025em",
            }}
          >
            IC
          </span>

          {/* Animated sparkle badge */}
          {animated ? (
            <motion.div
              className="absolute bg-amber-400 rounded-full flex items-center justify-center"
              style={{
                top: config.sparkleOffset,
                right: config.sparkleOffset,
                width: config.sparkle,
                height: config.sparkle,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [1, 0.8, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span
                style={{
                  fontSize: config.sparkle * 0.5,
                  lineHeight: 1,
                }}
              >
                ✨
              </span>
            </motion.div>
          ) : (
            <div
              className="absolute bg-amber-400 rounded-full flex items-center justify-center"
              style={{
                top: config.sparkleOffset,
                right: config.sparkleOffset,
                width: config.sparkle,
                height: config.sparkle,
              }}
            >
              <span
                style={{
                  fontSize: config.sparkle * 0.5,
                  lineHeight: 1,
                }}
              >
                ✨
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const Content = (
    <div className="flex items-center space-x-3">
      {LogoIcon}
      {showText && variant === "default" && (
        <span
          className={cn(
            config.text,
            "font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent hidden sm:block"
          )}
        >
          IntelliConvo
        </span>
      )}
    </div>
  );

  if (!href) {
    return animated ? (
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {Content}
      </motion.div>
    ) : (
      Content
    );
  }

  return (
    <Link href={href} className="inline-flex items-center">
      {animated ? (
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {Content}
        </motion.div>
      ) : (
        Content
      )}
    </Link>
  );
}
