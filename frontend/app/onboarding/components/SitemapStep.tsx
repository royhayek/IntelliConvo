"use client";

import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, ArrowRight, Eye, Trash2, Loader2, ExternalLink, Edit2, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  useGetApiV1SitesSiteIdUrlsUrlId,
  useDeleteApiV1SitesSiteIdUrlsUrlId,
  usePatchApiV1SitesSiteIdUrlsUrlId,
  usePutApiV1SitesSiteIdUrlsUrlIdContent,
  getGetApiV1SitesSiteIdUrlsQueryKey,
  getGetApiV1SitesSiteIdUrlsUrlIdQueryKey,
} from "@/lib/api/generated/queries/urls/urls";
import { Site, SiteUrl } from "./types";

const editContentSchema = z.object({
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(100000, "Content is too large"),
});

type EditContentFormData = z.infer<typeof editContentSchema>;

interface SitemapStepProps {
  site: Site | undefined;
  urls: SiteUrl[];
  showAll: boolean;
  onToggleShowAll: () => void;
  onContinue: () => void;
}

export const SitemapStep = memo(function SitemapStep({
  site,
  urls,
  showAll,
  onToggleShowAll,
  onContinue,
}: SitemapStepProps) {
  const queryClient = useQueryClient();
  const [selectedUrlId, setSelectedUrlId] = useState<string | null>(null);
  const [urlToDelete, setUrlToDelete] = useState<SiteUrl | null>(null);
  const [excludedUrls, setExcludedUrls] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);

  // Form for editing content
  const editContentForm = useForm<EditContentFormData>({
    resolver: zodResolver(editContentSchema),
    defaultValues: { content: "" },
  });

  // Fetch URL content for preview
  const { data: selectedUrlData, isLoading: isLoadingContent } = useGetApiV1SitesSiteIdUrlsUrlId(
    site?.id || "",
    selectedUrlId || "",
    { query: { enabled: !!site?.id && !!selectedUrlId } }
  );

  // Set content when entering edit mode
  useEffect(() => {
    if (isEditMode && selectedUrlData) {
      const initialContent = selectedUrlData.htmlContent || selectedUrlData.content || "";
      editContentForm.reset({ content: initialContent });
    }
  }, [isEditMode, selectedUrlData, editContentForm]);

  // Delete mutation
  const deleteUrlMutation = useDeleteApiV1SitesSiteIdUrlsUrlId({
    mutation: {
      onSuccess: () => {
        if (site?.id) {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1SitesSiteIdUrlsQueryKey(site.id),
          });
        }
        setUrlToDelete(null);
      },
    },
  });

  // Update mutation for excluding URLs
  const updateUrlMutation = usePatchApiV1SitesSiteIdUrlsUrlId({
    mutation: {
      onSuccess: () => {
        if (site?.id) {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1SitesSiteIdUrlsQueryKey(site.id),
          });
        }
      },
    },
  });

  // Update content mutation
  const updateContentMutation = usePutApiV1SitesSiteIdUrlsUrlIdContent({
    mutation: {
      onSuccess: () => {
        if (site?.id) {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1SitesSiteIdUrlsQueryKey(site.id),
          });
        }
        if (selectedUrlId && site?.id) {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1SitesSiteIdUrlsUrlIdQueryKey(site.id, selectedUrlId),
          });
        }
        setIsEditMode(false);
        editContentForm.reset();
      },
    },
  });

  const handleToggleExclude = useCallback((url: SiteUrl) => {
    if (!url.id || !site?.id) return;

    const newExcluded = !excludedUrls.has(url.id);
    setExcludedUrls(prev => {
      const next = new Set(prev);
      if (newExcluded) {
        next.add(url.id!);
      } else {
        next.delete(url.id!);
      }
      return next;
    });

    updateUrlMutation.mutate({
      siteId: site.id,
      urlId: url.id,
      data: { isExcluded: newExcluded },
    });
  }, [site?.id, excludedUrls, updateUrlMutation]);

  const handleDelete = useCallback(() => {
    if (!urlToDelete?.id || !site?.id) return;
    deleteUrlMutation.mutate({
      siteId: site.id,
      urlId: urlToDelete.id,
    });
  }, [urlToDelete, site?.id, deleteUrlMutation]);

  const closePreviewModal = useCallback(() => {
    setSelectedUrlId(null);
    setIsEditMode(false);
    editContentForm.reset();
  }, [editContentForm]);

  const startEditing = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const cancelEditing = useCallback(() => {
    setIsEditMode(false);
    editContentForm.reset();
  }, [editContentForm]);

  const onSaveContent = useCallback((data: EditContentFormData) => {
    if (selectedUrlId && site?.id) {
      updateContentMutation.mutate({
        siteId: site.id,
        urlId: selectedUrlId,
        data: { content: data.content },
      });
    }
  }, [selectedUrlId, site?.id, updateContentMutation]);

  const displayedUrls = useMemo(() => {
    return showAll ? urls : urls.slice(0, 6);
  }, [urls, showAll]);

  const activeCount = useMemo(() => {
    return urls.filter(url => !excludedUrls.has(url.id || "")).length;
  }, [urls, excludedUrls]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activeCount} of {urls.length} pages selected
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{site?.siteName}</p>
            </div>
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">Ready</div>
        </div>
      </div>

      {/* URL List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-700/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click to preview & edit, uncheck to exclude from training
          </p>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {displayedUrls.map((url) => {
            const isExcluded = excludedUrls.has(url.id || "");
            return (
              <div
                key={url.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                <Checkbox
                  checked={!isExcluded}
                  onCheckedChange={() => handleToggleExclude(url)}
                  className="flex-shrink-0"
                />
                <button
                  onClick={() => setSelectedUrlId(url.id || null)}
                  className="flex-1 text-left min-w-0"
                >
                  <span className={`text-xs truncate block ${isExcluded ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"}`}>
                    {url.url}
                  </span>
                  {url.title && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate block">
                      {url.title}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setSelectedUrlId(url.id || null)}
                  >
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:text-red-600"
                    onClick={() => setUrlToDelete(url)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {urls.length > 6 && (
          <div className="border-t border-gray-100 dark:border-gray-700 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleShowAll}
              className="w-full text-xs h-7"
            >
              {showAll ? "Show less" : `Show all ${urls.length} pages`}
            </Button>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <Button
        onClick={onContinue}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        Continue with {activeCount} pages
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>

      {/* Preview/Edit Dialog - Same as sitemap-tab */}
      <Dialog open={!!selectedUrlId} onOpenChange={(open) => !open && closePreviewModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] min-h-[500px] flex flex-col p-0">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate text-gray-900 dark:text-white">
                  {selectedUrlData?.title || "Loading..."}
                </h3>
                <a
                  href={selectedUrlData?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <span className="truncate">{selectedUrlData?.url}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Action Buttons Header */}
            <div className="flex justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedUrlData?.content?.length?.toLocaleString() || 0} characters
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!isEditMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditing}
                    disabled={isLoadingContent || !selectedUrlData?.content}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1.5" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={cancelEditing} className="h-7 text-xs">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={editContentForm.handleSubmit(onSaveContent)}
                      disabled={updateContentMutation.isPending || !editContentForm.formState.isDirty}
                      className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                    >
                      {updateContentMutation.isPending ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3 w-3 mr-1.5" />
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
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-6">
                  <p className="text-sm">No content available yet.</p>
                  <p className="text-xs mt-1">Content will be extracted after you subscribe.</p>
                </div>
              ) : isEditMode ? (
                <div className="flex-1 flex flex-col p-4 min-h-0">
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
                                placeholder="Edit the content..."
                                className="flex-1 h-full"
                              />
                            </FormControl>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between pt-2 flex-shrink-0">
                              <div className="flex items-center gap-4">
                                <span>{field.value?.length?.toLocaleString() || 0} characters</span>
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
                <div className="flex-1 flex flex-col p-4 overflow-hidden">
                  {selectedUrlData.htmlContent ? (
                    <div className="flex-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm overflow-auto">
                      <div
                        className="prose prose-sm max-w-none p-4
                          prose-headings:text-gray-900 dark:prose-headings:text-white
                          prose-p:text-gray-700 dark:prose-p:text-gray-300
                          prose-a:text-indigo-600
                          prose-strong:text-gray-900 dark:prose-strong:text-white
                          prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                          prose-ol:text-gray-700 dark:prose-ol:text-gray-300
                          prose-li:text-gray-700 dark:prose-li:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: selectedUrlData.htmlContent }}
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

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!urlToDelete}
        onOpenChange={(open) => !open && setUrlToDelete(null)}
        onConfirm={handleDelete}
        title="Delete this page?"
        description="This page won't be included in your AI training."
        itemName={urlToDelete?.title || undefined}
        itemDetails={urlToDelete?.url}
        isDeleting={deleteUrlMutation.isPending}
      />
    </motion.div>
  );
});
