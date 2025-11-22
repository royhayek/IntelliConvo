"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Link2,
  ArrowLeft,
  ExternalLink,
  Brain,
  CheckCircle,
  XCircle,
  Trash2,
  Globe,
  User,
  Calendar,
  AlertTriangle,
  RefreshCw,
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
  useGetApiV1AdminUrlsUrlId,
  usePatchApiV1AdminUrlsUrlId,
  useDeleteApiV1AdminUrlsUrlId,
  useDeleteApiV1AdminUrlsUrlIdEmbeddings,
  getGetApiV1AdminUrlsUrlIdQueryKey,
} from "@/lib/api/generated/queries/admin-urls/admin-urls";

interface Embedding {
  id: string;
  chunkIndex: number;
  vectorId: string;
  createdAt: string;
}

interface UrlDetails {
  id: string;
  url: string;
  title: string | null;
  content: string | null;
  isActive: boolean;
  isExcluded: boolean;
  lastCrawledAt: string | null;
  createdAt: string;
  updatedAt: string;
  embeddingsCount: number;
  embeddings: Embedding[];
  site: {
    id: string;
    siteName: string;
    siteUrl: string;
    user: {
      id: string;
      email: string;
      fullName: string | null;
    };
  };
}

export default function AdminUrlDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const urlId = params.urlId as string;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteEmbeddingsDialog, setShowDeleteEmbeddingsDialog] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Fetch URL details using generated hook
  const {
    data: response,
    isLoading,
    error,
  } = useGetApiV1AdminUrlsUrlId(urlId);

  // Cast the response data to our detailed type since API returns more than generated type
  const data = response?.data as UrlDetails | undefined;

  // Update URL mutation
  const updateUrlMutation = usePatchApiV1AdminUrlsUrlId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminUrlsUrlIdQueryKey(urlId),
        });
        setMutationError(null);
      },
      onError: (err) => {
        setMutationError(err instanceof Error ? err.message : "Failed to update URL");
      },
    },
  });

  // Delete URL mutation
  const deleteUrlMutation = useDeleteApiV1AdminUrlsUrlId({
    mutation: {
      onSuccess: () => {
        router.push("/admin/urls");
      },
      onError: (err) => {
        setMutationError(err instanceof Error ? err.message : "Failed to delete URL");
      },
    },
  });

  // Delete embeddings mutation
  const deleteEmbeddingsMutation = useDeleteApiV1AdminUrlsUrlIdEmbeddings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminUrlsUrlIdQueryKey(urlId),
        });
        setShowDeleteEmbeddingsDialog(false);
        setMutationError(null);
      },
      onError: (err) => {
        setMutationError(err instanceof Error ? err.message : "Failed to delete embeddings");
      },
    },
  });

  const handleToggleActive = () => {
    if (!data) return;
    updateUrlMutation.mutate({
      urlId,
      data: { isActive: !data.isActive },
    });
  };

  const handleDelete = () => {
    deleteUrlMutation.mutate({ urlId });
  };

  const handleDeleteEmbeddings = () => {
    deleteEmbeddingsMutation.mutate({ urlId });
  };

  const isDeleting = deleteUrlMutation.isPending || deleteEmbeddingsMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || mutationError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {mutationError || (error instanceof Error ? error.message : "An error occurred")}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/urls">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to URLs
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Link2 className="h-6 w-6" />
              URL Details
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleActive}
            disabled={updateUrlMutation.isPending}
          >
            {data.isActive ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* URL Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="truncate max-w-2xl">{data.title || "Untitled"}</span>
            <div className="flex gap-2">
              {data.isActive ? (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
              {data.isExcluded && (
                <Badge variant="destructive">Excluded</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1 break-all"
            >
              {data.url}
              <ExternalLink className="h-4 w-4 flex-shrink-0" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Site</p>
                <Link href={`/admin/sites/${data.site.id}`} className="font-medium hover:underline">
                  {data.site.siteName}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <Link href={`/admin/users/${data.site.user.id}`} className="font-medium hover:underline">
                  {data.site.user.fullName || data.site.user.email}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Embeddings</p>
                <p className="font-medium">{data.embeddingsCount} chunks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Last Crawled</p>
                <p className="font-medium">
                  {data.lastCrawledAt ? <TimeAgo date={data.lastCrawledAt} /> : "Never"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embeddings Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Embeddings ({data.embeddingsCount})
          </CardTitle>
          {data.embeddingsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteEmbeddingsDialog(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Delete & Re-embed
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {data.embeddings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No embeddings for this URL yet.
            </p>
          ) : (
            <div className="border rounded-lg dark:border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-slate-800">
                    <TableHead>Chunk</TableHead>
                    <TableHead>Vector ID</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.embeddings.map((embedding) => (
                    <TableRow key={embedding.id}>
                      <TableCell>
                        <Badge variant="outline">#{embedding.chunkIndex}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {embedding.vectorId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <TimeAgo date={embedding.createdAt} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete URL Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title="Delete URL"
        description={`Are you sure you want to delete this URL and its ${data.embeddingsCount} embeddings? This action cannot be undone.`}
      />

      {/* Delete Embeddings Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteEmbeddingsDialog}
        onOpenChange={setShowDeleteEmbeddingsDialog}
        onConfirm={handleDeleteEmbeddings}
        isDeleting={isDeleting}
        title="Delete Embeddings"
        description={`Are you sure you want to delete all ${data.embeddingsCount} embeddings for this URL? The URL will need to be re-crawled to generate new embeddings.`}
      />
    </div>
  );
}
