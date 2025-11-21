import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { UrlStatusBadge } from "@/components/ui/url-status-badge";
import { Eye, ExternalLink, RefreshCw, Check, X, Trash2 } from "lucide-react";
import { type GetApiV1SitesSiteIdUrls200Item } from "@/lib/api/generated/models";

interface UrlTableRowProps {
  url: GetApiV1SitesSiteIdUrls200Item;
  onPreview?: (urlId: string) => void;
  onRecrawl?: (urlId: string) => void;
  onToggleStatus?: (url: GetApiV1SitesSiteIdUrls200Item, field: "isExcluded" | "isActive") => void;
  onDelete?: (url: GetApiV1SitesSiteIdUrls200Item) => void;
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
          status={url.isExcluded ? "excluded" : url.isActive ? "active" : "inactive"}
        />
      </TableCell>
      <TableCell>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {getDisplayTitle()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {url.url || ""}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
        {formatDate(url.lastCrawledAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onPreview && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => url.id && onPreview(url.id)}
              title="Preview & Edit content"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => url.url && window.open(url.url, "_blank")}
            title="Open URL"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          {onRecrawl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => url.id && onRecrawl(url.id)}
              title="Recrawl this URL"
              disabled={isRecrawling}
            >
              <RefreshCw className="h-4 w-4" />
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
            >
              {url.isExcluded ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(url)}
              title="Delete URL permanently"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
