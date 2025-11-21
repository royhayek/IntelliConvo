"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status: "waiting" | "current" | "complete" | "error";
}

interface StepperProps {
  steps: StepperStep[];
  currentStepId: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
  showConnectors?: boolean;
  animated?: boolean;
}

export function Stepper({
  steps,
  currentStepId,
  orientation = "horizontal",
  className,
  showConnectors = true,
  animated = true,
}: StepperProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);

  const getStepStatus = (index: number, step: StepperStep): StepperStep["status"] => {
    if (step.status === "error") return "error";
    if (index < currentStepIndex) return "complete";
    if (index === currentStepIndex) return "current";
    return "waiting";
  };

  const stepVariants = {
    waiting: { scale: 1 },
    current: { scale: 1.1 },
    complete: { scale: 1 },
    error: { scale: 1 },
  };

  const Step = ({ step, index }: { step: StepperStep; index: number }) => {
    const status = getStepStatus(index, step);
    const isLast = index === steps.length - 1;

    return (
      <motion.div
        className={cn(
          "flex items-center",
          orientation === "vertical" ? "flex-col" : "flex-row",
          !isLast && orientation === "horizontal" ? "flex-1" : ""
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animated ? index * 0.1 : 0 }}
      >
        {/* Step Circle */}
        <div className="flex flex-col items-center">
          <motion.div
            className={cn(
              "relative flex items-center justify-center rounded-full border-2 transition-all duration-300",
              status === "waiting" && "border-gray-300 bg-white dark:border-gray-600 dark:bg-slate-700 text-gray-400 dark:text-gray-500",
              status === "current" && "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50",
              status === "complete" && "border-green-600 bg-green-600 text-white",
              status === "error" && "border-red-600 bg-red-600 text-white",
              orientation === "horizontal" ? "h-8 w-8" : "h-10 w-10"
            )}
            variants={animated ? stepVariants : undefined}
            animate={animated ? status : undefined}
            whileHover={{ scale: 1.05 }}
          >
            <AnimatePresence mode="wait">
              {status === "complete" ? (
                <motion.div
                  key="complete"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle className="h-4 w-4" />
                </motion.div>
              ) : status === "current" ? (
                <motion.div
                  key="current"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="h-1.5 w-1.5 rounded-full bg-white"
                />
              ) : status === "error" ? (
                <motion.div
                  key="error"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-xs font-bold"
                >
                  !
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {step.icon || <Circle className="h-3 w-3" />}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulse Effect for Current Step */}
            {status === "current" && animated && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-indigo-400"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>

          {/* Step Content */}
          <div className={cn(
            "text-center",
            orientation === "horizontal" ? "mt-2 max-w-[100px]" : "mt-3 max-w-[160px]"
          )}>
            <motion.h3
              className={cn(
                "font-medium text-xs transition-colors duration-300",
                status === "current" && "text-indigo-600 dark:text-indigo-400",
                status === "complete" && "text-green-600 dark:text-green-400",
                status === "error" && "text-red-600 dark:text-red-400",
                status === "waiting" && "text-gray-500 dark:text-gray-400"
              )}
              animate={status === "current" && animated ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {step.title}
            </motion.h3>
            {step.description && (
              <motion.p
                className={cn(
                  "text-xs mt-0.5 transition-colors duration-300",
                  status === "current" && "text-indigo-500 dark:text-indigo-400",
                  status === "complete" && "text-green-500 dark:text-green-400",
                  status === "error" && "text-red-500 dark:text-red-400",
                  status === "waiting" && "text-gray-400 dark:text-gray-500"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {step.description}
              </motion.p>
            )}
          </div>
        </div>

        {/* Connector Line */}
        {showConnectors && !isLast && (
          <motion.div
            className={cn(
              "relative",
              orientation === "horizontal"
                ? "mx-4 h-0.5 flex-1 bg-gray-200 dark:bg-gray-700"
                : "my-4 w-0.5 h-12 bg-gray-200 dark:bg-gray-700"
            )}
            initial={{ scaleX: orientation === "horizontal" ? 0 : 1, scaleY: orientation === "vertical" ? 0 : 1 }}
            animate={{ scaleX: 1, scaleY: 1 }}
            transition={{ delay: animated ? (index + 1) * 0.1 : 0, duration: 0.5 }}
          >
            {/* Progress Line */}
            <motion.div
              className={cn(
                "absolute bg-gradient-to-r from-indigo-500 to-green-500",
                orientation === "horizontal" ? "h-full" : "w-full"
              )}
              initial={{
                [orientation === "horizontal" ? "width" : "height"]: "0%",
              }}
              animate={{
                [orientation === "horizontal" ? "width" : "height"]:
                  index < currentStepIndex ? "100%" : "0%",
              }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />

            {/* Animated Arrow for Current Progress */}
            {index === currentStepIndex - 1 && status === "complete" && (
              <motion.div
                className={cn(
                  "absolute flex items-center justify-center text-indigo-600",
                  orientation === "horizontal" ? "right-0 top-1/2 -translate-y-1/2" : "bottom-0 left-1/2 -translate-x-1/2"
                )}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  animate={{ x: orientation === "horizontal" ? [0, 4, 0] : 0, y: orientation === "vertical" ? [0, 4, 0] : 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className={cn("h-3 w-3", orientation === "vertical" && "rotate-90")} />
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" ? "items-start justify-center" : "flex-col items-center space-y-8",
        className
      )}
    >
      {steps.map((step, index) => (
        <Step key={step.id} step={step} index={index} />
      ))}
    </div>
  );
}

export default Stepper;