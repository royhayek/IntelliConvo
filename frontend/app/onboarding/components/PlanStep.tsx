"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
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
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p className="text-sm text-red-800">{error}</p>
        </motion.div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? "border-indigo-500 ring-4 ring-indigo-100"
                : "border-gray-200 hover:border-indigo-200"
            }`}
            onClick={() => onPlanSelect(plan.id as PlanType)}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-600 ml-2">{plan.period}</span>
                {plan.originalPrice && (
                  <div className="text-sm text-gray-500">
                    <span className="line-through">{plan.originalPrice}</span>
                    <span className="ml-2 text-green-600 font-medium">
                      {plan.savings}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-6">{plan.description}</p>

              <div className="space-y-3 text-left">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedPlan === plan.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 h-6 w-6 bg-indigo-600 rounded-full flex items-center justify-center"
              >
                <Check className="h-4 w-4 text-white" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-3"
        >
          {isLoading ? (
            <div className="flex items-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"
              />
              Processing...
            </div>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Start 14-Day Free Trial
            </>
          )}
        </Button>
        <p className="text-sm text-gray-600 mt-2">
          No credit card required • Cancel anytime
        </p>
      </div>
    </motion.div>
  );
});
