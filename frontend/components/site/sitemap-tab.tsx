"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, RefreshCw, X, Check, ExternalLink, Trash2, Eye, Edit2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetApiSitesSiteIdUrls,
  usePostApiSitesSiteIdUrls,
  usePatchApiSitesSiteIdUrlsUrlId,
  usePostApiSitesSiteIdUrlsUrlIdCrawl,
  useDeleteApiSitesSiteIdUrlsUrlId,
  useGetApiSitesSiteIdUrlsUrlId,
  usePutApiSitesSiteIdUrlsUrlIdContent,
  getGetApiSitesSiteIdUrlsQueryKey,
  getGetApiSitesSiteIdUrlsUrlIdQueryKey,
} from "@/lib/api/generated/queries/sites/sites";
import {
  type GetApiSitesSiteId200,
  type GetApiSitesSiteIdUrls200Item,
} from "@/lib/api/generated/models";

interface SitemapTabProps {
  site: GetApiSitesSiteId200;
}

export function SitemapTab({ site }: SitemapTabProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "excluded">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrls, setNewUrls] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Preview/Edit modal state
  const [selectedUrlId, setSelectedUrlId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [viewMode, setViewMode] = useState<"rich" | "text">("rich");

  // Delete confirmation state
  const [urlToDelete, setUrlToDelete] = useState<GetApiSitesSiteIdUrls200Item | null>(null);

  // Get URLs
  const { data: urls = [], isLoading } = useGetApiSitesSiteIdUrls(site.id, {
    search: searchTerm || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Add URLs mutation
  const addUrlsMutation = usePostApiSitesSiteIdUrls({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdUrlsQueryKey(site.id) });
        setShowAddModal(false);
        setNewUrls("");
        setIsBulkMode(false);
      },
    },
  });

  // Update URL mutation
  const updateUrlMutation = usePatchApiSitesSiteIdUrlsUrlId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdUrlsQueryKey(site.id) });
      },
    },
  });

  // Crawl URL mutation
  const crawlUrlMutation = usePostApiSitesSiteIdUrlsUrlIdCrawl({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdUrlsQueryKey(site.id) });
      },
    },
  });

  // Delete URL mutation
  const deleteUrlMutation = useDeleteApiSitesSiteIdUrlsUrlId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdUrlsQueryKey(site.id) });
        setUrlToDelete(null);
      },
    },
  });

  // Query for fetching single URL with content
  const { data: selectedUrlData, isLoading: isLoadingContent } = useGetApiSitesSiteIdUrlsUrlId(
    site.id,
    selectedUrlId || "",
    { query: { enabled: !!selectedUrlId } }
  );

  // Mutation for updating content
  const updateContentMutation = usePutApiSitesSiteIdUrlsUrlIdContent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdUrlsQueryKey(site.id) });
        if (selectedUrlId) {
          queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdUrlsUrlIdQueryKey(site.id, selectedUrlId) });
        }
        setIsEditMode(false);
      },
    },
  });

  const handleAddUrls = () => {
    const urlList = newUrls
      .split("\n")
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urlList.length > 0) {
      addUrlsMutation.mutate({ siteId: site.id, data: { urls: urlList } });
    }
  };

  const toggleUrlStatus = (url: GetApiSitesSiteIdUrls200Item, field: 'isActive' | 'isExcluded') => {
    if (!url.id) return;
    updateUrlMutation.mutate({
      siteId: site.id,
      urlId: url.id,
      data: { [field]: !url[field] }
    });
  };

  const openPreviewModal = (urlId: string) => {
    setSelectedUrlId(urlId);
    setIsEditMode(false);
    setEditedContent("");
  };

  const closePreviewModal = () => {
    setSelectedUrlId(null);
    setIsEditMode(false);
    setEditedContent("");
    setViewMode("rich");
  };

  const startEditing = () => {
    if (selectedUrlData?.content) {
      setEditedContent(selectedUrlData.content);
    }
    setIsEditMode(true);
  };

  const cancelEditing = () => {
    setIsEditMode(false);
    setEditedContent("");
  };

  const saveContent = () => {
    if (selectedUrlId && editedContent) {
      updateContentMutation.mutate({
        siteId: site.id,
        urlId: selectedUrlId,
        data: { content: editedContent },
      });
    }
  };

  const filteredUrls = urls.filter(url => {
    const matchesSearch = !searchTerm ||
      (url.url && url.url.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (url.title && url.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && url.isActive && !url.isExcluded) ||
      (statusFilter === "excluded" && url.isExcluded);

    return matchesSearch && matchesStatus;
  });

  const totalCount = urls.length;
  const activeCount = urls.filter(url => url.isActive && !url.isExcluded).length;
  const excludedCount = urls.filter(url => url.isExcluded).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sitemap & URLs</h2>
          <p className="text-gray-600">Manage the URLs that Intelligentconvo knows about</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          New URL
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search URLs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Show All ({totalCount})</option>
                <option value="active">Active ({activeCount})</option>
                <option value="excluded">Excluded ({excludedCount})</option>
              </select>
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
              <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUrls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No URLs found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUrls.map((url) => (
                <div
                  key={url.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className={`h-2 w-2 rounded-full ${
                        url.isExcluded ? 'bg-red-500' : url.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {url.title || (url.url ? url.url.split('/').pop() : '') || url.url || 'Unknown URL'}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{url.url || ''}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>
                      {url.lastCrawledAt ? new Date(url.lastCrawledAt).toLocaleDateString() : 'Not crawled'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => url.id && openPreviewModal(url.id)}
                      title="Preview & Edit content"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => url.url && window.open(url.url, '_blank')}
                      title="Open URL"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => url.id && crawlUrlMutation.mutate({ siteId: site.id, urlId: url.id })}
                      title="Recrawl this URL"
                      disabled={crawlUrlMutation.isPending}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleUrlStatus(url, 'isExcluded')}
                      title={url.isExcluded ? "Include in knowledge base" : "Exclude from knowledge base"}
                    >
                      {url.isExcluded ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUrlToDelete(url)}
                      title="Delete URL permanently"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add URL Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add URLs</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-2 border-b">
                  <button
                    onClick={() => setIsBulkMode(false)}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 ${
                      !isBulkMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
                    }`}
                  >
                    Add One URL
                  </button>
                  <button
                    onClick={() => setIsBulkMode(true)}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 ${
                      isBulkMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
                    }`}
                  >
                    Bulk Add URLs
                  </button>
                </div>

                <div>
                  {isBulkMode ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URLs (one per line)
                      </label>
                      <textarea
                        value={newUrls}
                        onChange={(e) => setNewUrls(e.target.value)}
                        placeholder="https://example.com/page1&#10;https://example.com/page2"
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL
                      </label>
                      <Input
                        value={newUrls}
                        onChange={(e) => setNewUrls(e.target.value)}
                        placeholder="https://example.com"
                        type="url"
                      />
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddUrls}
                    disabled={!newUrls.trim() || addUrlsMutation.isPending}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {addUrlsMutation.isPending ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview/Edit Content Modal */}
      {selectedUrlId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-lg font-semibold truncate">
                    {selectedUrlData?.title || 'Loading...'}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {selectedUrlData?.url}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveContent}
                        disabled={updateContentMutation.isPending}
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
                  <button
                    onClick={closePreviewModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {isLoadingContent ? (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !selectedUrlData?.content ? (
                <div className="flex items-center justify-center h-full text-gray-500 p-6">
                  <p>No content available. This URL may not have been crawled yet.</p>
                </div>
              ) : isEditMode ? (
                <div className="flex-1 flex flex-col p-6">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="flex-1 w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none"
                    placeholder="Edit the scraped content..."
                  />
                  <div className="mt-2 text-sm text-gray-500 flex justify-between">
                    <span>{editedContent.length.toLocaleString()} characters</span>
                    <span>Changes will regenerate embeddings</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* View Mode Toggle */}
                  <div className="px-6 pt-4 pb-2 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode("rich")}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            viewMode === "rich"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Rich Preview
                        </button>
                        <button
                          onClick={() => setViewMode("text")}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            viewMode === "text"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Plain Text
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedUrlData.content.length.toLocaleString()} characters | {selectedUrlData.embeddingsCount} chunks
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-auto p-6">
                    {viewMode === "rich" && selectedUrlData.htmlContent ? (
                      <div className="bg-white border rounded-lg shadow-sm">
                        <div
                          className="prose prose-sm max-w-none p-6
                            prose-headings:text-gray-900
                            prose-p:text-gray-700
                            prose-a:text-indigo-600
                            prose-strong:text-gray-900
                            prose-ul:text-gray-700
                            prose-ol:text-gray-700
                            prose-li:text-gray-700
                            prose-blockquote:text-gray-600
                            prose-code:text-gray-800
                            prose-pre:bg-gray-100"
                          dangerouslySetInnerHTML={{ __html: selectedUrlData.htmlContent }}
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                          {selectedUrlData.content}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {urlToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600">Delete URL</h3>
                <button
                  onClick={() => setUrlToDelete(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to permanently delete this URL? This action cannot be undone.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {urlToDelete.title || (urlToDelete.url ? urlToDelete.url.split('/').pop() : '') || urlToDelete.url || 'Unknown URL'}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{urlToDelete.url || ''}</p>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  This will also delete all associated embeddings and remove the content from your knowledge base.
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setUrlToDelete(null)}
                  className="flex-1"
                  disabled={deleteUrlMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => urlToDelete.id && deleteUrlMutation.mutate({ siteId: site.id, urlId: urlToDelete.id })}
                  disabled={deleteUrlMutation.isPending || !urlToDelete.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteUrlMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}