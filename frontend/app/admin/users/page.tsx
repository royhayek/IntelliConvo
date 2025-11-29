"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Users, AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

import { UsersTable } from "@/components/admin/users/users-table";
import { UsersFilters } from "@/components/admin/users/users-filters";
import { UsersStats } from "@/components/admin/users/users-stats";

import {
  useGetAdminUsers,
  useDeleteAdminUsersUserId,
  usePostAdminUsersUserIdForceLogout,
  getGetAdminUsersQueryKey,
} from "@/lib/api/generated/queries/admin-users/admin-users";
import {
  useGetAdminStatsUsers,
  getGetAdminStatsUsersQueryKey,
} from "@/lib/api/generated/queries/admin/admin";

import type {
  AdminUser,
  GetAdminUsersParams,
  GetAdminUsersAuthProvider,
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
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [authProvider, setAuthProvider] = useState(
    searchParams.get("authProvider") || "all"
  );
  const [isAdmin, setIsAdmin] = useState(searchParams.get("isAdmin") || "all");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  const queryParams: GetAdminUsersParams = {
    page: page.toString(),
    limit: "20",
    ...(searchQuery && { search: searchQuery }),
    ...(authProvider !== "all" && {
      authProvider: authProvider as GetAdminUsersAuthProvider,
    }),
    ...(isAdmin !== "all" && { isAdmin }),
  };

  const { data: usersData, isLoading, error } = useGetAdminUsers(queryParams);

  const { data: statsData } = useGetAdminStatsUsers();

  const deleteUserMutation = useDeleteAdminUsersUserId({
    mutation: {
      onSuccess: () => {
        setDeleteUser(null);
        queryClient.invalidateQueries({
          queryKey: getGetAdminUsersQueryKey(queryParams),
        });
        queryClient.invalidateQueries({
          queryKey: getGetAdminStatsUsersQueryKey(),
        });
      },
    },
  });

  const forceLogoutMutation = usePostAdminUsersUserIdForceLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetAdminUsersQueryKey(queryParams),
        });
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

  const handleAuthProviderChange = (value: string) => {
    setAuthProvider(value);
    setPage(1);
  };

  const handleIsAdminChange = (value: string) => {
    setIsAdmin(value);
    setPage(1);
  };

  const data = usersData?.data;
  const stats = statsData?.data as UserStats | undefined;

  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : "An error occurred"
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
        <Button asChild>
          <Link href="/admin/users/new">
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && <UsersStats stats={stats} />}

      {/* Filters */}
      <UsersFilters
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        authProvider={authProvider}
        onAuthProviderChange={handleAuthProviderChange}
        isAdmin={isAdmin}
        onIsAdminChange={handleIsAdminChange}
      />

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
        <UsersTable
          users={data.users}
          pagination={data.pagination}
          onPageChange={setPage}
          onForceLogout={handleForceLogout}
          onDelete={setDeleteUser}
        />
      ) : null}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        onConfirm={handleDelete}
        isDeleting={deleteUserMutation.isPending}
        title="Delete User"
        description={`Are you sure you want to delete "${
          deleteUser?.fullName || deleteUser?.email
        }"? This action cannot be undone and will remove all associated data.`}
      />
    </div>
  );
}
