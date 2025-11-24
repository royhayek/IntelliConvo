/**
 * Trial Status Hook
 * Fetches and manages trial status for a site
 */

import { useQuery } from '@tanstack/react-query';
import { customInstance } from '@/lib/api/axios-instance';

export interface TrialLimits {
  maxDays: number;
  maxConversations: number;
  maxMessages: number;
  maxUrls: number;
  trialEnabled: boolean;
}

export interface TrialStatus {
  isInTrial: boolean;
  trialExpired: boolean;
  reason?: string;
  daysRemaining?: number;
  conversationsRemaining?: number;
  messagesRemaining?: number;
  limits: TrialLimits;
}

/**
 * Fetch trial status for a site
 */
async function getTrialStatus(siteId: string): Promise<TrialStatus> {
  const response = await customInstance<TrialStatus>({
    url: `/api/v1/sites/${siteId}/trial-status`,
    method: 'GET',
  });
  return response;
}

/**
 * Query key for trial status
 */
export const getTrialStatusQueryKey = (siteId: string) => {
  return ['trial-status', siteId] as const;
};

/**
 * Hook to fetch trial status for a site
 */
export function useTrialStatus(siteId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: getTrialStatusQueryKey(siteId || ''),
    queryFn: () => getTrialStatus(siteId!),
    enabled: !!siteId && options?.enabled !== false,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Helper to calculate usage percentages
 */
export function calculateTrialUsage(trialStatus: TrialStatus | undefined) {
  if (!trialStatus || !trialStatus.isInTrial) {
    return null;
  }

  const { limits, daysRemaining, conversationsRemaining, messagesRemaining } = trialStatus;

  return {
    daysUsed: limits.maxDays - (daysRemaining || 0),
    daysTotal: limits.maxDays,
    daysPercent: Math.round(((limits.maxDays - (daysRemaining || 0)) / limits.maxDays) * 100),

    conversationsUsed: limits.maxConversations - (conversationsRemaining || 0),
    conversationsTotal: limits.maxConversations,
    conversationsPercent: Math.round(((limits.maxConversations - (conversationsRemaining || 0)) / limits.maxConversations) * 100),

    messagesUsed: limits.maxMessages - (messagesRemaining || 0),
    messagesTotal: limits.maxMessages,
    messagesPercent: Math.round(((limits.maxMessages - (messagesRemaining || 0)) / limits.maxMessages) * 100),
  };
}
