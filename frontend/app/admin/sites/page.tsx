"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

import { SitesTable } from "@/components/admin/sites/sites-table";
import { SitesFilters } from "@/components/admin/sites/sites-filters";
import { SitesStats } from "@/components/admin/sites/sites-stats";

import {
  useGetAdminSites,
  useDeleteAdminSitesSiteId,
  usePostAdminSitesSiteIdRecrawl,
  usePostAdminSitesSiteIdCacheClear,
  getGetAdminSitesQueryKey,
} from "@/lib/api/generated/queries/admin-sites/admin-sites";
import {
  useGetAdminStatsSites,
  getGetAdminStatsSitesQueryKey,
} from "@/lib/api/generated/queries/admin/admin";

import type {
  AdminSite,
  GetAdminSitesParams,
  GetAdminSitesCrawlStatus,
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
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const [crawlStatus, setCrawlStatus] = useState(
    searchParams.get("crawlStatus") || "all"
  );
  const [userId, setUserId] = useState<string | null>(
    searchParams.get("userId") || null
  );
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteSite, setDeleteSite] = useState<AdminSite | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const queryParams: GetAdminSitesParams = {
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
    ...(userId && { userId }),
    ...(crawlStatus !== "all" && {
      crawlStatus: crawlStatus as GetAdminSitesCrawlStatus,
    }),
  };

  const {
    data: sitesResponse,
    isLoading,
    error: sitesError,
  } = useGetAdminSites(queryParams);

  const { data: statsResponse } = useGetAdminStatsSites();

  const deleteMutation = useDeleteAdminSitesSiteId({
    mutation: {
      onSuccess: () => {
        setDeleteSite(null);
        setMutationError(null);
        queryClient.invalidateQueries({
          queryKey: getGetAdminSitesQueryKey(queryParams),
        });
        queryClient.invalidateQueries({
          queryKey: getGetAdminStatsSitesQueryKey(),
        });
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to delete site"
        );
      },
    },
  });

  const recrawlMutation = usePostAdminSitesSiteIdRecrawl({
    mutation: {
      onSuccess: () => {
        setMutationError(null);
        queryClient.invalidateQueries({
          queryKey: getGetAdminSitesQueryKey(queryParams),
        });
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to trigger recrawl"
        );
      },
    },
  });

  const clearCacheMutation = usePostAdminSitesSiteIdCacheClear({
    mutation: {
      onSuccess: () => {
        setMutationError(null);
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to clear cache"
        );
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
    ? sitesError instanceof Error
      ? sitesError.message
      : "An error occurred"
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
        <SitesTable
          sites={data.sites}
          pagination={data.pagination}
          onPageChange={setPage}
          onRecrawl={handleRecrawl}
          onClearCache={handleClearCache}
          onDelete={setDeleteSite}
          isRecrawling={recrawlMutation.isPending}
          isClearingCache={clearCacheMutation.isPending}
        />
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
