"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRequireUser } from "@/lib/hooks/useAuth";
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
  useGetApiV1BillingPlans,
} from "@/lib/api/generated/queries/subscriptions/subscriptions";
import { useSiteSocket, CrawlProgressUpdate } from "@/lib/hooks/useSiteSocket";

import {
  SiteUrlStep,
  AnalyzingStep,
  SitemapStep,
  PlanStep,
  CompleteStep,
  CompactStepper,
  ONBOARDING_STEPS,
  OnboardingStepId,
  PlanType,
  Plan,
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

  // Protected route - redirects to login if not authenticated, admins to admin portal
  const { isLoading: isAuthLoading, isAuthenticated, user } = useRequireUser();

  // Refs to prevent stale closures
  const siteIdRef = useRef<string | null>(null);

  // State
  const [currentStep, setCurrentStep] = useState<OnboardingStepId>("site-url");
  const [siteId, setSiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAllUrls, setShowAllUrls] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("PREMIUM_ANNUAL");
  const [crawlProgress, setCrawlProgress] = useState<{ crawled: number; total: number } | null>(null);

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

  // Fetch site data - ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // Note: No polling needed - Socket.io provides real-time crawl status updates
  // via useSiteSocket hook which triggers queryClient.invalidateQueries()
  const { data: site } = useGetApiV1SitesSiteId(siteId!, {
    query: {
      enabled: !isAuthLoading && isAuthenticated && !!siteId,
    },
  });

  // Fetch URLs when needed (AWAITING_PAYMENT means crawl is done, waiting for payment)
  const crawlStatus = site?.crawlStatus as string | undefined;
  const { data: urls = [] } = useGetApiV1SitesSiteIdUrls(
    siteId!,
    {},
    {
      query: {
        enabled: !isAuthLoading && isAuthenticated && !!siteId && (currentStep === "sitemap" || crawlStatus === "AWAITING_PAYMENT"),
      },
    }
  );

  // Mutations
  const createSiteMutation = usePostApiV1Sites();
  const crawlMutation = usePostApiV1SitesSiteIdCrawl();
  const subscriptionMutation = usePostApiV1BillingSubscriptions();

  // Fetch plans from Stripe via API
  const { data: apiPlans = [] } = useGetApiV1BillingPlans({
    query: {
      enabled: !isAuthLoading && isAuthenticated,
      staleTime: 1000 * 60 * 60,
    },
  });

  // Transform API plans to match PlanStep component format
  const plans: Plan[] = useMemo(() => {
    if (apiPlans.length === 0) {
      return [];
    }

    return apiPlans.map((plan) => {
      const isAnnual = plan.interval === "annual";
      return {
        id: plan.id,
        name: plan.name,
        price: `$${plan.price}`,
        period: isAnnual ? "per year" : "per month",
        description: plan.description,
        features: plan.features,
        ...(isAnnual && {
          originalPrice: `$${Math.round(((plan.price / 10) * 12))}`,
          savings: `Save $${Math.round(((plan.price / 10) * 12) - plan.price)}`,
          popular: true,
        }),
      };
    });
  }, [apiPlans]);

  // Socket connection for real-time crawl status updates
  const handleCrawlStatusUpdate = useCallback(
    (update: { siteId: string; crawlStatus: string; urlCount?: number }) => {
      if (update.siteId === siteId) {
        queryClient.invalidateQueries({ queryKey: getGetApiV1SitesSiteIdQueryKey(siteId) });
        // Reset progress when crawl completes
        if (update.crawlStatus === "AWAITING_PAYMENT" || update.crawlStatus === "FAILED") {
          setCrawlProgress(null);
        }
      }
    },
    [siteId, queryClient]
  );

  const handleCrawlProgress = useCallback(
    (update: CrawlProgressUpdate) => {
      if (update.siteId === siteId) {
        setCrawlProgress({ crawled: update.crawled, total: update.total });
      }
    },
    [siteId]
  );

  useSiteSocket({
    siteId: currentStep === "analyzing" ? siteId : null,
    onCrawlStatusUpdate: handleCrawlStatusUpdate,
    onCrawlProgress: handleCrawlProgress,
    autoConnect: true,
  });

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

  // Handle crawl completion - auto-advance to next step immediately
  useEffect(() => {
    if (site && currentStep === "analyzing" && crawlStatus === "AWAITING_PAYMENT") {
      setCurrentStep("sitemap");
      updateUrl("sitemap");
    }
  }, [site, crawlStatus, currentStep, updateUrl]);

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
      queryClient.invalidateQueries({ queryKey: getGetApiV1SitesSiteIdQueryKey(siteId) });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to retry analysis. Please try again.");
    }
  }, [siteId, crawlMutation, queryClient]);

  const handleAnalyzingBack = useCallback(() => {
    setCurrentStep("site-url");
    updateUrl("site-url");
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

      const result = await subscriptionMutation.mutateAsync({
        data: {
          siteId: siteId,
          planType: selectedPlan,
        },
      });

      // Type assertion for checkoutUrl which is returned by backend but not in generated types
      const checkoutUrl = (result as { checkoutUrl?: string }).checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setCurrentStep("complete");
        updateUrl("complete");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Error creating subscription:", error);
      setError(
        error.response?.data?.message ||
          "Failed to create subscription. Please try again."
      );
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
  const currentStepIndex = useMemo(() => {
    return ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);
  }, [currentStep]);

  const { title, description } = useMemo(() => {
    switch (currentStep) {
      case "site-url":
        return {
          title: "Connect Your Website",
          description: "Enter your website URL to get started",
        };
      case "analyzing":
        if (crawlStatus === "FAILED") {
          return {
            title: "Analysis Failed",
            description: "We encountered an issue analyzing your website",
          };
        }
        if (crawlStatus === "AWAITING_PAYMENT") {
          return {
            title: "Analysis Complete!",
            description: `Found ${urls.length} pages on your website`,
          };
        }
        return {
          title: "Analyzing Website",
          description: "Discovering pages on your website...",
        };
      case "sitemap":
        return {
          title: "Select Pages",
          description: "Preview and choose which pages to include",
        };
      case "plan":
        return {
          title: "Choose Your Plan",
          description: "Select a subscription to activate your AI assistant",
        };
      case "complete":
        return {
          title: "You're All Set!",
          description: "Your AI assistant is ready",
        };
      default:
        return {
          title: "Setup",
          description: "",
        };
    }
  }, [currentStep, crawlStatus, urls.length]);

  // Show loading state while auth is hydrating
  if (isAuthLoading) {
    return <AuthLoading message="Verifying authentication" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Compact Stepper */}
        <CompactStepper
          steps={ONBOARDING_STEPS}
          currentStepIndex={currentStepIndex}
          className="mb-6"
        />

        {/* Title & Description */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        {/* Step Content */}
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
              crawlProgress={crawlProgress}
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
              plans={plans}
              selectedPlan={selectedPlan}
              onPlanSelect={handlePlanSelect}
              onSubmit={handlePlanSubmit}
              isLoading={isLoading || plans.length === 0}
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
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={<LoadingSpinner size="lg" text="Loading..." centered />}
    >
      <OnboardingContent />
    </Suspense>
  );
}
