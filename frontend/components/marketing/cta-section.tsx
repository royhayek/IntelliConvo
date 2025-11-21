import { motion } from "framer-motion";
import { LucideIcon, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CTASectionProps {
  title: string;
  description: string;
  primaryAction: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
  secondaryText?: string;
  secondaryIcon?: LucideIcon;
  animated?: boolean;
  className?: string;
}

export function CTASection({
  title,
  description,
  primaryAction,
  secondaryText,
  secondaryIcon: SecondaryIcon = CheckCircle,
  animated = true,
  className,
}: CTASectionProps) {
  const PrimaryIcon = primaryAction.icon;

  return (
    <motion.section
      initial={animated ? { opacity: 0, y: 30 } : undefined}
      whileInView={animated ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className={cn("mt-32 text-center", className)}
    >
      <motion.div
        whileHover={animated ? { scale: 1.02, rotateX: 2 } : undefined}
        className="relative overflow-hidden gradient-brand rounded-3xl p-16 text-white shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative z-10">
          <motion.h2
            initial={animated ? { opacity: 0, y: 20 } : undefined}
            whileInView={animated ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={animated ? { opacity: 0, y: 20 } : undefined}
            whileInView={animated ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl mb-10 opacity-90 max-w-2xl mx-auto"
          >
            {description}
          </motion.p>
          <motion.div
            initial={animated ? { opacity: 0, y: 20 } : undefined}
            whileInView={animated ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <Link href={primaryAction.href}>
              <Button
                size="lg"
                variant="secondary"
                className="px-10 py-4 text-lg hover:scale-105 transition-transform"
              >
                {PrimaryIcon && <PrimaryIcon className="mr-2 h-5 w-5" />}
                {primaryAction.label}
              </Button>
            </Link>
            {secondaryText && (
              <div className="flex items-center space-x-2 text-white/80">
                <SecondaryIcon className="h-4 w-4" />
                <span className="text-sm">{secondaryText}</span>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
}
