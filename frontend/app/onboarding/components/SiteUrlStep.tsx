"use client";

import { memo } from "react";
import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { motion } from "framer-motion";
import { Globe, Loader2, Search, FileCheck, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SiteUrlFormData {
  siteUrl: string;
}

interface SiteUrlStepProps {
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  register: UseFormRegister<SiteUrlFormData>;
  errors: FieldErrors<SiteUrlFormData>;
  setValue: UseFormSetValue<SiteUrlFormData>;
}

export const SiteUrlStep = memo(function SiteUrlStep({
  onSubmit,
  isLoading,
  error,
  register,
  errors,
  setValue,
}: SiteUrlStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                {...register("siteUrl")}
                type="text"
                placeholder="example.com"
                disabled={isLoading}
                className="pl-9 h-11"
                onChange={(e) => {
                  setValue("siteUrl", e.target.value, { shouldValidate: true });
                }}
              />
            </div>
            {errors.siteUrl && (
              <p className="text-xs text-red-600">{errors.siteUrl.message}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              We'll automatically add https:// if needed
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>

        {/* What's next - horizontal on desktop, vertical on mobile */}
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 text-center">What happens next</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center p-2">
              <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-1.5">
                <Search className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">Scan pages</span>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-1.5">
                <FileCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">Review & select</span>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-1.5">
                <Rocket className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">Deploy AI</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
