"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  User,
  Clock,
  Activity,
  FileText,
  Filter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  useGetApiV1AdminAudit,
  useGetApiV1AdminAuditStats,
  usePostApiV1AdminAuditCleanup,
  getGetApiV1AdminAuditQueryKey,
  getGetApiV1AdminAuditStatsQueryKey,
} from "@/lib/api/generated/queries/admin-audit/admin-audit";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  VIEW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  FORCE_LOGOUT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  EXTEND_TRIAL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  RECRAWL: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  REPROCESS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  CLEANUP: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  EXPORT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  BULK_UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  BULK_DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  USER: "User",
  SITE: "Site",
  URL: "URL",
  EMBEDDING: "Embedding",
  FILE: "File",
  CONVERSATION: "Conversation",
  MESSAGE: "Message",
  SUBSCRIPTION: "Subscription",
  TRANSACTION: "Transaction",
  SESSION: "Session",
  WIDGET: "Widget",
  BILLING_INFO: "Billing Info",
};

export default function AdminAuditPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [successFilter, setSuccessFilter] = useState<string>("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch audit statistics
  const {
    data: statsResponse,
    isLoading: statsLoading,
    error: statsError,
  } = useGetApiV1AdminAuditStats();

  // Fetch audit logs
  const {
    data: logsResponse,
    isLoading: logsLoading,
    error: logsError,
  } = useGetApiV1AdminAudit({
    page: String(page),
    limit: "50",
    action: actionFilter !== "all" ? actionFilter as never : undefined,
    entityType: entityTypeFilter !== "all" ? entityTypeFilter as never : undefined,
    success: successFilter !== "all" ? successFilter as "true" | "false" : undefined,
    sortOrder: "desc",
  });

  // Cleanup mutation
  const cleanupMutation = usePostApiV1AdminAuditCleanup({
    mutation: {
      onSuccess: (data) => {
        setSuccessMessage(data.message || "Old audit logs cleaned up successfully");
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminAuditQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminAuditStatsQueryKey() });
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: () => {
        setActionError("Failed to clean up audit logs");
      },
    },
  });

  const stats = statsResponse?.data;
  const logs = logsResponse?.data?.logs || [];
  const pagination = logsResponse?.data?.pagination;

  const isLoading = statsLoading || logsLoading;
  const displayError = actionError || (statsError || logsError ? "Failed to load audit data" : null);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetApiV1AdminAuditQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetApiV1AdminAuditStatsQueryKey() });
  };

  const handleCleanup = () => {
    if (confirm("Are you sure you want to delete audit logs older than 365 days?")) {
      setActionError(null);
      cleanupMutation.mutate({ data: { retentionDays: 365 } });
    }
  };

  const handleExport = () => {
    window.open("/api/v1/admin/audit/export/download?format=csv", "_blank");
  };

  const getEntityLink = (entityType: string, entityId: string | null) => {
    if (!entityId) return null;
    const linkMap: Record<string, string> = {
      USER: `/admin/users/${entityId}`,
      SITE: `/admin/sites/${entityId}`,
      SUBSCRIPTION: `/admin/subscriptions`,
      CONVERSATION: `/admin/conversations/${entityId}`,
    };
    return linkMap[entityType] || null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Audit Logs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track and monitor admin actions for security and compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="destructive"
            onClick={handleCleanup}
            disabled={cleanupMutation.isPending}
          >
            <Trash2 className={`h-4 w-4 mr-2 ${cleanupMutation.isPending ? "animate-spin" : ""}`} />
            Cleanup Old Logs
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
              <CardTitle className="text-sm font-medium text-gray-500">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalLogs?.toLocaleString() ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {stats.logsToday?.toLocaleString() ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.logsThisWeek?.toLocaleString() ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.logsThisMonth?.toLocaleString() ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Failed Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {stats.failedActions?.toLocaleString() ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="FORCE_LOGOUT">Force Logout</SelectItem>
                  <SelectItem value="EXTEND_TRIAL">Extend Trial</SelectItem>
                  <SelectItem value="RECRAWL">Recrawl</SelectItem>
                  <SelectItem value="REPROCESS">Reprocess</SelectItem>
                  <SelectItem value="CLEANUP">Cleanup</SelectItem>
                  <SelectItem value="EXPORT">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Entity Type</label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="SITE">Site</SelectItem>
                  <SelectItem value="URL">URL</SelectItem>
                  <SelectItem value="EMBEDDING">Embedding</SelectItem>
                  <SelectItem value="FILE">File</SelectItem>
                  <SelectItem value="CONVERSATION">Conversation</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  <SelectItem value="SESSION">Session</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Status</label>
              <Select value={successFilter} onValueChange={setSuccessFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Success</SelectItem>
                  <SelectItem value="false">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      {!logsLoading && logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Log Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const entityLink = getEntityLink(log.entityType, log.entityId);
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{log.adminEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_COLORS[log.action] || "bg-gray-100"}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {ENTITY_TYPE_LABELS[log.entityType] || log.entityType}
                        </span>
                      </TableCell>
                      <TableCell>
                        {entityLink ? (
                          <Link
                            href={entityLink}
                            className="text-sm text-indigo-600 hover:underline"
                          >
                            {log.entityName || log.entityId || "-"}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {log.entityName || log.entityId || "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge
                            variant="default"
                            className="flex items-center gap-1 w-fit bg-green-600"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Success
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="flex items-center gap-1 w-fit"
                          >
                            <XCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500 font-mono">
                          {log.ipAddress || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} logs
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
      {!logsLoading && logs.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500 py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Audit Logs Found</p>
              <p className="text-sm max-w-md mx-auto">
                Admin actions will be logged here for security and compliance monitoring.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Admins Card */}
      {stats?.topAdmins && stats.topAdmins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Active Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topAdmins.map((admin, index) => (
                <div key={admin.adminId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{admin.adminEmail}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{admin.actionCount} actions</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
