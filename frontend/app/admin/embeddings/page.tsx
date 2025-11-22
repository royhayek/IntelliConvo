"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  MoreHorizontal,
  Eye,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Hash,
  TrendingUp,
  LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TimeAgo } from "@/components/ui/time-ago";

// Generated hooks
import {
  useGetApiV1AdminEmbeddings,
  useDeleteApiV1AdminEmbeddingsEmbeddingId,
  getGetApiV1AdminEmbeddingsQueryKey,
} from "@/lib/api/generated/queries/admin-embeddings/admin-embeddings";
import { useGetApiV1AdminStatsEmbeddings } from "@/lib/api/generated/queries/admin/admin";

// Generated types
import type { GetApiV1AdminEmbeddingsParams } from "@/lib/api/generated/models";

// Extended embedding type for UI (the API returns more data than the base type)
interface EmbeddingWithDetails {
  id: string;
  chunkIndex: number;
  vectorId: string;
  contentChunk: string;
  createdAt: string;
  siteUrl: {
    id: string;
    url: string;
    title: string | null;
    site: {
      id: string;
      siteName: string;
      user: {
        id: string;
        email: string;
        fullName: string | null;
      };
    };
  };
}

interface EmbeddingStats {
  total: number;
  createdLast24h: number;
  urlsWithoutEmbeddings: number;
  averageChunksPerUrl: number;
}

export default function AdminEmbeddingsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteEmbedding, setDeleteEmbedding] = useState<EmbeddingWithDetails | null>(null);

  // Build query params
  const siteId = searchParams.get("siteId");
  const siteUrlId = searchParams.get("siteUrlId");

  const queryParams: GetApiV1AdminEmbeddingsParams = {
    page: page.toString(),
    limit: "20",
    ...(siteId && { siteId }),
    ...(siteUrlId && { siteUrlId }),
  };

  // Fetch embeddings using generated hook
  const {
    data: embeddingsResponse,
    isLoading: isLoadingEmbeddings,
    error: embeddingsError,
  } = useGetApiV1AdminEmbeddings(queryParams);

  // Fetch embedding stats using generated hook
  const { data: statsResponse } = useGetApiV1AdminStatsEmbeddings();

  // Delete mutation using generated hook
  const deleteMutation = useDeleteApiV1AdminEmbeddingsEmbeddingId({
    mutation: {
      onSuccess: () => {
        setDeleteEmbedding(null);
        // Invalidate embeddings query to refetch
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminEmbeddingsQueryKey(queryParams),
        });
      },
    },
  });

  // Extract data from responses
  // The API returns embeddings with nested siteUrl data
  const embeddings = (embeddingsResponse?.data?.embeddings ?? []) as unknown as EmbeddingWithDetails[];
  const pagination = embeddingsResponse?.data?.pagination;
  const stats = statsResponse?.data as EmbeddingStats | undefined;

  // Handle delete
  const handleDelete = () => {
    if (!deleteEmbedding) return;
    deleteMutation.mutate({ embeddingId: deleteEmbedding.id });
  };

  // Derive error message
  const errorMessage = embeddingsError
    ? "Failed to fetch embeddings"
    : deleteMutation.error
    ? "Failed to delete embedding"
    : null;

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Embeddings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage vector embeddings
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Embeddings"
            value={stats.total.toLocaleString()}
            icon={Brain}
            color="purple"
          />
          <StatCard
            label="Created (24h)"
            value={stats.createdLast24h}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="URLs Without Embeddings"
            value={stats.urlsWithoutEmbeddings}
            icon={LinkIcon}
            color={stats.urlsWithoutEmbeddings > 0 ? "orange" : "green"}
          />
          <StatCard
            label="Avg Chunks/URL"
            value={stats.averageChunksPerUrl.toFixed(1)}
            icon={Hash}
            color="blue"
          />
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {isLoadingEmbeddings ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : embeddings ? (
        <>
          <div className="border rounded-lg dark:border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-800">
                  <TableHead>Source URL</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Chunk</TableHead>
                  <TableHead>Content Preview</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {embeddings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No embeddings found
                    </TableCell>
                  </TableRow>
                ) : (
                  embeddings.map((embedding) => (
                    <TableRow key={embedding.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {embedding.siteUrl.title || "Untitled"}
                          </p>
                          <a
                            href={embedding.siteUrl.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
                          >
                            {embedding.siteUrl.url}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/sites/${embedding.siteUrl.site.id}`}
                          className="hover:underline"
                        >
                          <p className="font-medium">{embedding.siteUrl.site.siteName}</p>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Hash className="h-3 w-3 mr-1" />
                          {embedding.chunkIndex}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                          {truncateText(embedding.contentChunk)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <TimeAgo date={embedding.createdAt} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/urls/${embedding.siteUrl.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View URL
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteEmbedding(embedding)}
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
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} embeddings
              </p>
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteEmbedding}
        onOpenChange={(open) => !open && setDeleteEmbedding(null)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Embedding"
        description="Are you sure you want to delete this embedding? This will remove it from the vector database."
      />
    </div>
  );
}
