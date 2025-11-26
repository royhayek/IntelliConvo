"use client";

import { format } from "date-fns";
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { EMAIL_TYPE_LABELS, EMAIL_TYPE_COLORS, EMAIL_STATUS_COLORS } from "@/lib/utils/email-helpers";

interface EmailLog {
  id: string;
  email: string;
  type: string;
  subject: string;
  status: string;
  provider?: string | null;
  createdAt: string;
  user?: {
    fullName?: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EmailLogsTableProps {
  logs: EmailLog[];
  pagination?: Pagination;
  page: number;
  onPageChange: (page: number) => void;
  onRetry: (emailId: string) => void;
  isRetrying: boolean;
}

export function EmailLogsTable({
  logs,
  pagination,
  page,
  onPageChange,
  onRetry,
  isRetrying,
}: EmailLogsTableProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 py-8">
            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Email Logs Found</p>
            <p className="text-sm max-w-md mx-auto">
              Email activity will be logged here. Send a test email to verify your configuration.
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
          <Mail className="h-5 w-5" />
          Email Log Entries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{log.email}</span>
                    {log.user && (
                      <span className="text-xs text-gray-500">{log.user.fullName}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={EMAIL_TYPE_COLORS[log.type] || "bg-gray-100"}>
                    {EMAIL_TYPE_LABELS[log.type] || log.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm truncate max-w-[200px] block" title={log.subject}>
                    {log.subject}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={EMAIL_STATUS_COLORS[log.status] || "bg-gray-100"}>
                    {log.status === "SENT" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {log.status === "FAILED" && <XCircle className="h-3 w-3 mr-1" />}
                    {log.status === "PENDING" && <Clock className="h-3 w-3 mr-1" />}
                    {log.status === "QUEUED" && <Zap className="h-3 w-3 mr-1" />}
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-500 font-mono">
                    {log.provider || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  {log.status === "FAILED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRetry(log.id)}
                      disabled={isRetrying}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pagination && (
          <TablePagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.pages}
            onPageChange={onPageChange}
            itemName="emails"
            showPageNumbers={false}
          />
        )}
      </CardContent>
    </Card>
  );
}
