"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useRequireAuth } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import {
  useGetApiV1SitesSiteId,
  usePostApiV1Sites,
  usePostApiV1SitesSiteIdCrawl,
  getGetApiV1SitesSiteIdQueryKey,
} from "@/lib/api/generated/queries/sites/sites";
import {
  useGetApiV1SitesSiteIdUrls,
} from "@/lib/api/generated/queries/urls/urls";
import {
  usePostApiV1BillingSubscriptions,
} from "@/lib/api/generated/queries/subscriptions/subscriptions";

// Memoized header component to prevent re-renders on form changes
const OnboardingHeader = memo(function OnboardingHeader({
  stepperSteps,
  currentStep,
  title,
  description,
  onBack,
}: {
  stepperSteps: StepperStep[];
  currentStep: string;
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <div className="glass-effect border-b border-white/10 shadow-soft">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 hover:bg-white/60"
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back
          </Button>
        </div>

        {/* Stepper */}
        <div>
          <Stepper
            steps={stepperSteps}
            currentStepId={currentStep}
            orientation="horizontal"
            className="mb-8"
          />
        </div>

        {/* Step Title & Description */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            {title}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
});

import {
  SiteUrlStep,
  AnalyzingStep,
  SitemapStep,
  PlanStep,
  CompleteStep,
  ONBOARDING_STEPS,
  PLANS,
  OnboardingStepId,
  Site,
  SiteUrl,
  PlanType,
} from "./components";

// Form schema
const siteUrlSchema = z.object({
  siteUrl: z
    .string()
    .min(1, "Website URL is required")
    .transform((val) => {
      if (val && !/^https?:\/\//.test(val)) {
        return `https://${val}`;
      }
      return val;
    })
    .pipe(z.string().url("Please enter a valid website URL")),
});

type SiteUrlForm = z.infer<typeof siteUrlSchema>;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Protected route - redirects to login if not authenticated
  const { isLoading: isAuthLoading, isAuthenticated, user } = useRequireAuth();

  // Refs to prevent stale closures
  const siteIdRef = useRef<string | null>(null);

  // State
  const [currentStep, setCurrentStep] = useState<OnboardingStepId>("site-url");
  const [siteId, setSiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAllUrls, setShowAllUrls] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("PREMIUM_ANNUAL");

  // Keep ref in sync
  useEffect(() => {
    siteIdRef.current = siteId;
  }, [siteId]);

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SiteUrlForm>({
    resolver: zodResolver(siteUrlSchema),
  });

  // Initialize from URL params (only once on mount)
  useEffect(() => {
    const step = searchParams.get("step") as OnboardingStepId | null;
    const id = searchParams.get("siteId");

    if (step && ONBOARDING_STEPS.find((s) => s.id === step)) {
      setCurrentStep(step);
    }
    if (id) {
      setSiteId(id);
    }
  }, [searchParams]);

  // Show loading state while auth is hydrating
  if (isAuthLoading) {
    return <AuthLoading message="Verifying authentication" />;
  }

  // Fetch site data
  const { data: site } = useGetApiV1SitesSiteId(siteId!, {
    query: {
      enabled: isAuthenticated && !!siteId,
      refetchInterval: (query) => {
        const siteData = query.state.data;
        // Only poll during crawling
        if (currentStep === "analyzing" &&
            (siteData?.crawlStatus === "CRAWLING" || siteData?.crawlStatus === "PENDING")) {
          return 3000;
        }
        return false;
      },
    },
  });

  // Fetch URLs when needed
  const { data: urls = [] } = useGetApiV1SitesSiteIdUrls(
    siteId!,
    {},
    {
      query: {
        enabled: isAuthenticated && !!siteId && (currentStep === "sitemap" || site?.crawlStatus === "COMPLETED"),
      },
    }
  );

  // Mutations
  const createSiteMutation = usePostApiV1Sites();
  const crawlMutation = usePostApiV1SitesSiteIdCrawl();
  const subscriptionMutation = usePostApiV1BillingSubscriptions();

  // Handle crawl completion - auto-advance to next step
  useEffect(() => {
    if (site && currentStep === "analyzing" && site.crawlStatus === "COMPLETED") {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setCurrentStep("sitemap");
        updateUrl("sitemap");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [site?.crawlStatus, currentStep]);

  // URL update helper
  const updateUrl = useCallback(
    (step: OnboardingStepId, id?: string) => {
      const params = new URLSearchParams();
      params.set("step", step);
      const effectiveSiteId = id || siteIdRef.current;
      if (effectiveSiteId) {
        params.set("siteId", effectiveSiteId);
      }
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
    []
  );

  // Step handlers
  const handleSiteUrlSubmit = useCallback(
    async (data: SiteUrlForm) => {
      if (isLoading) return;

      try {
        setIsLoading(true);
        setError("");

        const newSite = await createSiteMutation.mutateAsync({
          data: {
            siteUrl: data.siteUrl,
            siteName: new URL(data.siteUrl).hostname,
          },
        });

        setSiteId(newSite.id);
        setCurrentStep("analyzing");
        updateUrl("analyzing", newSite.id);
      } catch (err: unknown) {
        const error = err as { response?: { status?: number; data?: { message?: string } } };
        console.error("Error creating site:", error);
        if (error.response?.status === 409) {
          setError("This website is already connected to your account");
        } else {
          setError(
            error.response?.data?.message ||
              "Failed to add website. Please check the URL and try again."
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, createSiteMutation, updateUrl]
  );

  const handleAnalyzingContinue = useCallback(() => {
    setCurrentStep("sitemap");
    updateUrl("sitemap");
  }, [updateUrl]);

  const handleAnalyzingRetry = useCallback(async () => {
    if (!siteId) return;

    try {
      setError("");
      await crawlMutation.mutateAsync({ siteId });
      // Invalidate and refetch site data
      queryClient.invalidateQueries({ queryKey: getGetApiV1SitesSiteIdQueryKey(siteId) });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to retry analysis. Please try again.");
    }
  }, [siteId, crawlMutation, queryClient]);

  const handleAnalyzingBack = useCallback(() => {
    setCurrentStep("site-url");
    updateUrl("site-url");
    // Reset state for new attempt
    setSiteId(null);
    setError("");
  }, [updateUrl]);

  const handleSitemapContinue = useCallback(() => {
    setCurrentStep("plan");
    updateUrl("plan");
  }, [updateUrl]);

  const handlePlanSelect = useCallback((planId: PlanType) => {
    setSelectedPlan(planId);
  }, []);

  const handlePlanSubmit = useCallback(async () => {
    if (isLoading || !siteId) return;

    try {
      setIsLoading(true);
      setError("");

      await subscriptionMutation.mutateAsync({
        data: {
          siteId: siteId,
          planType: selectedPlan,
        },
      });

      setCurrentStep("complete");
      updateUrl("complete");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Error creating subscription:", error);
      setError(
        error.response?.data?.message ||
          "Failed to create subscription. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, siteId, selectedPlan, subscriptionMutation, updateUrl]);

  const handleComplete = useCallback(() => {
    router.push(`/sites/${siteId}`);
  }, [router, siteId]);

  const handleBack = useCallback(() => {
    const stepIndex = ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);
    if (stepIndex > 0) {
      const prevStep = ONBOARDING_STEPS[stepIndex - 1].id as OnboardingStepId;
      setCurrentStep(prevStep);
      updateUrl(prevStep);
    } else {
      router.push("/dashboard");
    }
  }, [currentStep, router, updateUrl]);

  // Computed values
  const stepperSteps = useMemo((): StepperStep[] => {
    const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);

    return ONBOARDING_STEPS.map((step, stepIndex) => {
      let status: "complete" | "current" | "waiting";
      if (stepIndex < currentIndex) {
        status = "complete";
      } else if (stepIndex === currentIndex) {
        status = "current";
      } else {
        status = "waiting";
      }

      return { ...step, status };
    });
  }, [currentStep]);

  const { title, description } = useMemo(() => {
    switch (currentStep) {
      case "site-url":
        return {
          title: "Connect Your Website",
          description:
            "Enter your website URL to start building your AI-powered chat assistant",
        };
      case "analyzing":
        if (site?.crawlStatus === "FAILED") {
          return {
            title: "Analysis Failed",
            description:
              "We encountered an issue while analyzing your website. Please try again.",
          };
        }
        if (site?.crawlStatus === "COMPLETED") {
          return {
            title: "Analysis Complete!",
            description: `We've successfully analyzed your website and discovered ${urls.length} pages.`,
          };
        }
        return {
          title: "Analyzing Your Website",
          description:
            "We're discovering and analyzing all the pages on your website. This usually takes 1-2 minutes.",
        };
      case "sitemap":
        return {
          title: "Review Your Content",
          description:
            "Review the pages we found and customize what your AI assistant will know about",
        };
      case "plan":
        return {
          title: "Choose Your Plan",
          description:
            "Select a subscription plan to activate your AI assistant and start helping your visitors",
        };
      case "complete":
        return {
          title: "Welcome to Intelligentconvo!",
          description:
            "Your AI assistant is ready to help your website visitors. Let's get you started!",
        };
      default:
        return {
          title: "Setup Your AI Assistant",
          description: "",
        };
    }
  }, [currentStep, site?.crawlStatus, urls.length]);

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-surface">
      <DashboardHeader
        variant="site"
        showBackButton={false}
        showNavigation={false}
        showQuickActions={false}
      />

      {/* Progress Header - Memoized to prevent re-renders */}
      <OnboardingHeader
        stepperSteps={stepperSteps}
        currentStep={currentStep}
        title={title}
        description={description}
        onBack={handleBack}
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {currentStep === "site-url" && (
              <SiteUrlStep
                key="site-url"
                onSubmit={handleSubmit(handleSiteUrlSubmit)}
                isLoading={isLoading}
                error={error}
                register={register}
                errors={errors}
                setValue={setValue}
              />
            )}

            {currentStep === "analyzing" && (
              <AnalyzingStep
                key="analyzing"
                site={site}
                onContinue={handleAnalyzingContinue}
                onRetry={handleAnalyzingRetry}
                onBack={handleAnalyzingBack}
              />
            )}

            {currentStep === "sitemap" && (
              <SitemapStep
                key="sitemap"
                site={site}
                urls={urls}
                showAll={showAllUrls}
                onToggleShowAll={() => setShowAllUrls(!showAllUrls)}
                onContinue={handleSitemapContinue}
              />
            )}

            {currentStep === "plan" && (
              <PlanStep
                key="plan"
                plans={PLANS}
                selectedPlan={selectedPlan}
                onPlanSelect={handlePlanSelect}
                onSubmit={handlePlanSubmit}
                isLoading={isLoading}
                error={error}
              />
            )}

            {currentStep === "complete" && (
              <CompleteStep
                key="complete"
                site={site}
                user={user}
                onContinue={handleComplete}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-16 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-16 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={<LoadingSpinner size="lg" text="Loading onboarding..." centered />}
    >
      <OnboardingContent />
    </Suspense>
  );
}
