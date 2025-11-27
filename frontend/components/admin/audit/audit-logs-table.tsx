"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Clock, User, CheckCircle, XCircle, FileText, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { ACTION_COLORS, ENTITY_TYPE_LABELS, getEntityLink } from "@/lib/constants/audit-config";

interface AuditLog {
  id: string;
  createdAt: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  success: boolean;
  ipAddress: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AuditLogsTableProps {
  logs: AuditLog[];
  pagination?: Pagination;
  page: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export function AuditLogsTable({
  logs,
  pagination,
  page,
  onPageChange,
  isLoading,
}: AuditLogsTableProps) {
  if (isLoading) return null;

  if (logs.length === 0) {
    return (
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
    );
  }

  return (
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

        {pagination && (
          <TablePagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
            itemName="logs"
            showPageNumbers={false}
          />
        )}
      </CardContent>
    </Card>
  );
}
