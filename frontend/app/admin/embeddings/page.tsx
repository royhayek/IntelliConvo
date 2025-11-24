"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Brain, AlertTriangle, TrendingUp, LinkIcon, Hash } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { SiteFilter } from "@/components/admin/site-filter";
import { EmbeddingsTable } from "@/components/admin/embeddings";
import {
  useGetApiV1AdminEmbeddings,
  useDeleteApiV1AdminEmbeddingsEmbeddingId,
  getGetApiV1AdminEmbeddingsQueryKey,
} from "@/lib/api/generated/queries/admin-embeddings/admin-embeddings";
import {
  useGetApiV1AdminStatsEmbeddings,
  getGetApiV1AdminStatsEmbeddingsQueryKey,
} from "@/lib/api/generated/queries/admin/admin";
import type { GetApiV1AdminEmbeddingsParams } from "@/lib/api/generated/models";

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
  const [siteId, setSiteId] = useState<string | null>(searchParams.get("siteId") || null);
  const [deleteEmbedding, setDeleteEmbedding] = useState<EmbeddingWithDetails | null>(null);

  const siteUrlId = searchParams.get("siteUrlId");

  const queryParams: GetApiV1AdminEmbeddingsParams = {
    page: page.toString(),
    limit: "20",
    ...(siteId && { siteId }),
    ...(siteUrlId && { siteUrlId }),
  };

  const {
    data: embeddingsResponse,
    isLoading: isLoadingEmbeddings,
    error: embeddingsError,
  } = useGetApiV1AdminEmbeddings(queryParams);

  const { data: statsResponse } = useGetApiV1AdminStatsEmbeddings();

  const deleteMutation = useDeleteApiV1AdminEmbeddingsEmbeddingId({
    mutation: {
      onSuccess: () => {
        setDeleteEmbedding(null);
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminEmbeddingsQueryKey(queryParams),
        });
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminStatsEmbeddingsQueryKey(),
        });
      },
    },
  });

  const embeddings = (embeddingsResponse?.data?.embeddings ?? []) as unknown as EmbeddingWithDetails[];
  const pagination = embeddingsResponse?.data?.pagination;
  const stats = statsResponse?.data as EmbeddingStats | undefined;

  const handleDelete = () => {
    if (!deleteEmbedding) return;
    deleteMutation.mutate({ embeddingId: deleteEmbedding.id });
  };

  const errorMessage = embeddingsError
    ? "Failed to fetch embeddings"
    : deleteMutation.error
    ? "Failed to delete embedding"
    : null;

  return (
    <div className="space-y-6">
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

      <div className="flex gap-2 flex-wrap">
        <SiteFilter
          value={siteId}
          onChange={(id) => { setSiteId(id); setPage(1); }}
          placeholder="All Sites"
        />
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoadingEmbeddings ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : embeddings ? (
        <>
          <EmbeddingsTable
            embeddings={embeddings}
            onDelete={setDeleteEmbedding}
          />

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
