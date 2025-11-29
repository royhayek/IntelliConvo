"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Link2,
  MessageSquare,
  FileText,
  RefreshCw,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { StatCard } from "@/components/ui/stat-card";
import {
  useGetAdminSitesSiteId,
  useDeleteAdminSitesSiteId,
  usePostAdminSitesSiteIdRecrawl,
  getGetAdminSitesSiteIdQueryKey,
} from "@/lib/api/generated/queries/admin-sites/admin-sites";
import {
  SiteInfoCard,
  OwnerCard,
  SubscriptionCard,
  ActiveHostsCard,
  ConversationStartersCard,
  WidgetSettingsCard,
  SpecialInstructionsCard,
} from "@/components/admin/site-detail";
import type { AdminSiteDetail } from "@/lib/api/generated/models";

export default function AdminSiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = params.siteId as string;

  const [showDelete, setShowDelete] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    data: siteResponse,
    isLoading,
    error: fetchError,
  } = useGetAdminSitesSiteId(siteId);

  const site: AdminSiteDetail | undefined = siteResponse?.data;

  const deleteMutation = useDeleteAdminSitesSiteId({
    mutation: {
      onSuccess: () => {
        router.push("/admin/sites");
      },
      onError: (error) => {
        setMutationError(error instanceof Error ? error.message : "Failed to delete site");
      },
    },
  });

  const recrawlMutation = usePostAdminSitesSiteIdRecrawl({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetAdminSitesSiteIdQueryKey(siteId),
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

      <SiteInfoCard site={site} />

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

      <OwnerCard user={site.user} />

      <SubscriptionCard subscription={site.subscription} />

      <ActiveHostsCard hosts={site.activeHosts} />

      <ConversationStartersCard starters={site.conversationStarters} />

      <WidgetSettingsCard settings={site.widgetSettings} />

      <SpecialInstructionsCard instructions={site.specialInstructions} />

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
