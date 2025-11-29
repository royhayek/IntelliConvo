"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Globe,
  CreditCard,
  LogOut,
  Edit,
  Trash2,
  AlertTriangle,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { StatCard } from "@/components/ui/stat-card";
import {
  useGetAdminUsersUserId,
  useDeleteAdminUsersUserId,
  usePostAdminUsersUserIdForceLogout,
  getGetAdminUsersUserIdQueryKey,
} from "@/lib/api/generated/queries/admin-users/admin-users";
import {
  UserInfoCard,
  UserSitesTable,
  UserSubscriptionsTable,
  UserBillingCard,
} from "@/components/admin/user-detail";
import type { AdminUserDetail } from "@/lib/api/generated/models";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.userId as string;

  const [showDelete, setShowDelete] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    data: userData,
    isLoading,
    error: userError,
  } = useGetAdminUsersUserId(userId);

  const user: AdminUserDetail | undefined = userData?.data;

  const deleteMutation = useDeleteAdminUsersUserId({
    mutation: {
      onSuccess: () => {
        router.push("/admin/users");
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to delete user");
      },
    },
  });

  const forceLogoutMutation = usePostAdminUsersUserIdForceLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetAdminUsersUserIdQueryKey(userId),
        });
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to force logout user");
      },
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ userId });
  };

  const handleForceLogout = () => {
    forceLogoutMutation.mutate({ userId });
  };

  const error = userError ? "Failed to fetch user" : mutationError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {mutationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleForceLogout}
            disabled={forceLogoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {forceLogoutMutation.isPending ? "Logging out..." : "Force Logout"}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/users/${userId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <UserInfoCard user={user} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Sites" value={user.sites.length} icon={Globe} color="blue" />
        <StatCard label="Subscriptions" value={user.subscriptions.length} icon={CreditCard} color="green" />
        <StatCard label="Active Sessions" value={user.activeSessions} icon={Monitor} color="purple" />
      </div>

      <UserSitesTable sites={user.sites} />

      <UserSubscriptionsTable subscriptions={user.subscriptions} />

      <UserBillingCard billingInfo={user.billingInfo} billingHistory={user.billingHistory} />

      <DeleteConfirmationDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete User"
        description={`Are you sure you want to delete "${user.fullName || user.email}"? This action cannot be undone and will permanently remove the user and all their associated data including sites, conversations, and subscriptions.`}
      />
    </div>
  );
}
