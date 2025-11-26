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
  getGetApiV1SitesSiteIdQueryKey,
  usePostApiV1SitesSiteIdDiscover,
  useGetApiV1SitesSiteIdDiscovery,
  usePutApiV1SitesSiteIdDiscoverySelections,
  usePostApiV1SitesSiteIdDiscoveryBulkSelect,
  usePostApiV1SitesSiteIdDiscoveryManualUrls,
  usePostApiV1SitesSiteIdCrawlSelective,
} from "@/lib/api/generated/queries/sites/sites";
import {
  useGetApiV1SitesSiteIdUrls,
} from "@/lib/api/generated/queries/urls/urls";
import {
  usePostApiV1BillingSubscriptions,
  useGetApiV1BillingPlans,
} from "@/lib/api/generated/queries/subscriptions/subscriptions";
import { useSiteSocket, CrawlProgressUpdate, EmbeddingProgressUpdate } from "@/lib/hooks/useSiteSocket";

import {
  SiteUrlStep,
  AnalyzingStep,
  PlanStep,
  CompleteStep,
  CompactStepper,
  UrlSelectionStep,
  ONBOARDING_STEPS,
  OnboardingStepId,
  PlanType,
  Plan,
  DiscoveryResult,
} from "./components";

// Helper function to extract clean site name from URL (removes www.)
function extractSiteName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
  } catch {
    return url;
  }
}

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
  const initializedRef = useRef(false);

  // State
  const [currentStep, setCurrentStep] = useState<OnboardingStepId>("site-url");
  const [siteId, setSiteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("PREMIUM_ANNUAL");
  const [crawlProgress, setCrawlProgress] = useState<{
    crawled: number;
    total: number;
    estimatedSecondsRemaining?: number;
    currentUrl?: string;
    phase: 'discovery' | 'crawling' | 'embedding';
    successCount?: number;
    failedCount?: number;
  } | null>(null);

  // Discovery state
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Pending site URL (stored before site creation)
  // Site is only created when entering Step 2, not in Step 1
  const [pendingSiteUrl, setPendingSiteUrl] = useState<string | null>(null);

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

  // Initialize from URL params and localStorage (only once on mount)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const step = searchParams.get("step") as OnboardingStepId | null;
    const id = searchParams.get("siteId");

    // Handle legacy step IDs
    let effectiveStep = step;
    if (step === "analyzing" as string) effectiveStep = "crawling";
    if (step === "sitemap" as string) effectiveStep = "select-urls";

    if (effectiveStep && ONBOARDING_STEPS.find((s) => s.id === effectiveStep)) {
      setCurrentStep(effectiveStep);
    }
    if (id) {
      setSiteId(id);
    }

    // Restore pending site URL from localStorage (for page refresh recovery)
    const storedPendingUrl = localStorage.getItem("onboarding_pending_site_url");
    if (storedPendingUrl && !id) {
      setPendingSiteUrl(storedPendingUrl);
    }
  }, [searchParams]);

  // Fetch site data
  const { data: site } = useGetApiV1SitesSiteId(siteId!, {
    query: {
      enabled: !isAuthLoading && isAuthenticated && !!siteId,
    },
  });

  // Fetch URLs when needed (for crawling step review)
  const crawlStatus = site?.crawlStatus as string | undefined;
  const { data: urls = [] } = useGetApiV1SitesSiteIdUrls(
    siteId!,
    {},
    {
      query: {
        enabled: !isAuthLoading && isAuthenticated && !!siteId && crawlStatus === "AWAITING_PAYMENT",
      },
    }
  );

  // Mutations
  const createSiteMutation = usePostApiV1Sites();
  const subscriptionMutation = usePostApiV1BillingSubscriptions();

  // Discovery mutations
  const discoverMutation = usePostApiV1SitesSiteIdDiscover();
  const updateSelectionsMutation = usePutApiV1SitesSiteIdDiscoverySelections();
  const bulkSelectMutation = usePostApiV1SitesSiteIdDiscoveryBulkSelect();
  const addManualUrlsMutation = usePostApiV1SitesSiteIdDiscoveryManualUrls();
  const selectiveCrawlMutation = usePostApiV1SitesSiteIdCrawlSelective();

  // Discovery query with polling support
  const {
    data: discoveryQueryData,
    refetch: refetchDiscovery,
  } = useGetApiV1SitesSiteIdDiscovery(siteId!, {
    query: {
      enabled: !isAuthLoading && isAuthenticated && !!siteId && isDiscovering,
      refetchInterval: isDiscovering ? 1000 : false, // Poll every 1s when discovering
    },
  });

  // Update discovery state when query data changes
  useEffect(() => {
    if (discoveryQueryData) {
      if (discoveryQueryData.status === "COMPLETED") {
        setDiscovery(discoveryQueryData);
        setIsDiscovering(false);
      } else if (discoveryQueryData.status === "FAILED") {
        setIsDiscovering(false);
        setError("Discovery failed. Please try again.");
      }
    }
  }, [discoveryQueryData]);

  // URL update helper - moved here because it's used by the site creation effect below
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

  // Create site and start discovery when entering Step 2 with a pending URL
  // This defers site creation from Step 1 to Step 2, avoiding DB pollution
  const isCreatingSiteRef = useRef(false);
  useEffect(() => {
    // Only run when:
    // 1. We're on the select-urls step
    // 2. We have a pending URL but no siteId yet
    // 3. Not already creating a site
    // 4. Auth is ready
    if (
      currentStep !== "select-urls" ||
      !pendingSiteUrl ||
      siteId ||
      isCreatingSiteRef.current ||
      isAuthLoading ||
      !isAuthenticated
    ) {
      return;
    }

    const createSiteAndStartDiscovery = async () => {
      isCreatingSiteRef.current = true;
      setIsLoading(true);
      setError("");

      try {
        // Create the site
        const newSite = await createSiteMutation.mutateAsync({
          data: {
            siteUrl: pendingSiteUrl,
            siteName: extractSiteName(pendingSiteUrl),
          },
        });

        // Clear pending URL from localStorage (site is now created)
        localStorage.removeItem("onboarding_pending_site_url");
        setPendingSiteUrl(null);

        // Set siteId and update URL
        setSiteId(newSite.id);
        updateUrl("select-urls", newSite.id);

        // Auto-start discovery using the mutation
        setIsDiscovering(true);
        try {
          await discoverMutation.mutateAsync({ siteId: newSite.id });
          // Polling is handled automatically by the discoveryQueryData effect
        } catch (discoverErr) {
          console.error("Discovery error:", discoverErr);
          setIsDiscovering(false);
          setError("Failed to discover pages. Please try again.");
        }
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
        // Go back to step 1 on error
        setCurrentStep("site-url");
        updateUrl("site-url");
      } finally {
        setIsLoading(false);
        isCreatingSiteRef.current = false;
      }
    };

    createSiteAndStartDiscovery();
  }, [currentStep, pendingSiteUrl, siteId, isAuthLoading, isAuthenticated, createSiteMutation, discoverMutation, updateUrl]);

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
      const trialDays = plan.trialDays;
      return {
        id: plan.id,
        name: plan.name,
        price: `$${plan.price}`,
        period: isAnnual ? "per year" : "per month",
        description: plan.description,
        features: plan.features,
        ...(trialDays && trialDays > 0 && { trialDays }),
        ...(isAnnual && {
          originalPrice: `$${Math.round(((plan.price / 10) * 12))}`,
          savings: `Save $${Math.round(((plan.price / 10) * 12) - plan.price)}`,
          popular: true,
        }),
      };
    });
  }, [apiPlans]);

  // Socket connection for real-time updates
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
        setCrawlProgress({
          crawled: update.crawled,
          total: update.total,
          estimatedSecondsRemaining: update.estimatedSecondsRemaining,
          currentUrl: update.currentUrl,
          phase: 'crawling',
          successCount: update.successCount,
          failedCount: update.failedCount,
        });
      }
    },
    [siteId]
  );

  // Handle discovery status updates via socket
  const handleDiscoveryStatusUpdate = useCallback(
    (update: { siteId: string; status: string; urlCount?: number }) => {
      if (update.siteId === siteId) {
        if (update.status === "COMPLETED") {
          // Fetch discovery results
          fetchDiscoveryResults();
          setIsDiscovering(false);
        } else if (update.status === "FAILED") {
          setIsDiscovering(false);
          setError("Failed to discover URLs. Please try again.");
        }
      }
    },
    [siteId]
  );

  // Handle embedding progress updates via socket
  const handleEmbeddingProgress = useCallback(
    (update: EmbeddingProgressUpdate) => {
      if (update.siteId === siteId) {
        setCrawlProgress({
          crawled: update.completed,
          total: update.total,
          estimatedSecondsRemaining: update.estimatedSecondsRemaining,
          currentUrl: update.currentUrl,
          phase: 'embedding',
        });
      }
    },
    [siteId]
  );

  useSiteSocket({
    siteId: (currentStep === "crawling" || currentStep === "select-urls") ? siteId : null,
    onCrawlStatusUpdate: handleCrawlStatusUpdate,
    onCrawlProgress: handleCrawlProgress,
    onDiscoveryStatusUpdate: handleDiscoveryStatusUpdate,
    onEmbeddingProgress: handleEmbeddingProgress,
    autoConnect: true,
  });

  // Handle crawl completion - auto-advance to plan step
  useEffect(() => {
    if (site && currentStep === "crawling" && crawlStatus === "AWAITING_PAYMENT") {
      setCurrentStep("plan");
      updateUrl("plan");
    }
  }, [site, crawlStatus, currentStep, updateUrl]);

  // ============================================
  // Discovery API Functions
  // ============================================

  const startDiscovery = useCallback(async () => {
    if (!siteId) return;

    try {
      setIsDiscovering(true);
      setError("");
      await discoverMutation.mutateAsync({ siteId });
      // Polling is handled automatically by the discoveryQueryData effect with refetchInterval
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to start discovery");
      setIsDiscovering(false);
    }
  }, [siteId, discoverMutation]);

  const fetchDiscoveryResults = useCallback(async () => {
    if (!siteId) return;
    // Trigger a refetch of the discovery query
    const result = await refetchDiscovery();
    if (result.data) {
      setDiscovery(result.data);
      return result.data;
    }
    return null;
  }, [siteId, refetchDiscovery]);

  const updateSelections = useCallback(async (selections: { url: string; selected: boolean }[]) => {
    if (!siteId) return;

    try {
      const response = await updateSelectionsMutation.mutateAsync({
        siteId,
        data: { selections },
      });
      // Update local discovery state
      setDiscovery(prev => prev ? {
        ...prev,
        selectedCount: response.selectedCount,
        estimatedCrawlTime: response.estimatedCrawlTime,
      } : null);
    } catch (err) {
      console.error("Failed to update selections:", err);
    }
  }, [siteId, updateSelectionsMutation]);

  const bulkSelect = useCallback(async (action: "select" | "deselect", category?: string) => {
    if (!siteId) return;

    try {
      const response = await bulkSelectMutation.mutateAsync({
        siteId,
        data: {
          action,
          category: (category || "all") as "homepage" | "product" | "blog" | "about" | "support" | "other" | "all",
        },
      });
      // Update local discovery state
      setDiscovery(prev => prev ? {
        ...prev,
        selectedCount: response.selectedCount,
        estimatedCrawlTime: response.estimatedCrawlTime,
      } : null);
      // Refetch full results to update URL selections
      fetchDiscoveryResults();
    } catch (err) {
      console.error("Failed to bulk select:", err);
    }
  }, [siteId, bulkSelectMutation, fetchDiscoveryResults]);

  const addManualUrls = useCallback(async (urls: string[]) => {
    if (!siteId) return;

    try {
      await addManualUrlsMutation.mutateAsync({
        siteId,
        data: { urls },
      });
      // Refetch discovery results
      fetchDiscoveryResults();
    } catch (err) {
      console.error("Failed to add manual URLs:", err);
    }
  }, [siteId, addManualUrlsMutation, fetchDiscoveryResults]);

  const startSelectiveCrawl = useCallback(async (selectedUrls: string[]) => {
    if (!siteId) return;

    try {
      setIsLoading(true);
      setError("");
      console.log(`[Selective Crawl] Sending ${selectedUrls.length} URLs to backend:`, selectedUrls.slice(0, 5));
      const response = await selectiveCrawlMutation.mutateAsync({
        siteId,
        data: {
          mode: "selective",
          urls: selectedUrls, // Pass selected URLs directly to avoid race condition with async selection updates
        },
      });
      console.log(`[Selective Crawl] Response:`, response);
      setCurrentStep("crawling");
      updateUrl("crawling");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error(`[Selective Crawl] Error:`, error);
      setError(error.response?.data?.message || "Failed to start crawl");
    } finally {
      setIsLoading(false);
    }
  }, [siteId, selectiveCrawlMutation, updateUrl]);

  // ============================================
  // Step Handlers
  // ============================================

  const handleSiteUrlSubmit = useCallback(
    async (data: SiteUrlForm) => {
      if (isLoading) return;

      try {
        setIsLoading(true);
        setError("");

        // Validate URL format (already done by zod, but double-check)
        const url = new URL(data.siteUrl);
        const normalizedUrl = data.siteUrl;

        // Store the URL in state and localStorage (site will be created in Step 2)
        setPendingSiteUrl(normalizedUrl);
        localStorage.setItem("onboarding_pending_site_url", normalizedUrl);

        // Proceed to Step 2 - site creation will happen there
        setCurrentStep("select-urls");
        updateUrl("select-urls");

      } catch (err: unknown) {
        console.error("Error validating URL:", err);
        setError("Please enter a valid website URL");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, updateUrl]
  );

  const handleSelectUrlsContinue = useCallback((selectedUrls: string[]) => {
    startSelectiveCrawl(selectedUrls);
  }, [startSelectiveCrawl]);

  const handleSelectUrlsBack = useCallback(() => {
    setCurrentStep("site-url");
    updateUrl("site-url");
    setSiteId(null);
    setPendingSiteUrl(null);
    setDiscovery(null);
    setError("");
    // Clear localStorage to allow fresh start
    localStorage.removeItem("onboarding_pending_site_url");
  }, [updateUrl]);

  const handleCrawlingContinue = useCallback(() => {
    setCurrentStep("plan");
    updateUrl("plan");
  }, [updateUrl]);

  const handleCrawlingRetry = useCallback(async () => {
    // For retry, get selected URLs from discovery state
    const selectedUrls = discovery?.urls
      .filter(url => url.suggested)
      .map(url => url.url) || [];
    startSelectiveCrawl(selectedUrls);
  }, [startSelectiveCrawl, discovery]);

  const handleCrawlingBack = useCallback(() => {
    setCurrentStep("select-urls");
    updateUrl("select-urls");
    setError("");
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
    // Clean up any remaining localStorage from onboarding
    localStorage.removeItem("onboarding_pending_site_url");
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
      case "select-urls":
        if (isDiscovering) {
          return {
            title: "Discovering Pages",
            description: "Finding all pages on your website...",
          };
        }
        return {
          title: "Select Pages",
          description: "Choose which pages to include in your AI assistant",
        };
      case "crawling":
        if (crawlStatus === "FAILED") {
          return {
            title: "Crawl Failed",
            description: "We encountered an issue crawling your website",
          };
        }
        if (crawlStatus === "AWAITING_PAYMENT") {
          return {
            title: "Content Ready!",
            description: `Crawled ${urls.length} pages successfully`,
          };
        }
        return {
          title: "Crawling Pages",
          description: crawlProgress
            ? `Processing ${crawlProgress.crawled} of ${crawlProgress.total} pages...`
            : "Extracting content from selected pages...",
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
  }, [currentStep, crawlStatus, urls.length, isDiscovering, crawlProgress]);

  // Show loading state while auth is hydrating
  if (isAuthLoading) {
    return <AuthLoading />;
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

          {currentStep === "select-urls" && (
            <UrlSelectionStep
              key="select-urls"
              siteUrl={site?.siteUrl || pendingSiteUrl || ""}
              discovery={discovery}
              isDiscovering={isDiscovering}
              isLoading={isLoading}
              onStartDiscovery={startDiscovery}
              onUpdateSelections={updateSelections}
              onBulkSelect={bulkSelect}
              onAddManualUrls={addManualUrls}
              onContinue={handleSelectUrlsContinue}
              onBack={handleSelectUrlsBack}
              error={error}
            />
          )}

          {currentStep === "crawling" && (
            <AnalyzingStep
              key="crawling"
              site={site}
              crawlProgress={crawlProgress}
              onContinue={handleCrawlingContinue}
              onRetry={handleCrawlingRetry}
              onBack={handleCrawlingBack}
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
