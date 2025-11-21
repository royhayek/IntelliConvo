import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { ProcessingStatusIcon } from "@/components/ui/processing-status-icon";
import { FileText, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgeFileItemProps {
  fileName: string;
  fileSize: number;
  fileType: string;
  embeddingStatus: "COMPLETED" | "PROCESSING" | "FAILED" | "PENDING";
  onRetry?: () => void;
  onDelete?: () => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
  className?: string;
}

export function KnowledgeFileItem({
  fileName,
  fileSize,
  fileType,
  embeddingStatus,
  onRetry,
  onDelete,
  isRetrying = false,
  isDeleting = false,
  className,
}: KnowledgeFileItemProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg",
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">
            {fileName}
          </h4>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{formatFileSize(fileSize)}</span>
            <span>•</span>
            <span>{fileType}</span>
            <span>•</span>
            <ProcessingStatusIcon
              status={embeddingStatus}
              showLabel={true}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0">
        {embeddingStatus === "FAILED" && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        )}
        {onDelete && (
          <IconButton
            icon={Trash2}
            label={`Delete ${fileName}`}
            tooltip={`Delete ${fileName}`}
            onClick={onDelete}
            disabled={isDeleting}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
          />
        )}
      </div>
    </div>
  );
}
