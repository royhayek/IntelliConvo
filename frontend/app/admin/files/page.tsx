"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TimeAgo } from "@/components/ui/time-ago";

// Import generated hooks
import {
  useGetApiV1AdminFiles,
  useDeleteApiV1AdminFilesFileId,
  usePostApiV1AdminFilesFileIdReprocess,
  getGetApiV1AdminFilesQueryKey,
} from "@/lib/api/generated/queries/admin-files/admin-files";
import {
  useGetApiV1AdminStatsFiles,
  getGetApiV1AdminStatsFilesQueryKey,
} from "@/lib/api/generated/queries/admin/admin";

// Import generated types
import type {
  AdminFile,
  GetApiV1AdminFilesParams,
  GetApiV1AdminFilesStatus,
} from "@/lib/api/generated/models";

// Stats type for the file statistics response
interface FileStats {
  total: number;
  byStatus: { status: string; count: number }[];
  failedFiles: number;
  stuckFiles: number;
  totalStorageBytes: string;
}

function formatFileSize(bytes: number | string): string {
  const size = typeof bytes === "string" ? parseInt(bytes) : bytes;
  if (size === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function AdminFilesPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState<string>(searchParams.get("status") || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteFile, setDeleteFile] = useState<AdminFile | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Build query params
  const queryParams: GetApiV1AdminFilesParams = {
    page: page.toString(),
    limit: "20",
    ...(searchQuery && { search: searchQuery }),
    ...(status !== "all" && { status: status as GetApiV1AdminFilesStatus }),
  };

  // Fetch files using generated hook
  const {
    data: filesData,
    isLoading: filesLoading,
    error: filesError,
  } = useGetApiV1AdminFiles(queryParams);

  // Fetch file stats using generated hook
  const { data: statsData } = useGetApiV1AdminStatsFiles();

  // Delete mutation
  const deleteMutation = useDeleteApiV1AdminFilesFileId({
    mutation: {
      onSuccess: () => {
        setDeleteFile(null);
        setMutationError(null);
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminFilesQueryKey(queryParams) });
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminStatsFilesQueryKey() });
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to delete file");
      },
    },
  });

  // Reprocess mutation
  const reprocessMutation = usePostApiV1AdminFilesFileIdReprocess({
    mutation: {
      onSuccess: () => {
        setMutationError(null);
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminFilesQueryKey(queryParams) });
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminStatsFilesQueryKey() });
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to trigger reprocessing");
      },
    },
  });

  // Extract data from responses
  const data = filesData?.data;
  const stats = statsData?.data as FileStats | undefined;

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(search);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleDelete = () => {
    if (!deleteFile) return;
    deleteMutation.mutate({ fileId: deleteFile.id });
  };

  const handleReprocess = (fileId: string) => {
    reprocessMutation.mutate({ fileId });
  };

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

  const getFileIcon = (fileType: string) => {
    return <FileText className="h-4 w-4 text-gray-400" />;
  };

  // Combine errors for display
  const error = filesError
    ? filesError instanceof Error
      ? filesError.message
      : "An error occurred"
    : mutationError;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Knowledge Files
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage uploaded knowledge files and their processing status
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Files"
            value={stats.total.toLocaleString()}
            icon={FileText}
            color="blue"
          />
          <StatCard
            label="Storage Used"
            value={formatBytes(parseInt(stats.totalStorageBytes) || 0)}
            icon={HardDrive}
            color="green"
          />
          <StatCard
            label="Failed Files"
            value={stats.failedFiles}
            icon={XCircle}
            color={stats.failedFiles > 0 ? "red" : "green"}
          />
          <StatCard
            label="Stuck Processing"
            value={stats.stuckFiles}
            icon={Clock}
            color={stats.stuckFiles > 0 ? "orange" : "green"}
          />
        </div>
      )}

      {/* File Status Breakdown */}
      {stats && stats.byStatus.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Files by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {stats.byStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <Badge variant="outline">{item.status}</Badge>
                  <span className="text-sm font-medium">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by file name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <div className="flex gap-2">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {filesLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <>
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
                {data.files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No files found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.fileType)}
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
                        <Link
                          href={`/admin/sites/${file.siteId}`}
                          className="hover:underline"
                        >
                          <p className="font-medium">{file.siteId}</p>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{file.fileType}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(file.fileSize)}</TableCell>
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
                                onClick={() => handleReprocess(file.id)}
                                disabled={reprocessMutation.isPending}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reprocess
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteFile(file)}
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
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} files
              </p>
              <Pagination
                currentPage={page}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteFile}
        onOpenChange={(open) => !open && setDeleteFile(null)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete File"
        description={`Are you sure you want to delete "${deleteFile?.fileName}"? This action cannot be undone.`}
      />
    </div>
  );
}
