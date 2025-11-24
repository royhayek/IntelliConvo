import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface SiteAvatarProps {
  siteName: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "h-10 w-10 rounded-xl",
    text: "text-base",
  },
  md: {
    container: "h-12 w-12 rounded-xl",
    text: "text-lg",
  },
  lg: {
    container: "h-14 w-14 rounded-2xl",
    text: "text-xl",
  },
  xl: {
    container: "h-20 w-20 rounded-2xl",
    text: "text-3xl",
  },
};

export function SiteAvatar({
  siteName,
  imageUrl,
  size = "lg",
  animated = true,
  className,
}: SiteAvatarProps) {
  const sizes = sizeClasses[size];
  const initial = siteName.charAt(0).toUpperCase();

  const AvatarContainer = animated ? motion.div : "div";
  const animationProps = animated
    ? {
        whileHover: { scale: 1.1, rotate: 5 },
        transition: { duration: 0.2 },
      }
    : {};

  return (
    <AvatarContainer
      className={cn(
        sizes.container,
        "relative flex items-center justify-center shadow-lg overflow-hidden",
        imageUrl ? "bg-transparent" : "bg-gradient-to-br from-indigo-500 to-purple-600",
        className
      )}
      {...animationProps}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${siteName} logo`}
          fill
          className="object-fill"
          unoptimized
        />
      ) : (
        <span className={cn("font-bold text-white", sizes.text)}>
          {initial}
        </span>
      )}
    </AvatarContainer>
  );
}
