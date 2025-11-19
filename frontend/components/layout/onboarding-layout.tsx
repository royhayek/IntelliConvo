"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, Zap, Shield, CheckCircle, Settings } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";

interface OnboardingLayoutProps {
  currentStep: "site-url" | "analyzing" | "sitemap" | "plan" | "complete";
  children: React.ReactNode;
  title?: string;
  description?: string;
  showBackButton?: boolean;
  siteId?: string;
  siteName?: string;
  className?: string;
}

const onboardingSteps: StepperStep[] = [
  {
    id: "site-url",
    title: "Enter Website",
    description: "Provide your website URL",
    icon: <Globe className="h-4 w-4" />,
    status: "waiting",
  },
  {
    id: "analyzing",
    title: "Analyzing Site",
    description: "Crawling your website content",
    icon: <Zap className="h-4 w-4" />,
    status: "waiting",
  },
  {
    id: "sitemap",
    title: "Review Content",
    description: "Check discovered pages",
    icon: <Settings className="h-4 w-4" />,
    status: "waiting",
  },
  {
    id: "plan",
    title: "Choose Plan",
    description: "Select subscription tier",
    icon: <Shield className="h-4 w-4" />,
    status: "waiting",
  },
  {
    id: "complete",
    title: "All Set!",
    description: "Setup completed",
    icon: <CheckCircle className="h-4 w-4" />,
    status: "waiting",
  },
];

export function OnboardingLayout({
  currentStep,
  children,
  title,
  description,
  showBackButton = true,
  siteId,
  siteName,
  className = "",
}: OnboardingLayoutProps) {
  const router = useRouter();

  const getUpdatedSteps = (): StepperStep[] => {
    return onboardingSteps.map(step => {
      if (step.id === currentStep) {
        return { ...step, status: "current" as const };
      }
      const currentIndex = onboardingSteps.findIndex(s => s.id === currentStep);
      const stepIndex = onboardingSteps.findIndex(s => s.id === step.id);

      if (stepIndex < currentIndex) {
        return { ...step, status: "complete" as const };
      }
      return { ...step, status: "waiting" as const };
    });
  };

  const handleBack = () => {
    const currentIndex = onboardingSteps.findIndex(s => s.id === currentStep);

    if (currentStep === "site-url") {
      router.push("/dashboard");
      return;
    }

    if (currentStep === "analyzing" || currentStep === "sitemap") {
      router.push("/dashboard");
      return;
    }

    if (currentStep === "plan" && siteId) {
      router.push(`/onboarding/sitemap/${siteId}`);
      return;
    }

    if (currentStep === "complete" && siteId) {
      router.push(`/onboarding/plan/${siteId}`);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen gradient-surface">
      <DashboardHeader variant="site" showBackButton={false} showNavigation={false} showQuickActions={false} />

      {/* Progress Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect border-b border-white/10 shadow-soft"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          {showBackButton && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 hover:bg-white/60"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </motion.div>
          )}

          {/* Stepper */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Stepper
              steps={getUpdatedSteps()}
              currentStepId={currentStep}
              orientation="horizontal"
              className="mb-8"
            />
          </motion.div>

          {/* Step Title & Description */}
          {(title || description) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              {title && (
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {description}
                </p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <main className={`max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-8"
        >
          {children}
        </motion.div>
      </main>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-16 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-16 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

export default OnboardingLayout;