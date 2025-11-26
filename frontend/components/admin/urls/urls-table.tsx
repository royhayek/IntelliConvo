"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  ExternalLink,
  Brain,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimeAgo } from "@/components/ui/time-ago";
import { TablePagination } from "@/components/ui/table-pagination";
import { getEmbeddingStatusBadgeConfig } from "@/lib/utils/badge-helpers";
import type { SiteUrlExtended } from "@/lib/types/admin-urls";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UrlsTableProps {
  urls: SiteUrlExtended[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onDelete: (url: SiteUrlExtended) => void;
  onToggleActive: (urlId: string, currentStatus: boolean) => void;
}

export function UrlsTable({ urls, pagination, onPageChange, onDelete, onToggleActive }: UrlsTableProps) {
  const getEmbeddingStatusBadge = (status: string) => {
    const config = getEmbeddingStatusBadgeConfig(status);
    return (
      <Badge variant={config.variant} className={config.className}>
        {status === "READY" && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === "FAILED" && <XCircle className="h-3 w-3 mr-1" />}
        {config.label}
      </Badge>
    );
  };

  if (urls.length === 0) {
    return (
      <div className="border rounded-lg dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-slate-800">
              <TableHead>URL</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Embeddings</TableHead>
              <TableHead>Last Crawled</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No URLs found
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-slate-800">
            <TableHead>URL</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Embeddings</TableHead>
            <TableHead>Last Crawled</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {urls.map((url) => (
            <TableRow key={url.id}>
              <TableCell>
                <div className="max-w-md">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {url.title || "Untitled"}
                  </p>
                  <a
                    href={url.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
                  >
                    {url.url}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/sites/${url.site.id}`}
                  className="hover:underline"
                >
                  <p className="font-medium">{url.site.siteName}</p>
                  <p className="text-sm text-gray-500">{url.site.user.email}</p>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getEmbeddingStatusBadge(url.embeddingStatus)}
                  {url.isExcluded && (
                    <Badge variant="destructive">Excluded</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={url.embeddingsCount > 0 ? "default" : "outline"}
                  className={url.embeddingsCount > 0 ? "bg-purple-100 text-purple-700" : ""}
                >
                  <Brain className="h-3 w-3 mr-1" />
                  {url.embeddingsCount}
                </Badge>
              </TableCell>
              <TableCell>
                {url.lastCrawledAt ? (
                  <TimeAgo date={url.lastCrawledAt} />
                ) : (
                  <span className="text-gray-400">Never</span>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/urls/${url.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleActive(url.id, url.isActive)}>
                      {url.isActive ? (
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
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(url)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination && onPageChange && (
        <div className="px-6 pb-4">
          <TablePagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.pages}
            onPageChange={onPageChange}
            itemName="URLs"
          />
        </div>
      )}
    </div>
  );
}
