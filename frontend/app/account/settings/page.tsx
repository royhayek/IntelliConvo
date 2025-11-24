"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import {
  usePatchApiV1Account,
  usePatchApiV1AccountPassword,
  useDeleteApiV1Account,
  getGetApiV1AccountQueryKey,
} from "@/lib/api/generated/queries/account/account";
import {
  ProfileFormCard,
  SecurityFormCard,
  DeleteAccountCard,
  AccountPageHeader,
} from "@/components/account";
import { getBackLinkConfig } from "@/lib/utils/navigation";

function AccountSettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { logout, updateUser } = useAuthStore();
  const returnTo = searchParams.get("returnTo");

  const { isLoading: isAuthLoading, user } = useRequireAuth();

  const updateProfileMutation = usePatchApiV1Account({
    mutation: {
      onSuccess: (data) => {
        if (data.user && data.user.id) {
          updateUser({
            id: data.user.id,
            email: data.user.email ?? "",
            fullName: data.user.fullName,
          });
        }
        queryClient.invalidateQueries({ queryKey: getGetApiV1AccountQueryKey() });
      },
    },
  });

  const changePasswordMutation = usePatchApiV1AccountPassword();

  const deleteAccountMutation = useDeleteApiV1Account({
    mutation: {
      onSuccess: () => {
        logout();
        router.push("/");
      },
    },
  });

  const handleProfileSubmit = (data: { fullName: string; email: string }) => {
    updateProfileMutation.mutate({ data });
  };

  const handlePasswordSubmit = (data: { currentPassword: string; newPassword: string }) => {
    changePasswordMutation.mutate({ data });
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  if (isAuthLoading) {
    return <AuthLoading message="Loading account settings" />;
  }

  if (!user) {
    return null;
  }

  const backLink = getBackLinkConfig({
    returnTo,
    isAdmin: user?.isAdmin,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <AccountPageHeader backLink={backLink} userEmail={user.email} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Account Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account information and security settings
            </p>
          </div>

          <ProfileFormCard
            user={user}
            onSubmit={handleProfileSubmit}
            isPending={updateProfileMutation.isPending}
            isError={updateProfileMutation.isError}
            isSuccess={updateProfileMutation.isSuccess}
          />

          <SecurityFormCard
            onSubmit={handlePasswordSubmit}
            isPending={changePasswordMutation.isPending}
            isError={changePasswordMutation.isError}
            isSuccess={changePasswordMutation.isSuccess}
          />

          <DeleteAccountCard
            onDelete={handleDeleteAccount}
            isPending={deleteAccountMutation.isPending}
            isError={deleteAccountMutation.isError}
          />
        </div>
      </main>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={<AuthLoading message="Loading account settings" />}>
      <AccountSettingsPageContent />
    </Suspense>
  );
}
