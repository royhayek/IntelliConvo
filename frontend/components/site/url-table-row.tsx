import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { UrlStatusBadge } from "@/components/ui/url-status-badge";
import { Eye, ExternalLink, RefreshCw, Check, X, Trash2 } from "lucide-react";
import { type SiteUrl } from "@/lib/api/generated/models";
import { type UrlEmbeddingStatus } from "@/lib/utils/status-labels";

interface UrlTableRowProps {
  url: SiteUrl;
  onPreview?: (urlId: string) => void;
  onRecrawl?: (urlId: string) => void;
  onToggleStatus?: (url: SiteUrl, field: "isExcluded" | "isActive") => void;
  onDelete?: (url: SiteUrl) => void;
  isRecrawling?: boolean;
}

export function UrlTableRow({
  url,
  onPreview,
  onRecrawl,
  onToggleStatus,
  onDelete,
  isRecrawling = false,
}: UrlTableRowProps) {
  const getDisplayTitle = () => {
    return (
      url.title ||
      (url.url ? url.url.split("/").pop() : "") ||
      url.url ||
      "Unknown URL"
    );
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Not crawled";
    return new Date(date).toLocaleDateString();
  };

  return (
    <TableRow className="group">
      <TableCell>
        <UrlStatusBadge
          embeddingStatus={url.embeddingStatus}
          isActive={url.isActive}
          isExcluded={url.isExcluded}
        />
      </TableCell>
      <TableCell>
        <div className="min-w-0 max-w-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
            {getDisplayTitle()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
            {url.url || ""}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
        {formatDate(url.lastCrawledAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-1 sm:space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {onPreview && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => url.id && onPreview(url.id)}
              title="Preview & Edit content"
              className="h-8 w-8 p-0 sm:h-9 sm:w-9"
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => url.url && window.open(url.url, "_blank")}
            title="Open URL"
            className="h-8 w-8 p-0 sm:h-9 sm:w-9 hidden sm:flex"
          >
            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          {onRecrawl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => url.id && onRecrawl(url.id)}
              title="Recrawl this URL"
              disabled={isRecrawling}
              className="h-8 w-8 p-0 sm:h-9 sm:w-9 hidden sm:flex"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
          {onToggleStatus && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleStatus(url, "isExcluded")}
              title={
                url.isExcluded
                  ? "Include in knowledge base"
                  : "Exclude from knowledge base"
              }
              className="h-8 w-8 p-0 sm:h-9 sm:w-9 hidden sm:flex"
            >
              {url.isExcluded ? (
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(url)}
              title="Delete URL permanently"
              className="h-8 w-8 p-0 sm:h-9 sm:w-9 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
