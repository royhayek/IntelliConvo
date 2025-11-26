"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Trash2, ExternalLink, Hash } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimeAgo } from "@/components/ui/time-ago";
import { TablePagination } from "@/components/ui/table-pagination";

interface EmbeddingWithDetails {
  id: string;
  chunkIndex: number;
  vectorId: string;
  contentChunk: string;
  createdAt: string;
  siteUrl: {
    id: string;
    url: string;
    title: string | null;
    site: {
      id: string;
      siteName: string;
      user: {
        id: string;
        email: string;
        fullName: string | null;
      };
    };
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EmbeddingsTableProps {
  embeddings: EmbeddingWithDetails[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onDelete: (embedding: EmbeddingWithDetails) => void;
}

function truncateText(text: string, maxLength: number = 150) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function EmbeddingsTable({ embeddings, pagination, onPageChange, onDelete }: EmbeddingsTableProps) {
  if (embeddings.length === 0) {
    return (
      <div className="border rounded-lg dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-slate-800">
              <TableHead>Source URL</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Chunk</TableHead>
              <TableHead>Content Preview</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No embeddings found
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
            <TableHead>Source URL</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Chunk</TableHead>
            <TableHead>Content Preview</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {embeddings.map((embedding) => (
            <TableRow key={embedding.id}>
              <TableCell>
                <div className="max-w-xs">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {embedding.siteUrl.title || "Untitled"}
                  </p>
                  <a
                    href={embedding.siteUrl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
                  >
                    {embedding.siteUrl.url}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/sites/${embedding.siteUrl.site.id}`}
                  className="hover:underline"
                >
                  <p className="font-medium">{embedding.siteUrl.site.siteName}</p>
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  <Hash className="h-3 w-3 mr-1" />
                  {embedding.chunkIndex}
                </Badge>
              </TableCell>
              <TableCell>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                  {truncateText(embedding.contentChunk)}
                </p>
              </TableCell>
              <TableCell>
                <TimeAgo date={embedding.createdAt} />
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
                      <Link href={`/admin/urls/${embedding.siteUrl.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View URL
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(embedding)}
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
            itemName="embeddings"
          />
        </div>
      )}
    </div>
  );
}
