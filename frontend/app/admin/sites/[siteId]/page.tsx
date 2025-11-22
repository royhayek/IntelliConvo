"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Globe,
  User,
  Link2,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  RefreshCw,
  Edit,
  Trash2,
  AlertTriangle,
  ExternalLink,
  CreditCard,
  Settings,
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
import { StatCard } from "@/components/ui/stat-card";
import {
  useGetApiV1AdminSitesSiteId,
  useDeleteApiV1AdminSitesSiteId,
  usePostApiV1AdminSitesSiteIdRecrawl,
  getGetApiV1AdminSitesSiteIdQueryKey,
} from "@/lib/api/generated/queries/admin-sites/admin-sites";

// Extended type for site detail since generated type may not include all fields
interface SiteDetail {
  id: string;
  siteName: string;
  siteUrl: string;
  siteDescription: string | null;
  siteIndustry: string | null;
  specialInstructions: string | null;
  welcomeMessage: string | null;
  crawlStatus: string;
  createdAt: string;
  updatedAt: string;
  lastCrawledAt: string | null;
  crawlDepth: number;
  maxPages: number;
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
  subscription: {
    id: string;
    status: string;
    planType: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  } | null;
  widgetSettings: {
    id: string;
    primaryColor: string;
    position: string;
  } | null;
  conversationStarters: {
    id: string;
    text: string;
    orderIndex: number;
  }[];
  activeHosts: {
    id: string;
    host: string;
    isVerified: boolean;
    createdAt: string;
  }[];
  stats: {
    urls: {
      total: number;
      breakdown: { isActive: boolean; isExcluded: boolean; _count: { id: number } }[];
    };
    conversations: {
      total: number;
      totalMessages: number;
      avgMessages: number;
    };
    files: {
      total: number;
      byStatus: { status: string; _count: { id: number } }[];
    };
  };
}

export default function AdminSiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = params.siteId as string;

  const [showDelete, setShowDelete] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Fetch site details using generated hook
  const {
    data: siteResponse,
    isLoading,
    error: fetchError,
  } = useGetApiV1AdminSitesSiteId(siteId);

  // Cast the data to our extended SiteDetail type since the API returns more fields
  const site = siteResponse?.data as SiteDetail | undefined;

  // Delete mutation
  const deleteMutation = useDeleteApiV1AdminSitesSiteId({
    mutation: {
      onSuccess: () => {
        router.push("/admin/sites");
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to delete site");
      },
    },
  });

  // Recrawl mutation
  const recrawlMutation = usePostApiV1AdminSitesSiteIdRecrawl({
    mutation: {
      onSuccess: () => {
        // Invalidate and refetch site data
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminSitesSiteIdQueryKey(siteId),
        });
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to trigger recrawl");
      },
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ siteId });
  };

  const handleRecrawl = () => {
    setMutationError(null);
    recrawlMutation.mutate({ siteId });
  };

  const getCrawlStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
      COMPLETED: { variant: "default", className: "bg-green-100 text-green-700" },
      IN_PROGRESS: { variant: "secondary", className: "bg-blue-100 text-blue-700" },
      PENDING: { variant: "outline" },
      FAILED: { variant: "destructive" },
    };
    const { variant, className } = config[status] || { variant: "outline" };
    return <Badge variant={variant} className={className}>{status}</Badge>;
  };

  // Combine fetch error and mutation error for display
  const error = fetchError ? "Failed to fetch site" : mutationError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !site) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!site) {
    return null;
  }

  const activeUrls = site.stats.urls.breakdown.find(b => b.isActive && !b.isExcluded)?._count.id || 0;
  const excludedUrls = site.stats.urls.breakdown.find(b => b.isExcluded)?._count.id || 0;

  return (
    <div className="space-y-6">
      {/* Error Alert for mutations */}
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
            <Link href="/admin/sites">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sites
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRecrawl} disabled={recrawlMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${recrawlMutation.isPending ? "animate-spin" : ""}`} />
            Trigger Recrawl
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/sites/${siteId}/edit`}>
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

      {/* Site Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Site Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Site Name</label>
              <p className="mt-1 text-lg font-medium">{site.siteName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">URL</label>
              <p className="mt-1">
                <a
                  href={site.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  {site.siteUrl}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Crawl Status</label>
              <p className="mt-1">{getCrawlStatusBadge(site.crawlStatus)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Industry</label>
              <p className="mt-1">{site.siteIndustry || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Created
              </label>
              <p className="mt-1">
                {new Date(site.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" /> Last Crawled
              </label>
              <p className="mt-1">
                {site.lastCrawledAt ? (
                  <TimeAgo date={site.lastCrawledAt} />
                ) : (
                  <span className="text-gray-400">Never</span>
                )}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="mt-1 text-gray-700 dark:text-gray-300">
                {site.siteDescription || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total URLs"
          value={site.stats.urls.total}
          icon={Link2}
          color="blue"
        />
        <StatCard
          label="Active URLs"
          value={activeUrls}
          icon={Link2}
          color="green"
        />
        <StatCard
          label="Conversations"
          value={site.stats.conversations.total}
          icon={MessageSquare}
          color="purple"
        />
        <StatCard
          label="Knowledge Files"
          value={site.stats.files.total}
          icon={FileText}
          color="indigo"
        />
      </div>

      {/* Owner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Owner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <Link
                href={`/admin/users/${site.user.id}`}
                className="font-medium text-lg hover:underline"
              >
                {site.user.fullName || "—"}
              </Link>
              <p className="text-gray-500">{site.user.email}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/users/${site.user.id}`}>
                View User
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          {site.subscription ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Plan</label>
                <p className="mt-1">
                  <Badge variant="secondary">{site.subscription.planType}</Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1">
                  <Badge
                    variant={site.subscription.status === "ACTIVE" ? "default" : "outline"}
                  >
                    {site.subscription.status}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Current Period End</label>
                <p className="mt-1">
                  {site.subscription.currentPeriodEnd
                    ? new Date(site.subscription.currentPeriodEnd).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No active subscription</p>
          )}
        </CardContent>
      </Card>

      {/* Active Hosts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Active Hosts ({site.activeHosts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {site.activeHosts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active hosts</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {site.activeHosts.map((host) => (
                  <TableRow key={host.id}>
                    <TableCell className="font-mono">{host.host}</TableCell>
                    <TableCell>
                      <Badge variant={host.isVerified ? "default" : "outline"}>
                        {host.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TimeAgo date={host.createdAt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Conversation Starters */}
      {site.conversationStarters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversation Starters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {site.conversationStarters.map((starter) => (
                <li
                  key={starter.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800 rounded"
                >
                  <Badge variant="outline">{starter.orderIndex + 1}</Badge>
                  <span>{starter.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Widget Settings */}
      {site.widgetSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Widget Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Primary Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: site.widgetSettings.primaryColor }}
                  />
                  <span className="font-mono text-sm">{site.widgetSettings.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Position</label>
                <p className="mt-1">
                  <Badge variant="outline">{site.widgetSettings.position}</Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Special Instructions */}
      {site.specialInstructions && (
        <Card>
          <CardHeader>
            <CardTitle>Special Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {site.specialInstructions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Site"
        description={`Are you sure you want to delete "${site.siteName}"? This action cannot be undone and will permanently remove all associated data including URLs, embeddings, conversations, files, and subscription data.`}
      />
    </div>
  );
}
