"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  LogOut,
  Shield,
  AlertTriangle,
  TrendingUp,
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
  useGetApiV1AdminUsers,
  useDeleteApiV1AdminUsersUserId,
  usePostApiV1AdminUsersUserIdForceLogout,
  getGetApiV1AdminUsersQueryKey,
} from "@/lib/api/generated/queries/admin-users/admin-users";
import { useGetApiV1AdminStatsUsers } from "@/lib/api/generated/queries/admin/admin";

// Import generated types
import type {
  AdminUser,
  GetApiV1AdminUsersParams,
  GetApiV1AdminUsersAuthProvider,
} from "@/lib/api/generated/models";

interface UserStats {
  total: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  byAuthProvider: { provider: string; count: number }[];
  activeLastWeek: number;
  activeLastMonth: number;
  adminCount: number;
}

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [authProvider, setAuthProvider] = useState(searchParams.get("authProvider") || "all");
  const [isAdmin, setIsAdmin] = useState(searchParams.get("isAdmin") || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  // Build query params
  const queryParams: GetApiV1AdminUsersParams = {
    page: page.toString(),
    limit: "20",
    ...(searchQuery && { search: searchQuery }),
    ...(authProvider !== "all" && { authProvider: authProvider as GetApiV1AdminUsersAuthProvider }),
    ...(isAdmin !== "all" && { isAdmin }),
  };

  // Fetch users using generated hook
  const {
    data: usersData,
    isLoading,
    error,
  } = useGetApiV1AdminUsers(queryParams);

  // Fetch stats using generated hook
  const { data: statsData } = useGetApiV1AdminStatsUsers();

  // Delete mutation
  const deleteUserMutation = useDeleteApiV1AdminUsersUserId({
    mutation: {
      onSuccess: () => {
        setDeleteUser(null);
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminUsersQueryKey(queryParams) });
      },
    },
  });

  // Force logout mutation
  const forceLogoutMutation = usePostApiV1AdminUsersUserIdForceLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiV1AdminUsersQueryKey(queryParams) });
      },
    },
  });

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(search);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    deleteUserMutation.mutate({ userId: deleteUser.id });
  };

  const handleForceLogout = (userId: string) => {
    forceLogoutMutation.mutate({ userId });
  };

  const getAuthProviderBadge = (provider: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      EMAIL: "default",
      GOOGLE: "secondary",
      APPLE: "outline",
    };
    return <Badge variant={variants[provider] || "outline"}>{provider}</Badge>;
  };

  // Extract data from responses
  const data = usersData?.data;
  const stats = statsData?.data as UserStats | undefined;

  // Compute error message
  const errorMessage = error
    ? (error instanceof Error ? error.message : "An error occurred")
    : deleteUserMutation.error
    ? "Failed to delete user"
    : forceLogoutMutation.error
    ? "Failed to force logout user"
    : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6" />
            Users
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage platform users and their access
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={stats.total.toLocaleString()}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="New Today"
            value={stats.newToday}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Active (7 days)"
            value={stats.activeLastWeek}
            icon={Clock}
            color="purple"
          />
          <StatCard
            label="Admin Users"
            value={stats.adminCount}
            icon={Shield}
            color="indigo"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <div className="flex gap-2">
          <Select value={authProvider} onValueChange={(v) => { setAuthProvider(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Auth Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="GOOGLE">Google</SelectItem>
              <SelectItem value="APPLE">Apple</SelectItem>
            </SelectContent>
          </Select>

          <Select value={isAdmin} onValueChange={(v) => { setIsAdmin(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="true">Admins</SelectItem>
              <SelectItem value="false">Regular Users</SelectItem>
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
      ) : data ? (
        <>
          <div className="border rounded-lg dark:border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-800">
                  <TableHead>User</TableHead>
                  <TableHead>Auth Provider</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sites</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="hover:underline"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.fullName || "-"}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>{getAuthProviderBadge(user.authProvider)}</TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user._count?.sites ?? 0}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt ? (
                          <TimeAgo date={user.lastLoginAt} />
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <TimeAgo date={user.createdAt} />
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
                              <Link href={`/admin/users/${user.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleForceLogout(user.id)}>
                              <LogOut className="h-4 w-4 mr-2" />
                              Force Logout
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteUser(user)}
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
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} users
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
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        onConfirm={handleDelete}
        isDeleting={deleteUserMutation.isPending}
        title="Delete User"
        description={`Are you sure you want to delete "${deleteUser?.fullName || deleteUser?.email}"? This action cannot be undone and will remove all associated data.`}
      />
    </div>
  );
}
