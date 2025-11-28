"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Link2, AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { UrlsTable, UrlsFilters } from "@/components/admin/urls";
import {
  useGetApiV1AdminUrls,
  useDeleteApiV1AdminUrlsUrlId,
  usePatchApiV1AdminUrlsUrlId,
  getGetApiV1AdminUrlsQueryKey,
} from "@/lib/api/generated/queries/admin-urls/admin-urls";
import type { GetApiV1AdminUrlsParams } from "@/lib/api/generated/models";
import type { SiteUrlExtended } from "@/lib/types/admin-urls";

export default function AdminUrlsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [isActive, setIsActive] = useState(
    searchParams.get("isActive") || "all"
  );
  const [hasEmbeddings, setHasEmbeddings] = useState(
    searchParams.get("hasEmbeddings") || "all"
  );
  const [siteId, setSiteId] = useState<string | null>(
    searchParams.get("siteId") || null
  );
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteUrl, setDeleteUrl] = useState<SiteUrlExtended | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  const queryParams: GetApiV1AdminUrlsParams = {
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
    ...(siteId && { siteId }),
    ...(isActive !== "all" && { isActive }),
    ...(hasEmbeddings !== "all" && { hasEmbeddings }),
  };

  const { data, isLoading, error } = useGetApiV1AdminUrls(queryParams);

  const deleteMutation = useDeleteApiV1AdminUrlsUrlId({
    mutation: {
      onSuccess: () => {
        setDeleteUrl(null);
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminUrlsQueryKey(queryParams),
        });
      },
    },
  });

  const updateMutation = usePatchApiV1AdminUrlsUrlId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminUrlsQueryKey(queryParams),
        });
      },
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = () => {
    if (!deleteUrl) return;
    deleteMutation.mutate({ urlId: deleteUrl.id });
  };

  const handleToggleActive = (urlId: string, currentStatus: boolean) => {
    updateMutation.mutate({
      urlId,
      data: { isActive: !currentStatus },
    });
  };

  const urls = (data?.data?.urls || []) as unknown as SiteUrlExtended[];
  const pagination = data?.data?.pagination;
  const errorMessage =
    error?.message ||
    deleteMutation.error?.message ||
    updateMutation.error?.message;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            URLs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage crawled URLs and their embeddings
          </p>
        </div>
      </div>

      <UrlsFilters
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        siteId={siteId}
        onSiteChange={(id) => {
          setSiteId(id);
          setPage(1);
        }}
        isActive={isActive}
        onIsActiveChange={(v) => {
          setIsActive(v);
          setPage(1);
        }}
        hasEmbeddings={hasEmbeddings}
        onHasEmbeddingsChange={(v) => {
          setHasEmbeddings(v);
          setPage(1);
        }}
      />

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data?.data ? (
        <UrlsTable
          urls={urls}
          pagination={pagination}
          onPageChange={setPage}
          onDelete={setDeleteUrl}
          onToggleActive={handleToggleActive}
        />
      ) : null}

      <DeleteConfirmationDialog
        open={!!deleteUrl}
        onOpenChange={(open) => !open && setDeleteUrl(null)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete URL"
        description={`Are you sure you want to delete this URL and its ${
          deleteUrl?.embeddingsCount || 0
        } embeddings? This action cannot be undone.`}
      />
    </div>
  );
}
