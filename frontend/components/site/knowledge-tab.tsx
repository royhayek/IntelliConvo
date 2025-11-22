"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LoadingCard } from "@/components/ui/loading-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUploadArea } from "@/components/ui/file-upload-area";
import { KnowledgeFileItem } from "@/components/site/knowledge-file-item";
import { toast } from "sonner";
import {
  useGetApiV1SitesSiteIdFiles,
  usePostApiV1SitesSiteIdFiles,
  useDeleteApiV1SitesSiteIdFilesFileId,
  usePostApiV1SitesSiteIdFilesFileIdReprocess,
  getGetApiV1SitesSiteIdFilesQueryKey,
} from "@/lib/api/generated/queries/files/files";
import { type SiteResponse } from "@/lib/api/generated/models";

interface KnowledgeTabProps {
  site: SiteResponse;
}

export function KnowledgeTab({ site }: KnowledgeTabProps) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: filesData, isLoading: isLoadingFiles } = useGetApiV1SitesSiteIdFiles(site.id);
  const files = filesData?.files;

  const uploadMutation = usePostApiV1SitesSiteIdFiles({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiV1SitesSiteIdFilesQueryKey(site.id) });
        toast.success("File uploaded successfully!");
        setUploadProgress(0);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to upload file");
        setUploadProgress(0);
      },
    },
  });

  const deleteMutation = useDeleteApiV1SitesSiteIdFilesFileId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiV1SitesSiteIdFilesQueryKey(site.id) });
        toast.success("File deleted successfully!");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to delete file");
      },
    },
  });

  const reprocessMutation = usePostApiV1SitesSiteIdFilesFileIdReprocess({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiV1SitesSiteIdFilesQueryKey(site.id) });
        toast.success("File reprocessing started!");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to reprocess file");
      },
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'text/plain'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF and TXT files are allowed");
        return;
      }

      if (file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setUploadProgress(0);
      uploadMutation.mutate({ siteId: site.id, data: { file } });
    }
  }, [uploadMutation, site.id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">PDFs & Knowledge</h2>
        <p className="text-gray-600 dark:text-gray-400">Upload additional documents to enhance your AI's knowledge</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <FileUploadArea
            onDrop={onDrop}
            accept={{
              'application/pdf': ['.pdf'],
              'text/plain': ['.txt'],
            }}
            maxFiles={1}
            maxSize={10 * 1024 * 1024}
            isUploading={uploadMutation.isPending}
            title={files && files.length > 0 ? "Upload Another File" : "Upload Your First File"}
            description="Drag and drop PDF or TXT files, or click to select"
          />

          {uploadMutation.isPending && (
            <div className="mt-4">
              <ProgressBar
                value={uploadProgress}
                showLabel={true}
                label="Uploading..."
                size="md"
                variant="default"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files List */}
      {isLoadingFiles ? (
        <LoadingCard message="Loading files..." />
      ) : files && files.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <KnowledgeFileItem
                  key={file.id}
                  fileName={file.originalName || "Unknown file"}
                  fileSize={Number(file.fileSize) || 0}
                  fileType={file.fileType || "Unknown"}
                  embeddingStatus={(file.embeddingStatus as any) ?? "PENDING"}
                  onRetry={
                    file.id
                      ? () => reprocessMutation.mutate({ siteId: site.id, fileId: file.id! })
                      : undefined
                  }
                  onDelete={
                    file.id
                      ? () => deleteMutation.mutate({ siteId: site.id, fileId: file.id! })
                      : undefined
                  }
                  isRetrying={reprocessMutation.isPending}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>

            {files.some(f => (f.embeddingStatus as string) === 'PROCESSING') && (
              <Alert className="mt-4">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Files are being processed and will be available for conversations once completed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-gray-100 dark:bg-slate-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Files Uploaded</h3>
              <p className="text-gray-600 dark:text-gray-400">Upload your first file to get started</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}