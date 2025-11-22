"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  Globe,
  CreditCard,
  LogOut,
  Edit,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TimeAgo } from "@/components/ui/time-ago";
import {
  useGetApiV1AdminUsersUserId,
  useDeleteApiV1AdminUsersUserId,
  usePostApiV1AdminUsersUserIdForceLogout,
  getGetApiV1AdminUsersUserIdQueryKey,
} from "@/lib/api/generated/queries/admin-users/admin-users";

// Extended user detail interface for the detailed API response
// The generated AdminUser type doesn't include all these fields
interface UserDetail {
  id: string;
  email: string;
  fullName: string | null;
  authProvider: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  activeSessions: number;
  sites: {
    id: string;
    siteName: string;
    siteUrl: string;
    crawlStatus: string;
    createdAt: string;
    _count: {
      urls: number;
      conversations: number;
    };
  }[];
  subscriptions: {
    id: string;
    planType: string;
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    site: {
      id: string;
      siteName: string;
    } | null;
  }[];
  billingInfo: {
    id: string;
    stripeCustomerId: string | null;
    email: string | null;
    fullName: string | null;
  } | null;
  billingHistory: {
    id: string;
    invoiceId: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }[];
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.userId as string;

  const [showDelete, setShowDelete] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Fetch user details using generated hook
  const {
    data: userData,
    isLoading,
    error: queryError,
  } = useGetApiV1AdminUsersUserId(userId);

  // Type the user data as UserDetail since the API returns extended data
  const user = userData?.data as UserDetail | undefined;

  // Delete mutation
  const deleteMutation = useDeleteApiV1AdminUsersUserId({
    mutation: {
      onSuccess: () => {
        router.push("/admin/users");
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to delete user"
        );
      },
    },
  });

  // Force logout mutation
  const forceLogoutMutation = usePostApiV1AdminUsersUserIdForceLogout({
    mutation: {
      onSuccess: () => {
        // Refresh user data after force logout
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminUsersUserIdQueryKey(userId),
        });
      },
      onError: (error) => {
        setMutationError(
          error instanceof Error ? error.message : "Failed to force logout user"
        );
      },
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ userId });
  };

  const handleForceLogout = () => {
    forceLogoutMutation.mutate({ userId });
  };

  const getCrawlStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      COMPLETED: "default",
      IN_PROGRESS: "secondary",
      PENDING: "outline",
      FAILED: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getSubscriptionStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      TRIALING: "secondary",
      PAST_DUE: "destructive",
      CANCELED: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  // Combine query error and mutation error
  const error = queryError
    ? "Failed to fetch user"
    : mutationError;

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
      {/* Error alert for mutation errors */}
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

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="mt-1 text-lg font-medium">{user.fullName || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Mail className="h-4 w-4" /> Email
              </label>
              <p className="mt-1 text-lg">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Auth Provider</label>
              <p className="mt-1">
                <Badge variant="outline">{user.authProvider}</Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Shield className="h-4 w-4" /> Role
              </label>
              <p className="mt-1">
                {user.isAdmin ? (
                  <Badge className="bg-indigo-100 text-indigo-700">Admin</Badge>
                ) : (
                  <Badge variant="outline">User</Badge>
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Created
              </label>
              <p className="mt-1">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" /> Last Login
              </label>
              <p className="mt-1">
                {user.lastLoginAt ? (
                  <TimeAgo date={user.lastLoginAt} />
                ) : (
                  <span className="text-gray-400">Never</span>
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Active Sessions</label>
              <p className="mt-1">
                <Badge variant="outline">{user.activeSessions}</Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Sites ({user.sites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.sites.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No sites created</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URLs</TableHead>
                  <TableHead>Conversations</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <Link
                        href={`/admin/sites/${site.id}`}
                        className="font-medium hover:underline"
                      >
                        {site.siteName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <a
                        href={site.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {site.siteUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>{getCrawlStatusBadge(site.crawlStatus)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{site._count.urls}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{site._count.conversations}</Badge>
                    </TableCell>
                    <TableCell>
                      <TimeAgo date={site.createdAt} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/sites/${site.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscriptions ({user.subscriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.subscriptions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No subscriptions</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Trial Ends</TableHead>
                  <TableHead>Period End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Badge variant="secondary">{sub.planType}</Badge>
                    </TableCell>
                    <TableCell>{getSubscriptionStatusBadge(sub.status)}</TableCell>
                    <TableCell>
                      {sub.site ? (
                        <Link
                          href={`/admin/sites/${sub.site.id}`}
                          className="hover:underline"
                        >
                          {sub.site.siteName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.trialEndsAt ? (
                        new Date(sub.trialEndsAt).toLocaleDateString()
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.currentPeriodEnd ? (
                        new Date(sub.currentPeriodEnd).toLocaleDateString()
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      {user.billingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.billingHistory.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-sm">{txn.invoiceId}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: txn.currency,
                      }).format(txn.amount / 100)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={txn.status === "paid" ? "default" : "outline"}>
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TimeAgo date={txn.createdAt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
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
