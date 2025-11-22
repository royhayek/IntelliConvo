"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSiteSocket } from "@/lib/hooks/useSiteSocket";
import {
  Plus,
  Edit2,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SearchBar } from "@/components/ui/search-bar";
import { ActionButtons } from "@/components/ui/action-buttons";
import { LoadingCard } from "@/components/ui/loading-card";
import { UrlTableRow } from "@/components/site/url-table-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useGetApiV1SitesSiteIdUrls,
  usePostApiV1SitesSiteIdUrls,
  usePatchApiV1SitesSiteIdUrlsUrlId,
  usePostApiV1SitesSiteIdUrlsUrlIdCrawl,
  useDeleteApiV1SitesSiteIdUrlsUrlId,
  useGetApiV1SitesSiteIdUrlsUrlId,
  usePutApiV1SitesSiteIdUrlsUrlIdContent,
  getGetApiV1SitesSiteIdUrlsQueryKey,
  getGetApiV1SitesSiteIdUrlsUrlIdQueryKey,
} from "@/lib/api/generated/queries/urls/urls";
import {
  type SiteResponse,
  type SiteUrl,
} from "@/lib/api/generated/models";

// Validation schemas
const addSingleUrlSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL")
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "URL must start with http:// or https://",
    }),
});

const addBulkUrlsSchema = z.object({
  urls: z
    .string()
    .min(1, "Please enter at least one URL")
    .transform((val) =>
      val
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean)
    )
    .refine((urls) => urls.length > 0, {
      message: "Please enter at least one URL",
    })
    .refine(
      (urls) =>
        urls.every((url) => {
          try {
            new URL(url);
            return url.startsWith("http://") || url.startsWith("https://");
          } catch {
            return false;
          }
        }),
      {
        message: "All URLs must be valid and start with http:// or https://",
      }
    ),
});

const editContentSchema = z.object({
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(100000, "Content is too large"),
});

type AddSingleUrlFormData = z.infer<typeof addSingleUrlSchema>;
type AddBulkUrlsFormData = z.output<typeof addBulkUrlsSchema>;
type AddBulkUrlsInput = z.input<typeof addBulkUrlsSchema>;
type EditContentFormData = z.infer<typeof editContentSchema>;

interface SitemapTabProps {
  site: SiteResponse;
}

export function SitemapTab({ site }: SitemapTabProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "excluded"
  >("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Preview/Edit modal state
  const [selectedUrlId, setSelectedUrlId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<"rich" | "text">("rich");

  // Delete confirmation state
  const [urlToDelete, setUrlToDelete] =
    useState<SiteUrl | null>(null);

  // Handle real-time URL status updates
  const handleUrlStatusUpdate = useCallback(
    (update: { siteId: string; urls: Array<{ urlId: string; embeddingStatus: string }> }) => {
      if (update.siteId !== site.id) return;

      // Update the query cache directly for real-time updates
      queryClient.setQueryData(
        getGetApiV1SitesSiteIdUrlsQueryKey(site.id),
        (oldData: SiteUrl[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((url) => {
            const updatedUrl = update.urls.find((u) => u.urlId === url.id);
            if (updatedUrl) {
              return { ...url, embeddingStatus: updatedUrl.embeddingStatus };
            }
            return url;
          });
        }
      );
    },
    [site.id, queryClient]
  );

  // Connect to socket for real-time URL status updates
  useSiteSocket({
    siteId: site.id,
    onUrlStatusUpdate: handleUrlStatusUpdate,
  });

  // Forms
  const singleUrlForm = useForm<AddSingleUrlFormData>({
    resolver: zodResolver(addSingleUrlSchema),
    defaultValues: { url: "" },
  });

  const bulkUrlsForm = useForm({
    resolver: zodResolver(addBulkUrlsSchema),
    defaultValues: { urls: "" },
  });

  const editContentForm = useForm<EditContentFormData>({
    resolver: zodResolver(editContentSchema),
    defaultValues: { content: "" },
  });

  // Get URLs
  const { data: urls = [], isLoading } = useGetApiV1SitesSiteIdUrls(site.id, {
    search: searchTerm || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Query for fetching single URL with content
  const { data: selectedUrlData, isLoading: isLoadingContent } =
    useGetApiV1SitesSiteIdUrlsUrlId(site.id, selectedUrlId || "", {
      query: { enabled: !!selectedUrlId },
    });

  // Reset forms when modal opens/closes
  useEffect(() => {
    if (!showAddModal) {
      singleUrlForm.reset();
      bulkUrlsForm.reset();
    }
  }, [showAddModal, singleUrlForm, bulkUrlsForm]);

  // Set content when entering edit mode
  useEffect(() => {
    if (isEditMode && selectedUrlData) {
      // Use htmlContent if available, otherwise use plain content
      const initialContent =
        selectedUrlData.htmlContent || selectedUrlData.content || "";
      editContentForm.reset({ content: initialContent });
    }
  }, [isEditMode, selectedUrlData, editContentForm]);

  // Add URLs mutation
  const addUrlsMutation = usePostApiV1SitesSiteIdUrls({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1SitesSiteIdUrlsQueryKey(site.id),
        });
        setShowAddModal(false);
        singleUrlForm.reset();
        bulkUrlsForm.reset();
        setIsBulkMode(false);
      },
    },
  });

  // Update URL mutation
  const updateUrlMutation = usePatchApiV1SitesSiteIdUrlsUrlId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1SitesSiteIdUrlsQueryKey(site.id),
        });
      },
    },
  });

  // Crawl URL mutation
  const crawlUrlMutation = usePostApiV1SitesSiteIdUrlsUrlIdCrawl({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1SitesSiteIdUrlsQueryKey(site.id),
        });
      },
    },
  });

  // Delete URL mutation
  const deleteUrlMutation = useDeleteApiV1SitesSiteIdUrlsUrlId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1SitesSiteIdUrlsQueryKey(site.id),
        });
        setUrlToDelete(null);
      },
    },
  });

  // Mutation for updating content
  const updateContentMutation = usePutApiV1SitesSiteIdUrlsUrlIdContent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1SitesSiteIdUrlsQueryKey(site.id),
        });
        if (selectedUrlId) {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1SitesSiteIdUrlsUrlIdQueryKey(
              site.id,
              selectedUrlId
            ),
          });
        }
        setIsEditMode(false);
        editContentForm.reset();
      },
    },
  });

  const onAddSingleUrl = (data: AddSingleUrlFormData) => {
    addUrlsMutation.mutate({ siteId: site.id, data: { urls: [data.url] } });
  };

  const onAddBulkUrls = (data: any) => {
    // URLs are already validated and transformed by Zod schema (string -> string[])
    addUrlsMutation.mutate({ siteId: site.id, data: { urls: data.urls as string[] } });
  };

  const onSaveContent = (data: EditContentFormData) => {
    if (selectedUrlId) {
      updateContentMutation.mutate({
        siteId: site.id,
        urlId: selectedUrlId,
        data: { content: data.content },
      });
    }
  };

  const toggleUrlStatus = (
    url: SiteUrl,
    field: "isActive" | "isExcluded"
  ) => {
    if (!url.id) return;
    updateUrlMutation.mutate({
      siteId: site.id,
      urlId: url.id,
      data: { [field]: !url[field] },
    });
  };

  const openPreviewModal = (urlId: string) => {
    setSelectedUrlId(urlId);
    setIsEditMode(false);
  };

  const closePreviewModal = () => {
    setSelectedUrlId(null);
    setIsEditMode(false);
    editContentForm.reset();
    setViewMode("rich");
  };

  const startEditing = () => {
    setIsEditMode(true);
  };

  const cancelEditing = () => {
    setIsEditMode(false);
    editContentForm.reset();
  };

  const filteredUrls = urls.filter((url) => {
    const matchesSearch =
      !searchTerm ||
      (url.url && url.url.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (url.title && url.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && url.isActive && !url.isExcluded) ||
      (statusFilter === "excluded" && url.isExcluded);

    return matchesSearch && matchesStatus;
  });

  const totalCount = urls.length;
  const activeCount = urls.filter(
    (url) => url.isActive && !url.isExcluded
  ).length;
  const excludedCount = urls.filter((url) => url.isExcluded).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Sitemap & URLs
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage the URLs that Intelligentconvo knows about
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New URL
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search URLs..."
            />
            <div className="flex items-center space-x-4">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as any)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Show All ({totalCount})</SelectItem>
                  <SelectItem value="active">Active ({activeCount})</SelectItem>
                  <SelectItem value="excluded">
                    Excluded ({excludedCount})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URLs Table */}
      <Card>
        <CardHeader>
          <CardTitle>URLs ({filteredUrls.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading URLs...</span>
            </div>
          ) : filteredUrls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No URLs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Last Crawled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUrls.map((url) => (
                  <UrlTableRow
                    key={url.id}
                    url={url}
                    onPreview={openPreviewModal}
                    onRecrawl={(urlId) =>
                      crawlUrlMutation.mutate({
                        siteId: site.id,
                        urlId,
                      })
                    }
                    onToggleStatus={toggleUrlStatus}
                    onDelete={setUrlToDelete}
                    isRecrawling={crawlUrlMutation.isPending}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add URL Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add URLs</DialogTitle>
            <DialogDescription>
              Add new URLs to crawl and include in your knowledge base
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex space-x-2 border-b dark:border-gray-600">
              <Button
                variant="ghost"
                onClick={() => setIsBulkMode(false)}
                className={`pb-2 px-1 text-sm font-medium border-b-2 rounded-none ${
                  !isBulkMode
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 dark:text-gray-400"
                }`}
              >
                Add One URL
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsBulkMode(true)}
                className={`pb-2 px-1 text-sm font-medium border-b-2 rounded-none ${
                  isBulkMode
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 dark:text-gray-400"
                }`}
              >
                Bulk Add URLs
              </Button>
            </div>

            {!isBulkMode ? (
              <Form {...singleUrlForm}>
                <form
                  onSubmit={singleUrlForm.handleSubmit(onAddSingleUrl)}
                  className="space-y-4"
                >
                  <FormField
                    control={singleUrlForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/page"
                            type="url"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a single URL to crawl and add to your knowledge
                          base
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ActionButtons
                    onCancel={() => setShowAddModal(false)}
                    confirmText="Add URL"
                    loadingText="Adding..."
                    isLoading={addUrlsMutation.isPending}
                  />
                </form>
              </Form>
            ) : (
              <Form {...bulkUrlsForm}>
                <form
                  onSubmit={bulkUrlsForm.handleSubmit(onAddBulkUrls)}
                  className="space-y-4"
                >
                  <FormField
                    control={bulkUrlsForm.control}
                    name="urls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URLs (one per line)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter multiple URLs, one per line, to add them all at
                          once
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={addUrlsMutation.isPending}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      {addUrlsMutation.isPending ? "Adding..." : "Add URLs"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview/Edit Content Dialog */}
      <Dialog
        open={!!selectedUrlId}
        onOpenChange={(open) => !open && closePreviewModal()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] min-h-[600px] flex flex-col p-0">
          <div className="p-6 border-b dark:border-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate text-gray-900 dark:text-white">
                  {selectedUrlData?.title || "Loading..."}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {selectedUrlData?.url}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Action Buttons Header */}
            <div className="flex justify-between px-6 py-3 border-b dark:border-gray-600 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-end">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedUrlData?.content?.length.toLocaleString()} characters |{" "}
                  {selectedUrlData?.embeddingsCount} chunks
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2">
                {!isEditMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditing}
                    disabled={isLoadingContent || !selectedUrlData?.content}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={cancelEditing}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={editContentForm.handleSubmit(onSaveContent)}
                      disabled={
                        updateContentMutation.isPending ||
                        !editContentForm.formState.isDirty
                      }
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {updateContentMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {isLoadingContent ? (
                <div className="flex items-center justify-center h-full p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : !selectedUrlData?.content ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 p-6">
                  <p>
                    No content available. This URL may not have been crawled
                    yet.
                  </p>
                </div>
              ) : isEditMode ? (
                <div className="flex-1 flex flex-col p-6 min-h-0">
                  <Form {...editContentForm}>
                    <form className="flex-1 flex flex-col min-h-0">
                      <FormField
                        control={editContentForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem className="flex-1 flex flex-col min-h-0">
                            <FormControl className="flex-1 min-h-0">
                              <RichTextEditor
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Edit the content with rich formatting..."
                                className="flex-1 h-full"
                              />
                            </FormControl>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between pt-2 flex-shrink-0">
                              <div className="flex items-center gap-4">
                                <span>
                                  {field.value?.length.toLocaleString() || 0}{" "}
                                  characters
                                </span>
                                <FormMessage />
                              </div>
                              <span>Changes will regenerate embeddings</span>
                            </div>
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  {selectedUrlData.htmlContent ? (
                    <div className="flex-1 bg-white dark:bg-slate-700 border dark:border-gray-600 rounded-lg shadow-sm overflow-auto">
                      <div
                        className="prose prose-sm max-w-none p-6
                          prose-headings:text-gray-900 dark:prose-headings:text-white
                          prose-p:text-gray-700 dark:prose-p:text-gray-300
                          prose-a:text-indigo-600
                          prose-strong:text-gray-900 dark:prose-strong:text-white
                          prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                          prose-ol:text-gray-700 dark:prose-ol:text-gray-300
                          prose-li:text-gray-700 dark:prose-li:text-gray-300
                          prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400
                          prose-code:text-gray-800 dark:prose-code:text-gray-200
                          prose-pre:bg-gray-100 dark:prose-pre:bg-slate-800"
                        dangerouslySetInnerHTML={{
                          __html: selectedUrlData.htmlContent,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 bg-gray-50 dark:bg-slate-700 rounded-lg p-4 overflow-auto">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
                        {selectedUrlData.content}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!urlToDelete}
        onOpenChange={(open) => !open && setUrlToDelete(null)}
        onConfirm={() =>
          urlToDelete?.id &&
          deleteUrlMutation.mutate({
            siteId: site.id,
            urlId: urlToDelete.id,
          })
        }
        title="Delete URL"
        description="Are you sure you want to permanently delete this URL? This action cannot be undone."
        itemName={
          urlToDelete?.title ||
          (urlToDelete?.url ? urlToDelete.url.split("/").pop() : "") ||
          urlToDelete?.url ||
          "Unknown URL"
        }
        itemDetails={urlToDelete?.url || ""}
        warningMessage="This will also delete all associated embeddings and remove the content from your knowledge base."
        isDeleting={deleteUrlMutation.isPending}
      />
    </div>
  );
}
