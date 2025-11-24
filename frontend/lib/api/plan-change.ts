/**
 * Plan Change API Functions
 * Custom hooks for subscription plan upgrades/downgrades
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  UseMutationOptions,
  UseQueryOptions,
  QueryClient,
} from '@tanstack/react-query';
import { customInstance } from './axios-instance';
import type { ErrorType, BodyType } from './axios-instance';

// Types for proration preview
export interface PlanInfo {
  id: string;
  name: string;
  price: number;
}

export interface ProrationPreview {
  currentPlan: PlanInfo;
  newPlan: PlanInfo;
  prorationAmount: number;
  creditAmount: number;
  amountDue: number;
  currency: string;
  effectiveDate: string;
  billingCycleAnchor: string;
}

// Types for change plan request/response
export interface ChangePlanRequest {
  newPlanType: 'PREMIUM_MONTHLY' | 'PREMIUM_ANNUAL';
}

export interface ChangePlanResponse {
  subscription: {
    id: string;
    userId: string;
    siteId: string;
    planType: 'PREMIUM_MONTHLY' | 'PREMIUM_ANNUAL';
    status: 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
    trialEndsAt: string | null;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelledAt: string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
    updatedAt: string;
  };
  proration: ProrationPreview;
}

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

/**
 * Get proration preview for a potential plan change
 */
export const getProrationPreview = (
  subscriptionId: string,
  newPlanType: string,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal
) => {
  return customInstance<ProrationPreview>(
    {
      url: `/api/v1/billing/subscriptions/${subscriptionId}/preview-change`,
      method: 'GET',
      params: { newPlanType },
      signal,
    },
    options
  );
};

export const getGetProrationPreviewQueryKey = (
  subscriptionId: string,
  newPlanType: string
) => {
  return [
    `/api/v1/billing/subscriptions/${subscriptionId}/preview-change`,
    { newPlanType },
  ] as const;
};

export const getGetProrationPreviewQueryOptions = <
  TData = Awaited<ReturnType<typeof getProrationPreview>>,
  TError = ErrorType<void>
>(
  subscriptionId: string,
  newPlanType: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof getProrationPreview>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  }
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ??
    getGetProrationPreviewQueryKey(subscriptionId, newPlanType);

  const queryFn = ({ signal }: { signal?: AbortSignal }) =>
    getProrationPreview(subscriptionId, newPlanType, requestOptions, signal);

  return {
    queryKey,
    queryFn,
    enabled: !!subscriptionId && !!newPlanType,
    ...queryOptions,
  };
};

/**
 * Hook to fetch proration preview
 */
export function useGetProrationPreview<
  TData = Awaited<ReturnType<typeof getProrationPreview>>,
  TError = ErrorType<void>
>(
  subscriptionId: string,
  newPlanType: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof getProrationPreview>>,
        TError,
        TData
      >
    >;
    request?: SecondParameter<typeof customInstance>;
  },
  queryClient?: QueryClient
) {
  const queryOptions = getGetProrationPreviewQueryOptions(
    subscriptionId,
    newPlanType,
    options
  );

  return useQuery(queryOptions, queryClient);
}

/**
 * Change subscription plan
 */
export const postChangePlan = (
  subscriptionId: string,
  data: BodyType<ChangePlanRequest>,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal
) => {
  return customInstance<ChangePlanResponse>(
    {
      url: `/api/v1/billing/subscriptions/${subscriptionId}/change-plan`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
      signal,
    },
    options
  );
};

export const getPostChangePlanMutationOptions = <
  TError = ErrorType<void>,
  TContext = unknown
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof postChangePlan>>,
      TError,
      { subscriptionId: string; data: BodyType<ChangePlanRequest> },
      TContext
    >;
    request?: SecondParameter<typeof customInstance>;
  }
): UseMutationOptions<
  Awaited<ReturnType<typeof postChangePlan>>,
  TError,
  { subscriptionId: string; data: BodyType<ChangePlanRequest> },
  TContext
> => {
  const mutationKey = ['postChangePlan'];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      'mutationKey' in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn = ({
    subscriptionId,
    data,
  }: {
    subscriptionId: string;
    data: BodyType<ChangePlanRequest>;
  }) => postChangePlan(subscriptionId, data, requestOptions);

  return { mutationFn, ...mutationOptions };
};

/**
 * Hook to change subscription plan
 */
export function usePostChangePlan<
  TError = ErrorType<void>,
  TContext = unknown
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof postChangePlan>>,
      TError,
      { subscriptionId: string; data: BodyType<ChangePlanRequest> },
      TContext
    >;
    request?: SecondParameter<typeof customInstance>;
  },
  queryClient?: QueryClient
) {
  const mutationOptions = getPostChangePlanMutationOptions(options);
  return useMutation(mutationOptions, queryClient);
}

export type PostChangePlanMutationResult = NonNullable<
  Awaited<ReturnType<typeof postChangePlan>>
>;
export type PostChangePlanMutationBody = BodyType<ChangePlanRequest>;
export type PostChangePlanMutationError = ErrorType<void>;
