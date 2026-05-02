import { useId } from "react";
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
  xs: { container: 32, text: "text-lg" },
  sm: { container: 40, text: "text-xl" },
  md: { container: 56, text: "text-2xl" },
  lg: { container: 80, text: "text-3xl" },
  xl: { container: 120, text: "text-4xl" },
};

// Bubble: body x=4–96, y=4–84 (92×80), corner radius 32, tail bottom-left
// Tail base: x=27–45 (18 units wide)
const BUBBLE_PATH =
  "M 36,4 L 64,4 Q 96,4 96,36 L 96,52 Q 96,84 64,84 L 45,84 L 21,96 L 27,84 L 36,84 Q 4,84 4,52 L 4,36 Q 4,4 36,4 Z";

interface LogoMarkProps {
  size: number;
  animated: boolean;
  bgId: string;
  hlId: string;
  shadowId: string;
  className?: string;
}

function LogoMark({ size, animated, bgId, hlId, shadowId, className }: LogoMarkProps) {
  const apexDot = animated ? (
    <>
      <motion.circle
        cx="73"
        cy="44"
        r="7"
        fill="white"
        fillOpacity="0.12"
        animate={{ scale: [1, 1.6, 1], opacity: [0.12, 0.26, 0.12] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="73"
        cy="44"
        r="3.5"
        fill="white"
        fillOpacity="0.85"
        animate={{ scale: [1, 1.2, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  ) : (
    <>
      <circle cx="73" cy="44" r="7" fill="white" fillOpacity="0.12" />
      <circle cx="73" cy="44" r="3.5" fill="white" fillOpacity="0.85" />
    </>
  );

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        {/* Primary gradient: light indigo → primary (hsl 239 84% 67%) → deep indigo */}
        <linearGradient id={bgId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#6466f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        {/* Top-left radial highlight */}
        <radialGradient id={hlId} cx="0.3" cy="0.22" r="0.6" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="white" stopOpacity="0.22" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Drop shadow */}
        <filter id={shadowId} x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#6366f1" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Bubble background — gradient fill + shadow */}
      <path d={BUBBLE_PATH} fill={`url(#${bgId})`} filter={`url(#${shadowId})`} />
      {/* Highlight overlay */}
      <path d={BUBBLE_PATH} fill={`url(#${hlId})`} />

      {/* I — x=27, right edge=35. C opens at x=37. Mark spans x=27–73, center=50 ✓ */}
      <rect x="27" y="30" width="8" height="28" rx="4" fill="white" />

      {/* Reversed-C — start M 49,27, radius 18, center≈(55,44), opens at x=37, apex at x=73 */}
      <path d="M 49,27 A 18,18 0 1,1 49,61" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* Apex dot at rightmost extent of C arc */}
      {apexDot}
    </svg>
  );
}

export function BrandLogo({
  size = "md",
  showText = true,
  href = "/dashboard",
  animated = true,
  className,
  variant = "default",
}: BrandLogoProps) {
  const raw = useId();
  const uid = raw.replace(/[^a-zA-Z0-9]/g, "");

  const config = typeof size === "number" ? { container: size, text: "text-xl" } : sizeConfig[size];

  const icon = (
    <LogoMark
      size={config.container}
      animated={animated}
      bgId={`bg-${uid}`}
      hlId={`hl-${uid}`}
      shadowId={`sh-${uid}`}
      className={className}
    />
  );

  const Content = (
    <div className="flex items-center space-x-3">
      {icon}
      {showText && variant === "default" && (
        <span className={cn(config.text, "hidden sm:flex")} style={{ fontFamily: "var(--font-oxanium)" }}>
          <span className="font-bold text-[#6466f1]">Intelli</span>
          <span className="font-medium text-[#6466f1]">Convo</span>
        </span>
      )}
    </div>
  );

  if (!href) {
    return animated ? (
      <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        {Content}
      </motion.div>
    ) : (
      Content
    );
  }

  return (
    <Link href={href} className="inline-flex items-center">
      {animated ? (
        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          {Content}
        </motion.div>
      ) : (
        Content
      )}
    </Link>
  );
}
