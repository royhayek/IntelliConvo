"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Link2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useGetApiV1AdminSites,
  useDeleteApiV1AdminSitesSiteId,
  usePostApiV1AdminSitesSiteIdRecrawl,
  getGetApiV1AdminSitesQueryKey,
} from "@/lib/api/generated/queries/admin-sites/admin-sites";
import { useGetApiV1AdminStatsSites } from "@/lib/api/generated/queries/admin/admin";

// Import generated types
import type {
  AdminSite,
  GetApiV1AdminSitesParams,
  GetApiV1AdminSitesCrawlStatus,
} from "@/lib/api/generated/models";

// Interface for site stats (backend response structure)
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
  const [crawlStatus, setCrawlStatus] = useState(
    searchParams.get("crawlStatus") || "all"
  );
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteSite, setDeleteSite] = useState<AdminSite | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Build query params
  const queryParams: GetApiV1AdminSitesParams = {
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
    ...(crawlStatus !== "all" && { crawlStatus: crawlStatus as GetApiV1AdminSitesCrawlStatus }),
  };

  // Fetch sites using generated hook
  const {
    data: sitesResponse,
    isLoading,
    error: sitesError,
  } = useGetApiV1AdminSites(queryParams);

  // Fetch site stats using generated hook
  const { data: statsResponse } = useGetApiV1AdminStatsSites();

  // Delete mutation
  const deleteMutation = useDeleteApiV1AdminSitesSiteId({
    mutation: {
      onSuccess: () => {
        setDeleteSite(null);
        setMutationError(null);
        // Invalidate sites query to refetch
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSitesQueryKey(queryParams) });
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to delete site");
      },
    },
  });

  // Recrawl mutation
  const recrawlMutation = usePostApiV1AdminSitesSiteIdRecrawl({
    mutation: {
      onSuccess: () => {
        setMutationError(null);
        // Invalidate sites query to refetch
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminSitesQueryKey(queryParams) });
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to trigger recrawl");
      },
    },
  });

  // Extract data from responses
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

  const handleRecrawl = async (siteId: string) => {
    recrawlMutation.mutate({ siteId });
  };

  // Compute error message
  const error = sitesError
    ? (sitesError instanceof Error ? sitesError.message : "An error occurred")
    : mutationError;

  const getCrawlStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        className?: string;
        label?: string;
      }
    > = {
      READY: {
        variant: "default",
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        label: "Ready",
      },
      COMPLETED: {
        variant: "default",
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        label: "Crawl Completed",
      },
      CRAWLING: {
        variant: "secondary",
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        label: "Crawling",
      },
      PROCESSING: {
        variant: "secondary",
        className:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        label: "Generating Embeddings",
      },
      PENDING: {
        variant: "outline",
        label: "Pending",
      },
      PARTIAL: {
        variant: "default",
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
        label: "Partial",
      },
      AWAITING_PAYMENT: {
        variant: "default",
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        label: "Awaiting Payment",
      },
      FAILED: {
        variant: "destructive",
        label: "Failed",
      },
    };
    const { variant, className, label } = config[status] || { variant: "outline", label: status };
    return (
      <Badge variant={variant} className={className}>
        {label}
      </Badge>
    );
  };

  const getSubscriptionBadge = (subscription: { id: string; status: string; planType: string } | null | undefined) => {
    if (!subscription) {
      return <Badge variant="outline">No Subscription</Badge>;
    }
    const statusColors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-700",
      TRIALING: "bg-blue-100 text-blue-700",
      PAST_DUE: "bg-red-100 text-red-700",
      CANCELED: "bg-gray-100 text-gray-700",
    };
    return (
      <Badge className={statusColors[subscription.status] || ""}>
        {subscription.planType} - {subscription.status}
      </Badge>
    );
  };

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
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sites"
            value={stats.total.toLocaleString()}
            icon={Globe}
            color="blue"
          />
          <StatCard
            label="URLs Indexed"
            value={stats.totalUrlsIndexed.toLocaleString()}
            icon={Link2}
            color="green"
          />
          <StatCard
            label="Pending Crawl"
            value={stats.urlsPendingCrawl}
            icon={Clock}
            color="orange"
          />
          <StatCard
            label="Failed (24h)"
            value={stats.failedCrawlsLast24h}
            icon={AlertTriangle}
            color={stats.failedCrawlsLast24h > 0 ? "red" : "green"}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by site name or URL..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <div className="flex gap-2">
          <Select
            value={crawlStatus}
            onValueChange={(v) => {
              setCrawlStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Crawl Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CRAWLING">Crawling</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="AWAITING_PAYMENT">Awaiting Payment</SelectItem>
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
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <>
          <div className="border rounded-lg dark:border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-800">
                  <TableHead>Site</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Crawl Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>URLs</TableHead>
                  <TableHead>Conversations</TableHead>
                  <TableHead>Last Crawled</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sites.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No sites found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.sites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell>
                        <Link
                          href={`/admin/sites/${site.id}`}
                          className="hover:underline"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {site.siteName}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              {site.siteUrl}
                              <a
                                href={site.siteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/users/${site.user?.id}`}
                          className="hover:underline"
                        >
                          <p className="font-medium">
                            {site.user?.fullName || "—"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {site.user?.email}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {getCrawlStatusBadge(site.crawlStatus)}
                      </TableCell>
                      <TableCell>
                        {getSubscriptionBadge((site as AdminSite & { subscription?: { id: string; status: string; planType: string } | null }).subscription)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{site.urlsCount ?? 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {site.conversationsCount ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {site.lastCrawledAt ? (
                          <TimeAgo date={site.lastCrawledAt} />
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
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
                              <Link href={`/admin/sites/${site.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/sites/${site.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRecrawl(site.id)}
                              disabled={recrawlMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Trigger Recrawl
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteSite(site)}
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
                Showing {(page - 1) * 20 + 1} to{" "}
                {Math.min(page * 20, data.pagination.total)} of{" "}
                {data.pagination.total} sites
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
