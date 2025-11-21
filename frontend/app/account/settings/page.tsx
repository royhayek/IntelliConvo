"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Shield, AlertCircle, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/hooks/useAuth";
import { AuthLoading } from "@/components/auth/auth-loading";
import {
  usePatchApiV1Account,
  usePatchApiV1AccountPassword,
  useDeleteApiV1Account,
  getGetApiV1AccountQueryKey,
} from "@/lib/api/generated/queries/account/account";

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function AccountSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout, updateUser } = useAuthStore();

  // Protected route - redirects to login if not authenticated
  const { isLoading: isAuthLoading, user } = useRequireAuth();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

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

  const changePasswordMutation = usePatchApiV1AccountPassword({
    mutation: {
      onSuccess: () => {
        passwordForm.reset();
      },
    },
  });

  const deleteAccountMutation = useDeleteApiV1Account({
    mutation: {
      onSuccess: () => {
        logout();
        router.push("/");
      },
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate({ data });
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate({
      data: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
    });
  };

  const handleDeleteAccount = () => {
    if (showDeleteConfirm) {
      deleteAccountMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  // Show loading state while auth is hydrating
  if (isAuthLoading) {
    return <AuthLoading message="Loading account settings" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 border-l border-gray-300 dark:border-gray-600"></div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-600"></div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Intelligentconvo
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

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

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    {...profileForm.register("fullName")}
                    className="mt-1"
                  />
                  {profileForm.formState.errors.fullName && (
                    <p className="text-sm text-red-600 mt-1">
                      {profileForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...profileForm.register("email")}
                    className="mt-1"
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {updateProfileMutation.isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to update profile. Please try again.
                    </AlertDescription>
                  </Alert>
                )}

                {updateProfileMutation.isSuccess && (
                  <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Profile updated successfully!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <CardTitle>Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...passwordForm.register("currentPassword")}
                    className="mt-1"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register("newPassword")}
                    className="mt-1"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register("confirmPassword")}
                    className="mt-1"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {changePasswordMutation.isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to change password. Please check your current
                      password and try again.
                    </AlertDescription>
                  </Alert>
                )}

                {changePasswordMutation.isSuccess && (
                  <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Password changed successfully!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {changePasswordMutation.isPending
                      ? "Updating..."
                      : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/account/subscriptions" className="block">
                  <div className="p-4 border dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Subscriptions
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Manage your subscription plans and billing
                    </p>
                  </div>
                </Link>
                <Link href="/account/billing" className="block">
                  <div className="p-4 border dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Billing History
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      View your payment history and invoices
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-red-200 dark:border-red-800/50 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-300">
                      Delete Account
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {!showDeleteConfirm ? (
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-red-600 font-medium">
                          Are you sure?
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteAccount}
                            disabled={deleteAccountMutation.isPending}
                          >
                            {deleteAccountMutation.isPending
                              ? "Deleting..."
                              : "Yes, Delete"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {deleteAccountMutation.isError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to delete account. Please try again or contact support.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
