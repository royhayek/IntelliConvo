"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Link2,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Brain,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  useGetApiV1AdminUrls,
  useDeleteApiV1AdminUrlsUrlId,
  usePatchApiV1AdminUrlsUrlId,
  getGetApiV1AdminUrlsQueryKey,
} from "@/lib/api/generated/queries/admin-urls/admin-urls";
import type { GetApiV1AdminUrlsParams, AdminUrl } from "@/lib/api/generated/models";

// Extended type to match actual API response which includes site and embeddingStatus
interface SiteUrlExtended extends AdminUrl {
  embeddingStatus: string;
  embeddingsCount: number;
  site: {
    id: string;
    siteName: string;
    siteUrl: string;
    user: {
      id: string;
      email: string;
      fullName: string | null;
    };
  };
}

export default function AdminUrlsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [isActive, setIsActive] = useState(searchParams.get("isActive") || "all");
  const [hasEmbeddings, setHasEmbeddings] = useState(searchParams.get("hasEmbeddings") || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteUrl, setDeleteUrl] = useState<SiteUrlExtended | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  // Build query params
  const queryParams: GetApiV1AdminUrlsParams = {
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
    ...(isActive !== "all" && { isActive }),
    ...(hasEmbeddings !== "all" && { hasEmbeddings }),
  };

  // Fetch URLs using generated hook
  const { data, isLoading, error } = useGetApiV1AdminUrls(queryParams);

  // Delete URL mutation
  const deleteMutation = useDeleteApiV1AdminUrlsUrlId({
    mutation: {
      onSuccess: () => {
        setDeleteUrl(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminUrlsQueryKey(queryParams) });
      },
    },
  });

  // Update URL mutation
  const updateMutation = usePatchApiV1AdminUrlsUrlId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminUrlsQueryKey(queryParams) });
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

  const getEmbeddingStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        className?: string;
        label: string;
        icon?: React.ReactNode;
      }
    > = {
      READY: {
        variant: "default",
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        label: "Ready",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
      },
      SCRAPED: {
        variant: "outline",
        label: "Discovered",
      },
      PENDING: {
        variant: "secondary",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        label: "Queued",
      },
      PROCESSING: {
        variant: "secondary",
        className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        label: "Processing",
      },
      FAILED: {
        variant: "destructive",
        label: "Failed",
        icon: <XCircle className="h-3 w-3 mr-1" />,
      },
      EXCLUDED: {
        variant: "outline",
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        label: "Excluded",
      },
    };
    const { variant, className, label, icon } = config[status] || { variant: "outline", label: status };
    return (
      <Badge variant={variant} className={className}>
        {icon}
        {label}
      </Badge>
    );
  };

  // Type assertion for URLs since generated types don't include all fields from API
  const urls = (data?.data?.urls || []) as SiteUrlExtended[];
  const pagination = data?.data?.pagination;
  const errorMessage = error?.message || deleteMutation.error?.message || updateMutation.error?.message;

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by URL or title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <div className="flex gap-2">
          <Select value={isActive} onValueChange={(v) => { setIsActive(v); setPage(1); }}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Embedding Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="SCRAPED">Discovered</SelectItem>
              <SelectItem value="PENDING">Queued</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="EXCLUDED">Excluded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={hasEmbeddings} onValueChange={(v) => { setHasEmbeddings(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Embeddings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All URLs</SelectItem>
              <SelectItem value="true">With Embeddings</SelectItem>
              <SelectItem value="false">Without Embeddings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data?.data ? (
        <>
          <div className="border rounded-lg dark:border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-800">
                  <TableHead>URL</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Embeddings</TableHead>
                  <TableHead>Last Crawled</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No URLs found
                    </TableCell>
                  </TableRow>
                ) : (
                  urls.map((url) => (
                    <TableRow key={url.id}>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {url.title || "Untitled"}
                          </p>
                          <a
                            href={url.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
                          >
                            {url.url}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/sites/${url.site.id}`}
                          className="hover:underline"
                        >
                          <p className="font-medium">{url.site.siteName}</p>
                          <p className="text-sm text-gray-500">{url.site.user.email}</p>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEmbeddingStatusBadge(url.embeddingStatus)}
                          {url.isExcluded && (
                            <Badge variant="destructive">Excluded</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={url.embeddingsCount > 0 ? "default" : "outline"}
                          className={url.embeddingsCount > 0 ? "bg-purple-100 text-purple-700" : ""}
                        >
                          <Brain className="h-3 w-3 mr-1" />
                          {url.embeddingsCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {url.lastCrawledAt ? (
                          <TimeAgo date={url.lastCrawledAt} />
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
                              <Link href={`/admin/urls/${url.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(url.id, url.isActive)}>
                              {url.isActive ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteUrl(url)}
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
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} URLs
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
        open={!!deleteUrl}
        onOpenChange={(open) => !open && setDeleteUrl(null)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete URL"
        description={`Are you sure you want to delete this URL and its ${deleteUrl?.embeddingsCount || 0} embeddings? This action cannot be undone.`}
      />
    </div>
  );
}
