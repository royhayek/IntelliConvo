import { StepperStep } from "@/components/ui/stepper";

// Simplified types for onboarding UI components
// These match the partial data returned by API responses
export interface Site {
  id: string;
  siteUrl: string;
  siteName: string;
  crawlStatus: "PENDING" | "CRAWLING" | "PAUSED" | "COMPLETED" | "FAILED" | "AWAITING_PAYMENT" | "PROCESSING" | "READY" | "PARTIAL";
  urlCount?: number;
}

export interface SiteUrl {
  id?: string;
  url?: string;
  title?: string | null;
  content?: string | null;
  htmlContent?: string | null;
  isExcluded?: boolean;
  isActive?: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
}

export type PlanType = "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";

export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  originalPrice?: string;
  savings?: string;
  popular?: boolean;
  trialDays?: number;
}

export type OnboardingStepId = "site-url" | "select-urls" | "crawling" | "plan" | "complete";

export const ONBOARDING_STEPS: StepperStep[] = [
  {
    id: "site-url",
    title: "Enter Website",
    description: "Provide your website URL",
    status: "current",
  },
  {
    id: "select-urls",
    title: "Select Pages",
    description: "Choose which pages to include",
    status: "waiting",
  },
  {
    id: "crawling",
    title: "Crawling",
    description: "Extracting content",
    status: "waiting",
  },
  {
    id: "plan",
    title: "Choose Plan",
    description: "Select subscription tier",
    status: "waiting",
  },
  {
    id: "complete",
    title: "All Set!",
    description: "Setup completed",
    status: "waiting",
  },
];

// Legacy step IDs for backwards compatibility
export type LegacyOnboardingStepId = "analyzing" | "sitemap";

export const PLANS: Plan[] = [
  {
    id: "PREMIUM_MONTHLY",
    name: "Premium Monthly",
    price: "$29",
    period: "per month",
    description: "Perfect for trying out our service",
    features: [
      "Unlimited conversations",
      "Advanced AI responses",
      "Priority support",
      "Custom styling",
      "Analytics dashboard",
    ],
  },
  {
    id: "PREMIUM_ANNUAL",
    name: "Premium Annual",
    price: "$290",
    period: "per year",
    originalPrice: "$348",
    savings: "Save $58",
    description: "Best value for serious businesses",
    features: [
      "Everything in Monthly",
      "2 months free",
      "Priority feature requests",
      "Dedicated account manager",
      "White-label options",
    ],
    popular: true,
  },
];
