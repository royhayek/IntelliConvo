"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Palette,
  Search,
  MoreHorizontal,
  Eye,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TimeAgo } from "@/components/ui/time-ago";

// Import generated hooks
import {
  useGetAdminWidgets,
  useDeleteAdminWidgetsWidgetId,
  usePostAdminWidgetsWidgetIdReset,
  getGetAdminWidgetsQueryKey,
} from "@/lib/api/generated/queries/admin-widgets/admin-widgets";

// Import generated types
import type { GetAdminWidgetsParams } from "@/lib/api/generated/models";
import { TablePagination } from "@/components/ui/table-pagination";

// Extended widget interface to include additional fields from API response
// The generated types may not include all fields returned by the API
interface Widget {
  id: string;
  siteId: string;
  theme: string;
  primaryColor: string;
  headerTitle: string;
  botName: string;
  launcherPosition: string;
  autoOpenEnabled: boolean;
  enableAnimations: boolean;
  createdAt: string;
  updatedAt: string;
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

export default function AdminWidgetsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const [theme, setTheme] = useState(searchParams.get("theme") || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteWidget, setDeleteWidget] = useState<Widget | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Build query params
  const queryParams: GetAdminWidgetsParams = {
    page: page.toString(),
    limit: "20",
    ...(search && { search }),
    ...(theme !== "all" && { theme }),
  };

  // Fetch widgets using generated hook
  const {
    data: widgetsResponse,
    isLoading,
    error: widgetsError,
  } = useGetAdminWidgets(queryParams);

  // Delete mutation
  const deleteMutation = useDeleteAdminWidgetsWidgetId({
    mutation: {
      onSuccess: () => {
        setDeleteWidget(null);
        setMutationError(null);
        // Invalidate widgets query to refetch
        queryClient.invalidateQueries({
          queryKey: getGetAdminWidgetsQueryKey(queryParams),
        });
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to delete widget"
        );
      },
    },
  });

  // Reset mutation
  const resetMutation = usePostAdminWidgetsWidgetIdReset({
    mutation: {
      onSuccess: () => {
        setMutationError(null);
        // Invalidate widgets query to refetch
        queryClient.invalidateQueries({
          queryKey: getGetAdminWidgetsQueryKey(queryParams),
        });
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to reset widget"
        );
      },
    },
  });

  // Extract data from response - cast to extended Widget type
  const data = widgetsResponse?.data as
    | {
        widgets: Widget[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }
    | undefined;

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteWidget) return;
    deleteMutation.mutate({ widgetId: deleteWidget.id });
  };

  const handleReset = async (widget: Widget) => {
    resetMutation.mutate({ widgetId: widget.id });
  };

  // Compute error message
  const error = widgetsError
    ? widgetsError instanceof Error
      ? widgetsError.message
      : "An error occurred"
    : mutationError;

  const getThemeBadge = (widgetTheme: string) => {
    switch (widgetTheme) {
      case "light":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <Sun className="h-3 w-3 mr-1" />
            Light
          </Badge>
        );
      case "dark":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700">
            <Moon className="h-3 w-3 mr-1" />
            Dark
          </Badge>
        );
      case "auto":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Monitor className="h-3 w-3 mr-1" />
            Auto
          </Badge>
        );
      default:
        return <Badge variant="outline">{widgetTheme}</Badge>;
    }
  };

  const getPositionBadge = (position: string) => {
    const labels: Record<string, string> = {
      "bottom-right": "Bottom Right",
      "bottom-left": "Bottom Left",
      "top-right": "Top Right",
      "top-left": "Top Left",
    };
    return <Badge variant="outline">{labels[position] || position}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Widget Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage chat widget configurations
          </p>
        </div>
        {data && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {data.pagination.total.toLocaleString()} total
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by site name, user email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
        <Select
          value={theme}
          onValueChange={(v) => {
            setTheme(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Themes</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="auto">Auto</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="border rounded-lg dark:border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-slate-800">
                <TableHead>Site</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Theme</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Bot Name</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.widgets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    No widget settings found
                  </TableCell>
                </TableRow>
              ) : (
                data.widgets.map((widget) => (
                  <TableRow key={widget.id}>
                    <TableCell>
                      <Link
                        href={`/admin/sites/${widget.site.id}`}
                        className="hover:underline"
                      >
                        <p className="font-medium">{widget.site.siteName}</p>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">
                          {widget.site.siteUrl}
                        </p>
                      </Link>
                      <Link
                        href={`/admin/users/${widget.site.user.id}`}
                        className="text-xs text-gray-400 hover:underline"
                      >
                        {widget.site.user.email}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200"
                          style={{ backgroundColor: widget.primaryColor }}
                        />
                        <span className="font-mono text-xs text-gray-500">
                          {widget.primaryColor}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getThemeBadge(widget.theme)}</TableCell>
                    <TableCell>
                      {getPositionBadge(widget.launcherPosition)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{widget.botName}</p>
                      <p className="text-xs text-gray-500">
                        {widget.headerTitle}
                      </p>
                    </TableCell>
                    <TableCell>
                      <TimeAgo date={widget.updatedAt} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={
                              resetMutation.isPending &&
                              resetMutation.variables?.widgetId === widget.id
                            }
                          >
                            {resetMutation.isPending &&
                            resetMutation.variables?.widgetId === widget.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/widgets/${widget.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleReset(widget)}
                            className="text-orange-600"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset to Defaults
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteWidget(widget)}
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

          {/* Pagination */}
          {data.pagination && (
            <div className="px-6 pb-4">
              <TablePagination
                page={page}
                limit={data.pagination.limit}
                total={data.pagination.total}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
                itemName="messages"
              />
            </div>
          )}
        </div>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteWidget}
        onOpenChange={(open) => !open && setDeleteWidget(null)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Widget Settings"
        description={`Are you sure you want to delete widget settings for "${deleteWidget?.site.siteName}"? The site will need to reconfigure their widget.`}
      />
    </div>
  );
}
