"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  Trash2,
  User,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetApiV1AdminSessions,
  useGetApiV1AdminSessionsStats,
  useDeleteApiV1AdminSessionsSessionId,
  usePostApiV1AdminSessionsCleanup,
  getGetApiV1AdminSessionsQueryKey,
  getGetApiV1AdminSessionsStatsQueryKey,
} from "@/lib/api/generated/queries/admin-sessions/admin-sessions";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminSessionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch session statistics
  const {
    data: statsResponse,
    isLoading: statsLoading,
    error: statsError,
  } = useGetApiV1AdminSessionsStats();

  // Fetch sessions list
  const {
    data: sessionsResponse,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useGetApiV1AdminSessions({ page: String(page), limit: "20" });

  // Cleanup mutation
  const cleanupMutation = usePostApiV1AdminSessionsCleanup({
    mutation: {
      onSuccess: (data) => {
        setSuccessMessage(data.message || "Expired sessions cleaned up successfully");
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSessionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSessionsStatsQueryKey() });
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: () => {
        setActionError("Failed to clean up expired sessions");
      },
    },
  });

  // Revoke session mutation
  const revokeSessionMutation = useDeleteApiV1AdminSessionsSessionId({
    mutation: {
      onSuccess: (data) => {
        setSuccessMessage(data.message || "Session revoked successfully");
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSessionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSessionsStatsQueryKey() });
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
    queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSessionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSessionsStatsQueryKey() });
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
      {/* Page Header */}
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
        <div className="flex gap-2">
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

      {/* Success Message */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {displayError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Stats Cards */}
      {stats && !statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalSessions?.toLocaleString() ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.activeSessions?.toLocaleString() ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">New Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.sessionsCreatedLast24h?.toLocaleString() ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Expired (Cleanup)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{stats.expiredTokensNeedingCleanup?.toLocaleString() ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Multi-Session Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.usersWithMultipleSessions?.toLocaleString() ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sessions Table */}
      {!sessionsLoading && sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Token Preview</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {session.user?.fullName || "Unknown User"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {session.user?.email || session.userId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {session.tokenPreview}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        {format(new Date(session.createdAt), "MMM d, yyyy HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {format(new Date(session.expiresAt), "MMM d, yyyy HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.isExpired ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="default" className="flex items-center gap-1 w-fit bg-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokeSessionMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} sessions
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!sessionsLoading && sessions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500 py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Sessions Found</p>
              <p className="text-sm max-w-md mx-auto">
                There are no active sessions in the system.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
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
