"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepperStep } from "@/components/ui/stepper";

interface CompactStepperProps {
  steps: StepperStep[];
  currentStepIndex: number;
  className?: string;
}

export const CompactStepper = memo(function CompactStepper({
  steps,
  currentStepIndex,
  className,
}: CompactStepperProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {steps.map((step, index) => {
        const isComplete = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isWaiting = index > currentStepIndex;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <motion.div
              className={cn(
                "relative flex items-center justify-center rounded-full transition-all duration-300",
                isCurrent && "h-8 w-8 bg-indigo-600 text-white shadow-md",
                isComplete && "h-6 w-6 bg-green-500 text-white",
                isWaiting && "h-6 w-6 bg-gray-200 dark:bg-gray-700 text-gray-400"
              )}
              initial={false}
              animate={{
                scale: isCurrent ? 1 : 0.85,
              }}
              transition={{ duration: 0.2 }}
            >
              {isComplete ? (
                <Check className="h-3 w-3" />
              ) : isCurrent ? (
                <>
                  <span className="text-xs font-medium">{index + 1}</span>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-indigo-400"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </>
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </motion.div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="relative mx-1.5 h-0.5 w-6 bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-full">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-green-500"
                  initial={false}
                  animate={{
                    width: index < currentStepIndex ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
