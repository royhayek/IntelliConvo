"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, AlertTriangle } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { getPaginationText } from "@/lib/utils/pagination";

import { SitesTable } from "@/components/admin/sites/sites-table";
import { SitesFilters } from "@/components/admin/sites/sites-filters";
import { SitesStats } from "@/components/admin/sites/sites-stats";

import {
  useGetApiV1AdminSites,
  useDeleteApiV1AdminSitesSiteId,
  usePostApiV1AdminSitesSiteIdRecrawl,
  usePostApiV1AdminSitesSiteIdCacheClear,
  getGetApiV1AdminSitesQueryKey,
} from "@/lib/api/generated/queries/admin-sites/admin-sites";
import {
  useGetApiV1AdminStatsSites,
  getGetApiV1AdminStatsSitesQueryKey,
} from "@/lib/api/generated/queries/admin/admin";

import type {
  AdminSite,
  GetApiV1AdminSitesParams,
  GetApiV1AdminSitesCrawlStatus,
} from "@/lib/api/generated/models";

interface SiteStats {
  total: number;
  byCrawlStatus: { status: string; count: number }[];
  failedCrawlsLast24h: number;
  totalUrlsIndexed: number;
  urlsPendingCrawl: number;
}

export default function AdminSitesPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [crawlStatus, setCrawlStatus] = useState(searchParams.get("crawlStatus") || "all");
  const [userId, setUserId] = useState<string | null>(searchParams.get("userId") || null);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteSite, setDeleteSite] = useState<AdminSite | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const queryParams: GetApiV1AdminSitesParams = {
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
    ...(userId && { userId }),
    ...(crawlStatus !== "all" && { crawlStatus: crawlStatus as GetApiV1AdminSitesCrawlStatus }),
  };

  const {
    data: sitesResponse,
    isLoading,
    error: sitesError,
  } = useGetApiV1AdminSites(queryParams);

  const { data: statsResponse } = useGetApiV1AdminStatsSites();

  const deleteMutation = useDeleteApiV1AdminSitesSiteId({
    mutation: {
      onSuccess: () => {
        setDeleteSite(null);
        setMutationError(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSitesQueryKey(queryParams) });
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminStatsSitesQueryKey() });
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to delete site");
      },
    },
  });

  const recrawlMutation = usePostApiV1AdminSitesSiteIdRecrawl({
    mutation: {
      onSuccess: () => {
        setMutationError(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSitesQueryKey(queryParams) });
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to trigger recrawl");
      },
    },
  });

  const clearCacheMutation = usePostApiV1AdminSitesSiteIdCacheClear({
    mutation: {
      onSuccess: () => {
        setMutationError(null);
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to clear cache");
      },
    },
  });

  const data = sitesResponse?.data;
  const stats = statsResponse?.data as SiteStats | undefined;

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteSite) return;
    deleteMutation.mutate({ siteId: deleteSite.id });
  };

  const handleRecrawl = (siteId: string) => {
    recrawlMutation.mutate({ siteId });
  };

  const handleClearCache = (siteId: string) => {
    clearCacheMutation.mutate({ siteId });
  };

  const handleCrawlStatusChange = (status: string) => {
    setCrawlStatus(status);
    setPage(1);
  };

  const handleUserIdChange = (id: string | null) => {
    setUserId(id);
    setPage(1);
  };

  const error = sitesError
    ? (sitesError instanceof Error ? sitesError.message : "An error occurred")
    : mutationError;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Sites
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage platform sites and their crawl status
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && <SitesStats stats={stats} />}

      {/* Filters */}
      <SitesFilters
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        userId={userId}
        onUserIdChange={handleUserIdChange}
        crawlStatus={crawlStatus}
        onCrawlStatusChange={handleCrawlStatusChange}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <>
          <SitesTable
            sites={data.sites}
            onRecrawl={handleRecrawl}
            onClearCache={handleClearCache}
            onDelete={setDeleteSite}
            isRecrawling={recrawlMutation.isPending}
            isClearingCache={clearCacheMutation.isPending}
          />

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {getPaginationText(
                  { page, limit: 20, total: data.pagination.total },
                  "sites"
                )}
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
        open={!!deleteSite}
        onOpenChange={(open) => !open && setDeleteSite(null)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Site"
        description={`Are you sure you want to delete "${deleteSite?.siteName}"? This action cannot be undone and will remove all associated data including URLs, embeddings, conversations, and files.`}
      />
    </div>
  );
}
