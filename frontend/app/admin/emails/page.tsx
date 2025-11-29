"use client";

import { useState } from "react";
import { Mail, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  useGetAdminEmails,
  useGetAdminEmailsStats,
  useGetAdminEmailsProviderStatus,
  usePostAdminEmailsIdRetry,
  usePostAdminEmailsTest,
  getGetAdminEmailsQueryKey,
  getGetAdminEmailsStatsQueryKey,
} from "@/lib/api/generated/queries/admin-emails/admin-emails";
import { useQueryClient } from "@tanstack/react-query";
import {
  EmailStatsCards,
  EmailFilters,
  EmailLogsTable,
  TestEmailDialog,
} from "@/components/admin/emails";

export default function AdminEmailsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  const {
    data: statsResponse,
    isLoading: statsLoading,
    error: statsError,
  } = useGetAdminEmailsStats();

  const {
    data: providerResponse,
    isLoading: providerLoading,
  } = useGetAdminEmailsProviderStatus();

  const {
    data: logsResponse,
    isLoading: logsLoading,
    error: logsError,
  } = useGetAdminEmails({
    page: String(page),
    limit: "50",
    type: typeFilter !== "all" ? typeFilter as never : undefined,
    status: statusFilter !== "all" ? statusFilter as never : undefined,
    sortOrder: "desc",
  });

  const retryMutation = usePostAdminEmailsIdRetry({
    mutation: {
      onSuccess: () => {
        setSuccessMessage("Email retry queued successfully");
        queryClient.invalidateQueries({ queryKey: getGetAdminEmailsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminEmailsStatsQueryKey() });
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: () => {
        setActionError("Failed to retry email");
        setTimeout(() => setActionError(null), 3000);
      },
    },
  });

  const testEmailMutation = usePostAdminEmailsTest({
    mutation: {
      onSuccess: () => {
        setSuccessMessage("Test email sent successfully!");
        setTestDialogOpen(false);
        setTestEmailAddress("");
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: () => {
        setActionError("Failed to send test email");
        setTimeout(() => setActionError(null), 3000);
      },
    },
  });

  const stats = statsResponse?.data;
  const provider = providerResponse?.data;
  const logs = logsResponse?.data?.logs || [];
  const pagination = logsResponse?.data?.pagination;

  const isLoading = statsLoading || logsLoading;
  const displayError = actionError || (statsError || logsError ? "Failed to load email data" : null);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetAdminEmailsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminEmailsStatsQueryKey() });
  };

  const handleRetry = (emailId: string) => {
    setActionError(null);
    retryMutation.mutate({ id: emailId });
  };

  const handleSendTestEmail = () => {
    if (!testEmailAddress) {
      setActionError("Please enter an email address");
      return;
    }
    testEmailMutation.mutate({ data: { email: testEmailAddress } });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Email Logs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor and manage email delivery across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <TestEmailDialog
            open={testDialogOpen}
            onOpenChange={setTestDialogOpen}
            email={testEmailAddress}
            onEmailChange={setTestEmailAddress}
            onSend={handleSendTestEmail}
            isPending={testEmailMutation.isPending}
          />
        </div>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      {displayError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      <EmailStatsCards
        stats={stats}
        provider={provider}
        isLoading={providerLoading || statsLoading}
      />

      <EmailFilters
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
      />

      {!logsLoading && (
        <EmailLogsTable
          logs={logs}
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          onRetry={handleRetry}
          isRetrying={retryMutation.isPending}
        />
      )}
    </div>
  );
}
