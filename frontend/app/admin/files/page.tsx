"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

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
import type { AdminFile, GetApiV1AdminFilesParams, GetApiV1AdminFilesStatus } from "@/lib/api/generated/models";
import { FilesStats, FilesTable, FilesFilters } from "@/components/admin/files";

interface FileStats {
  total: number;
  byStatus: { status: string; count: number }[];
  failedFiles: number;
  stuckFiles: number;
  totalStorageBytes: string;
}

export default function AdminFilesPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState<string>(searchParams.get("status") || "all");
  const [siteId, setSiteId] = useState<string | null>(searchParams.get("siteId") || null);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteFile, setDeleteFile] = useState<AdminFile | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const queryParams: GetApiV1AdminFilesParams = {
    page: page.toString(),
    limit: "20",
    ...(searchQuery && { search: searchQuery }),
    ...(siteId && { siteId }),
    ...(status !== "all" && { status: status as GetApiV1AdminFilesStatus }),
  };

  const { data: filesData, isLoading, error: filesError } = useGetApiV1AdminFiles(queryParams);
  const { data: statsData } = useGetApiV1AdminStatsFiles();

  const deleteMutation = useDeleteApiV1AdminFilesFileId({
    mutation: {
      onSuccess: () => {
        setDeleteFile(null);
        setMutationError(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminFilesQueryKey(queryParams) });
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminStatsFilesQueryKey() });
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to delete file");
      },
    },
  });

  const reprocessMutation = usePostApiV1AdminFilesFileIdReprocess({
    mutation: {
      onSuccess: () => {
        setMutationError(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminFilesQueryKey(queryParams) });
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminStatsFilesQueryKey() });
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to trigger reprocessing");
      },
    },
  });

  const data = filesData?.data;
  const stats = statsData?.data as FileStats | undefined;

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(search);
  };

  const handleDelete = () => {
    if (!deleteFile) return;
    deleteMutation.mutate({ fileId: deleteFile.id });
  };

  const error = filesError
    ? filesError instanceof Error ? filesError.message : "An error occurred"
    : mutationError;

  return (
    <div className="space-y-6">
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

      {stats && <FilesStats stats={stats} />}

      <FilesFilters
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        siteId={siteId}
        onSiteChange={(id) => { setSiteId(id); setPage(1); }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <>
          <FilesTable
            files={data.files}
            onReprocess={(fileId) => reprocessMutation.mutate({ fileId })}
            onDelete={setDeleteFile}
            isReprocessing={reprocessMutation.isPending}
          />

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.pagination.total)} of{" "}
                {data.pagination.total} files
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
