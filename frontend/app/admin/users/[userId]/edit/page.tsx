"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Save,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useGetApiV1AdminUsersUserId,
  usePatchApiV1AdminUsersUserId,
  getGetApiV1AdminUsersUserIdQueryKey,
} from "@/lib/api/generated/queries/admin-users/admin-users";
import type { PatchApiV1AdminUsersUserIdBody } from "@/lib/api/generated/models";

export default function AdminUserEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.userId as string;

  const [formData, setFormData] = useState<PatchApiV1AdminUsersUserIdBody>({
    fullName: "",
    email: "",
    isAdmin: false,
  });
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user details
  const {
    data: userData,
    isLoading,
    error: fetchError,
  } = useGetApiV1AdminUsersUserId(userId);

  const user = userData?.data;

  // Update mutation
  const updateMutation = usePatchApiV1AdminUsersUserId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminUsersUserIdQueryKey(userId),
        });
        router.push(`/admin/users/${userId}`);
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to update user"
        );
      },
    },
  });

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email,
        isAdmin: user.isAdmin,
      });
    }
  }, [user]);

  // Track changes
  useEffect(() => {
    if (user) {
      const changed =
        formData.fullName !== (user.fullName || "") ||
        formData.email !== user.email ||
        formData.isAdmin !== user.isAdmin;
      setHasChanges(changed);
    }
  }, [formData, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMutationError(null);

    // Only send changed fields
    const updates: PatchApiV1AdminUsersUserIdBody = {};
    if (formData.fullName !== (user?.fullName || "")) {
      updates.fullName = formData.fullName;
    }
    if (formData.email !== user?.email) {
      updates.email = formData.email;
    }
    if (formData.isAdmin !== user?.isAdmin) {
      updates.isAdmin = formData.isAdmin;
    }

    updateMutation.mutate({
      userId,
      data: updates,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load user</AlertDescription>
      </Alert>
    );
  }

  if (!user) {
    return null;
  }

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
            <Link href={`/admin/users/${userId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to User
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit User</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/users/${userId}`}>Cancel</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email address"
                required
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

            {/* Auth Provider (read-only info) */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>Auth Provider:</strong> {user.authProvider}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>User ID:</strong> {user.id}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>Created:</strong>{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
