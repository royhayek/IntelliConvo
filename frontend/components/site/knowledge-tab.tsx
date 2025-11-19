"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Trash2, RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  useGetApiSitesSiteIdFiles,
  usePostApiSitesSiteIdFiles,
  useDeleteApiSitesSiteIdFilesFileId,
  usePostApiSitesSiteIdFilesFileIdReprocess,
  getGetApiSitesSiteIdFilesQueryKey,
} from "@/lib/api/generated/queries/knowledge-files/knowledge-files";
import { type GetApiSitesSiteId200 } from "@/lib/api/generated/models";

interface KnowledgeTabProps {
  site: GetApiSitesSiteId200;
}

export function KnowledgeTab({ site }: KnowledgeTabProps) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: filesData, isLoading: isLoadingFiles } = useGetApiSitesSiteIdFiles(site.id);
  const files = filesData?.files;

  const uploadMutation = usePostApiSitesSiteIdFiles({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdFilesQueryKey(site.id) });
        toast.success("File uploaded successfully!");
        setUploadProgress(0);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to upload file");
        setUploadProgress(0);
      },
    },
  });

  const deleteMutation = useDeleteApiSitesSiteIdFilesFileId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdFilesQueryKey(site.id) });
        toast.success("File deleted successfully!");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to delete file");
      },
    },
  });

  const reprocessMutation = usePostApiSitesSiteIdFilesFileIdReprocess({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSitesSiteIdFilesQueryKey(site.id) });
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
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PROCESSING':
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Processed';
      case 'PROCESSING':
        return 'Processing...';
      case 'FAILED':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">PDFs & Knowledge</h2>
        <p className="text-gray-600">Upload additional documents to enhance your AI's knowledge</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <div className="h-16 w-16 bg-indigo-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Upload className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {files && files.length > 0 ? "Upload Another File" : "Upload Your First File"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              {isDragActive
                ? "Drop the file here..."
                : "Drag and drop PDF or TXT files, or click to select (max 10MB)"
              }
            </p>
            <Button
              type="button"
              disabled={uploadMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadMutation.isPending ? "Uploading..." : "Select File"}
            </Button>
          </div>

          {uploadMutation.isPending && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files List */}
      {isLoadingFiles ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading files...</span>
            </div>
          </CardContent>
        </Card>
      ) : files && files.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{file.originalName}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatFileSize(Number(file.fileSize) || 0)}</span>
                        <span>•</span>
                        <span>{file.fileType}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(file.embeddingStatus ?? 'PENDING')}
                          <span>{getStatusText(file.embeddingStatus ?? 'PENDING')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {(file.embeddingStatus as string) === 'FAILED' && file.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reprocessMutation.mutate({ siteId: site.id, fileId: file.id! })}
                        disabled={reprocessMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => file.id && deleteMutation.mutate({ siteId: site.id, fileId: file.id })}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
              <div className="h-16 w-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Files Uploaded</h3>
              <p className="text-gray-600">Upload your first file to get started</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}