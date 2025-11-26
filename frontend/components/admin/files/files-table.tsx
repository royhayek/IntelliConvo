"use client";

import Link from "next/link";
import {
  FileText,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimeAgo } from "@/components/ui/time-ago";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatBytes } from "@/lib/utils";
import type { AdminFile } from "@/lib/api/generated/models";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FilesTableProps {
  files: AdminFile[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onReprocess: (fileId: string) => void;
  onDelete: (file: AdminFile) => void;
  isReprocessing: boolean;
}

export function FilesTable({ files, pagination, onPageChange, onReprocess, onDelete, isReprocessing }: FilesTableProps) {
  const getStatusBadge = (fileStatus: string) => {
    switch (fileStatus) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="text-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{fileStatus}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-slate-800">
            <TableHead>File</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No files found
              </TableCell>
            </TableRow>
          ) : (
            files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {file.fileName}
                      </p>
                      {file.errorMessage && (
                        <p className="text-sm text-red-500 truncate" title={file.errorMessage}>
                          {file.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/sites/${file.siteId}`} className="hover:underline">
                    <p className="font-medium">{file.siteId}</p>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{file.fileType}</Badge>
                </TableCell>
                <TableCell>{formatBytes(typeof file.fileSize === "string" ? parseInt(file.fileSize) : file.fileSize)}</TableCell>
                <TableCell>{getStatusBadge(file.status)}</TableCell>
                <TableCell>
                  <TimeAgo date={file.uploadedAt} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(file.status === "FAILED" || file.status === "PENDING") && (
                        <DropdownMenuItem
                          onClick={() => onReprocess(file.id)}
                          disabled={isReprocessing}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reprocess
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(file)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {pagination && onPageChange && (
        <div className="px-6 pb-4">
          <TablePagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.pages}
            onPageChange={onPageChange}
            itemName="files"
          />
        </div>
      )}
    </div>
  );
}
