"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Plan, PlanType } from "./types";

interface PlanStepProps {
  plans: Plan[];
  selectedPlan: PlanType;
  onPlanSelect: (planId: PlanType) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
}

export const PlanStep = memo(function PlanStep({
  plans,
  selectedPlan,
  onPlanSelect,
  onSubmit,
  isLoading,
  error,
}: PlanStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Horizontal Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <motion.div
              key={plan.id}
              className={cn(
                "relative bg-white dark:bg-slate-800 rounded-xl border-2 p-5 cursor-pointer transition-all",
                isSelected
                  ? "border-indigo-500 shadow-lg ring-2 ring-indigo-100 dark:ring-indigo-900/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
              onClick={() => onPlanSelect(plan.id as PlanType)}
              whileTap={{ scale: 0.98 }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Selection indicator */}
              <div
                className={cn(
                  "absolute top-4 right-4 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "border-indigo-600 bg-indigo-600"
                    : "border-gray-300 dark:border-gray-600"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>

              {/* Plan header */}
              <div className="text-center mb-4 pt-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {plan.period}
                  </span>
                </div>
                {plan.savings && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-400 line-through mr-1">
                      {plan.originalPrice}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {plan.savings}
                    </span>
                  </div>
                )}
              </div>

              {/* Features list */}
              <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Subscribe Now"
        )}
      </Button>

      <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
        Secure payment via Stripe. Cancel anytime.
      </p>
    </motion.div>
  );
});
