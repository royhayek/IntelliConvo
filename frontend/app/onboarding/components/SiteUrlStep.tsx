"use client";

import { memo } from "react";
import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { motion } from "framer-motion";
import { Globe, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      {/* Hero Section */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 mx-auto mb-6 flex items-center justify-center shadow-lg"
        >
          <Globe className="h-10 w-10 text-white" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto"
        >
          We'll crawl your website, analyze your content, and create a smart AI
          assistant that can help your visitors instantly.
        </motion.p>
      </div>

      {/* URL Input Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <div className="space-y-4">
            <Label
              htmlFor="siteUrl"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Website URL
            </Label>
            <div className="space-y-2">
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  {...register("siteUrl")}
                  type="text"
                  placeholder="www.example.com or example.com"
                  disabled={isLoading}
                  className="pl-12 text-lg h-14 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) => {
                    setValue("siteUrl", e.target.value, { shouldValidate: true });
                  }}
                />
                <ExternalLink className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              {errors.siteUrl && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600"
                >
                  {errors.siteUrl.message}
                </motion.p>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We'll automatically add https:// if not provided
            </p>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"
                  />
                  Connecting to your website...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  Continue with Setup
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-8 text-center">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
            What happens next?
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800 dark:text-blue-300">
            <div className="flex items-start space-x-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold">1</span>
              </div>
              <span>We'll scan your website and discover all pages</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold">2</span>
              </div>
              <span>You'll review and customize the discovered content</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="h-6 w-6 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold">3</span>
              </div>
              <span>Choose a plan and deploy your AI assistant</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
