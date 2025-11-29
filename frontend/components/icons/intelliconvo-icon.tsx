import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface IntelliConvoIconProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * IntelliConvo icon-only component
 * Pure logo icon without text or link wrapper
 * Perfect for favicons, avatars, or compact displays
 */
export function IntelliConvoIcon({
  size = 56,
  className,
  animated = true,
}: IntelliConvoIconProps) {
  const config = {
    container: size,
    bubble: size * 0.6,
    fontSize: size * 0.1875,
    sparkle: size * 0.25,
    sparkleOffset: size * -0.0625,
    borderRadius: size * 0.25,
  };

  const icon = (
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

  return animated ? (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      {icon}
    </motion.div>
  ) : (
    icon
  );
}
