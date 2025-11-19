"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, CreditCard, Calendar, DollarSign, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store";
import {
  useGetApiBillingHistory,
  useGetApiBillingSummary,
} from "@/lib/api/generated/queries/billing/billing";
import { type GetApiBillingHistory200TransactionsItem } from "@/lib/api/generated/models";

export default function BillingHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const { data: billingData, isLoading } = useGetApiBillingHistory(
    { limit: 50 },
    { query: { enabled: isAuthenticated } }
  );

  const { data: billingSummary } = useGetApiBillingSummary({
    query: { enabled: isAuthenticated },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const transactions = billingData?.transactions || [];
  const summary = billingData?.summary || { totalAmount: 0, totalTransactions: 0, statusCounts: { paid: 0, pending: 0, failed: 0 } };
  const pagination = billingData?.pagination || { page: 1, limit: 20, total: 0, pages: 0 };

  const totalPaid = summary.totalAmount ?? 0;
  const statusCounts = summary.statusCounts || { paid: 0, pending: 0, failed: 0 };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-600"></div>
                <span className="text-xl font-bold text-gray-900">Intelligentconvo</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing History</h1>
            <p className="text-gray-600">View your payment history and download invoices</p>
          </div>

          {/* Billing Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Paid</p>
                    <p className="text-2xl font-bold text-gray-900">{formatAmount(totalPaid)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Paid</p>
                    <p className="text-2xl font-bold text-gray-900">{statusCounts.paid}</p>
                    <p className="text-xs text-gray-500">
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
                  {billingSummary.activeSubscriptions.map((subscription: any) => (
                    <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-6 w-6 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {subscription.site.siteName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {subscription.planType.replace('_', ' ')} • {subscription.status}
                          </p>
                          <p className="text-xs text-gray-500">
                            Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${
                        subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {subscription.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upcoming Charges */}
              {(billingSummary?.upcomingCharges?.length ?? 0) > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Upcoming Charges</h4>
                  <div className="space-y-2">
                    {billingSummary?.upcomingCharges?.map((charge: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{charge.siteName}</span>
                        <div className="text-right">
                          <p className="font-medium">{formatAmount(charge.amount)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(charge.dueDate).toLocaleDateString()}
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
                  <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
                <div className="space-y-4">
                  {transactions.map((transaction: GetApiBillingHistory200TransactionsItem) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">#{transaction.invoiceId || "N/A"}</p>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(transaction.status || "pending")}`}>
                              {(transaction.status || "pending").charAt(0).toUpperCase() + (transaction.status || "pending").slice(1)}
                            </span>
                          </div>
                          {transaction.site && (
                            <p className="text-sm text-gray-600">{transaction.site.siteName}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <p className="font-semibold text-gray-900">
                          {formatAmount(transaction.amount ?? 0, transaction.currency || "USD")}
                        </p>
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
                      </div>
                    </div>
                  ))}
                </div>
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