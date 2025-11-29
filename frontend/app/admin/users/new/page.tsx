"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Save,
  AlertTriangle,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  usePostAdminUsers,
  getGetAdminUsersQueryKey,
} from "@/lib/api/generated/queries/admin-users/admin-users";
import { getGetAdminStatsUsersQueryKey } from "@/lib/api/generated/queries/admin/admin";
import type { PostAdminUsersBody } from "@/lib/api/generated/models";

export default function AdminUserCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PostAdminUsersBody>({
    email: "",
    password: "",
    fullName: "",
    isAdmin: false,
  });
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Create mutation
  const createMutation = usePostAdminUsers({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetAdminUsersQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetAdminStatsUsersQueryKey(),
        });
        router.push("/admin/users");
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to create user"
        );
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMutationError(null);

    // Validation
    if (!formData.email) {
      setMutationError("Email is required");
      return;
    }

    if (!formData.password) {
      setMutationError("Password is required");
      return;
    }

    if (formData.password.length < 8) {
      setMutationError("Password must be at least 8 characters");
      return;
    }

    createMutation.mutate({
      data: formData,
    });
  };

  const isFormValid = formData.email && formData.password && formData.password.length >= 8;

  return (
    <div className="space-y-6">
      {/* Error alert */}
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
          <h1 className="text-2xl font-bold">Create New User</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/users">Cancel</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Create Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="user@example.com"
                required
              />
              <p className="text-sm text-muted-foreground">
                This will be the user's login email
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter password (min. 8 characters)"
                required
                minLength={8}
              />
              <p className="text-sm text-muted-foreground">
                Minimum 8 characters required
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="fullName"
                value={formData.fullName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Enter full name (optional)"
              />
            </div>

            {/* Admin Status */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label
                  htmlFor="isAdmin"
                  className="flex items-center gap-2 text-base"
                >
                  <Shield className="h-4 w-4" />
                  Administrator
                </Label>
                <p className="text-sm text-muted-foreground">
                  Grant this user administrative privileges
                </p>
              </div>
              <Switch
                id="isAdmin"
                checked={formData.isAdmin}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isAdmin: checked })
                }
              />
            </div>

            {/* Info box */}
            <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> The user will be created with EMAIL auth
                provider and can log in immediately with the provided credentials.
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
