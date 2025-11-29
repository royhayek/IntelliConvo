"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, RefreshCw, AlertTriangle, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UserFilter } from "@/components/admin/user-filter";
import { SessionsStatsCards, SessionsTable } from "@/components/admin/sessions";
import {
  useGetAdminSessions,
  useGetAdminSessionsStats,
  useDeleteAdminSessionsSessionId,
  usePostAdminSessionsCleanup,
  getGetAdminSessionsQueryKey,
  getGetAdminSessionsStatsQueryKey,
} from "@/lib/api/generated/queries/admin-sessions/admin-sessions";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminSessionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const queryParams = {
    page: String(page),
    limit: "20",
    ...(userId && { userId }),
  };

  const {
    data: statsResponse,
    isLoading: statsLoading,
    error: statsError,
  } = useGetAdminSessionsStats();

  const {
    data: sessionsResponse,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useGetAdminSessions(queryParams);

  const cleanupMutation = usePostAdminSessionsCleanup({
    mutation: {
      onSuccess: (data) => {
        setSuccessMessage(data.message || "Expired sessions cleaned up successfully");
        queryClient.invalidateQueries({ queryKey: getGetAdminSessionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminSessionsStatsQueryKey() });
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: () => {
        setActionError("Failed to clean up expired sessions");
      },
    },
  });

  const revokeSessionMutation = useDeleteAdminSessionsSessionId({
    mutation: {
      onSuccess: (data) => {
        setSuccessMessage(data.message || "Session revoked successfully");
        queryClient.invalidateQueries({ queryKey: getGetAdminSessionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminSessionsStatsQueryKey() });
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: () => {
        setActionError("Failed to revoke session");
      },
    },
  });

  const stats = statsResponse?.data;
  const sessions = sessionsResponse?.data?.sessions || [];
  const pagination = sessionsResponse?.data?.pagination;

  const isLoading = statsLoading || sessionsLoading;
  const displayError = actionError || (statsError || sessionsError ? "Failed to load session data" : null);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetAdminSessionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminSessionsStatsQueryKey() });
  };

  const handleCleanup = () => {
    setActionError(null);
    cleanupMutation.mutate();
  };

  const handleRevokeSession = (sessionId: string) => {
    setActionError(null);
    revokeSessionMutation.mutate({ sessionId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Sessions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage user sessions and security
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <UserFilter
            value={userId}
            onChange={(id) => { setUserId(id); setPage(1); }}
            placeholder="All Users"
          />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="destructive"
            onClick={handleCleanup}
            disabled={cleanupMutation.isPending || !stats?.expiredTokensNeedingCleanup}
          >
            <Trash2 className={`h-4 w-4 mr-2 ${cleanupMutation.isPending ? 'animate-spin' : ''}`} />
            Cleanup Expired ({stats?.expiredTokensNeedingCleanup || 0})
          </Button>
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

      <SessionsStatsCards stats={stats} isLoading={statsLoading} />

      {!sessionsLoading && (
        <SessionsTable
          sessions={sessions}
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          onRevoke={handleRevokeSession}
          isRevoking={revokeSessionMutation.isPending}
        />
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm max-w-md mx-auto">
              To revoke all sessions for a specific user, go to the{" "}
              <Link href="/admin/users" className="text-indigo-600 hover:underline">Users</Link>{" "}
              page and use the &quot;Force Logout&quot; action on the user&apos;s profile.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
