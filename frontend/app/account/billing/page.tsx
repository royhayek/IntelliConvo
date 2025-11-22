"use client";

import Link from "next/link";
import { ArrowLeft, Download, CreditCard, Calendar, DollarSign, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRequireUser } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import {
  useGetApiV1BillingHistory,
  useGetApiV1BillingSummary,
} from "@/lib/api/generated/queries/billing/billing";
import {
  type BillingTransaction,
  type BillingSummaryActiveSubscriptionsItem,
  type BillingSummaryUpcomingChargesItem,
} from "@/lib/api/generated/models";

export default function BillingHistoryPage() {
  // Protected route - redirects to login if not authenticated, admins to admin portal
  const { isLoading: isAuthLoading, isAuthenticated, user } = useRequireUser();

  const { data: billingData, isLoading } = useGetApiV1BillingHistory(
    { limit: "50" },
    { query: { enabled: isAuthenticated } }
  );

  const { data: billingSummary } = useGetApiV1BillingSummary({
    query: { enabled: isAuthenticated },
  });

  const handleDownloadInvoice = async (transactionId: string) => {
    // This would need to be implemented via backend endpoint to Stripe
    console.log("Download functionality would be implemented here for:", transactionId);
  };

  const formatAmount = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return {
          variant: "default" as const,
          className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800"
        };
      case "pending":
        return {
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
        };
      case "failed":
        return {
          variant: "destructive" as const,
          className: ""
        };
      default:
        return {
          variant: "outline" as const,
          className: ""
        };
    }
  };

  // Show loading state while auth is hydrating
  if (isAuthLoading) {
    return <AuthLoading message="Loading billing information" />;
  }

  if (!user) {
    return null;
  }

  const transactions = billingData?.transactions || [];
  const summary = billingData?.summary || { totalAmount: 0, totalTransactions: 0, statusCounts: { paid: 0, pending: 0, failed: 0 } };
  const pagination = billingData?.pagination || { page: 1, limit: 20, total: 0, pages: 0 };

  const totalPaid = summary.totalAmount ?? 0;
  const statusCounts = summary.statusCounts || { paid: 0, pending: 0, failed: 0 };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href={user?.isAdmin ? "/admin" : "/dashboard"}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {user?.isAdmin ? "Back to Admin Portal" : "Back to Dashboard"}
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300 dark:border-gray-600"></div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-600"></div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Intelligentconvo</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing History</h1>
            <p className="text-gray-600 dark:text-gray-400">View your payment history and download invoices</p>
          </div>

          {/* Billing Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatAmount(totalPaid)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.paid}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {statusCounts.pending} pending, {statusCounts.failed} failed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Subscriptions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Subscriptions</CardTitle>
              <Link href="/account/subscriptions">
                <Button variant="outline" size="sm">
                  Manage Subscriptions
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!billingSummary?.activeSubscriptions?.length ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active subscriptions</p>
                  <p className="text-sm text-gray-500">
                    Start a subscription to begin using advanced features
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {billingSummary.activeSubscriptions.map((subscription: BillingSummaryActiveSubscriptionsItem) => (
                    <div key={subscription.id} className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {subscription.site?.siteName ?? 'Unknown Site'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {subscription.planType?.replace('_', ' ') ?? 'Unknown Plan'}
                            <span className="mx-1">•</span>
                            Next billing: {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={subscription.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        }
                      >
                        {subscription.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Upcoming Charges */}
              {(billingSummary?.upcomingCharges?.length ?? 0) > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Upcoming Charges</h4>
                  <div className="space-y-2">
                    {billingSummary?.upcomingCharges?.map((charge: BillingSummaryUpcomingChargesItem, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{charge.siteName}</span>
                        <div className="text-right">
                          <p className="font-medium">{formatAmount(charge.amount ?? 0)}</p>
                          <p className="text-xs text-gray-500">
                            {charge.dueDate ? new Date(charge.dueDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No transactions yet</p>
                  <p className="text-sm text-gray-500">
                    Your billing history will appear here once you start a subscription
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction: BillingTransaction) => {
                      const statusBadge = getStatusBadge(transaction.status || "pending");
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            #{transaction.invoiceId || "N/A"}
                          </TableCell>
                          <TableCell>
                            {transaction.site?.siteName || "-"}
                          </TableCell>
                          <TableCell>
                            {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant} className={statusBadge.className}>
                              {(transaction.status || "pending").charAt(0).toUpperCase() + (transaction.status || "pending").slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatAmount(transaction.amount ?? 0, transaction.currency || "USD")}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.status === "paid" && transaction.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadInvoice(transaction.id!)}
                                disabled
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {(pagination.pages ?? 0) > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" disabled={pagination.page === 1}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={pagination.page === pagination.pages}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Billing Questions</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Have questions about your bill or need assistance?
                  </p>
                  <a
                    href="mailto:billing@intelligentconvo.com"
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    Contact Billing Support
                  </a>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Download All Invoices</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Need all your invoices for accounting purposes?
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Download All (Coming Soon)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}