/**
 * Billing Data Transfer Objects (DTOs)
 * Type definitions for billing-related API requests and responses
 */

/**
 * Transaction summary for a single transaction
 */
export interface TransactionDTO {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  stripeInvoiceId: string | null;
  createdAt: string;
  site: {
    id: string;
    siteName: string;
    siteUrl: string;
  };
}

/**
 * Billing period summary
 */
export interface BillingPeriodSummary {
  totalAmount: number;
  transactionCount: number;
}

/**
 * Status counts for transactions
 */
export interface TransactionStatusCounts {
  paid: number;
  pending: number;
  failed: number;
}

/**
 * Overall billing summary
 */
export interface BillingSummaryDTO {
  totalAmount: number;
  totalTransactions: number;
  statusCounts: TransactionStatusCounts;
}

/**
 * Billing history response with pagination
 */
export interface BillingHistoryResponse {
  transactions: TransactionDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: BillingSummaryDTO;
}

/**
 * Subscription summary for billing
 */
export interface BillingSubscriptionDTO {
  id: string;
  siteId: string;
  siteName: string;
  planType: string;
  status: string;
  currentPeriodEnd: string;
  amount: number;
  site: {
    id: string;
    siteName: string;
  };
}

/**
 * Upcoming charge information
 */
export interface UpcomingChargeDTO {
  siteId: string;
  siteName: string;
  amount: number;
  dueDate: string;
  planType: string;
}

/**
 * Complete billing summary response
 */
export interface BillingSummaryResponse {
  totalSpent: number;
  currentMonthSpent: number;
  transactionCount: number;
  nextBillingDate: string | null;
  activeSubscriptions: BillingSubscriptionDTO[];
  upcomingCharges: UpcomingChargeDTO[];
}

/**
 * Single transaction details response
 */
export interface TransactionDetailsResponse {
  transaction: TransactionDTO;
}

/**
 * Billing history query parameters
 */
export interface BillingHistoryQuery {
  page?: number;
  limit?: number;
  status?: 'paid' | 'pending' | 'failed' | 'all';
  siteId?: string;
}
