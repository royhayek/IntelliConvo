"use client";

import Link from "next/link";
import {
  MessageSquare,
  MoreHorizontal,
  Eye,
  Trash2,
  Clock,
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
import type { AdminConversation } from "@/lib/api/generated/models";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ConversationsTableProps {
  conversations: AdminConversation[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onDelete: (conversation: AdminConversation) => void;
}

export function ConversationsTable({ conversations, pagination, onPageChange, onDelete }: ConversationsTableProps) {
  if (conversations.length === 0) {
    return (
      <div className="border rounded-lg dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-slate-800">
              <TableHead>Session</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No conversations found
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
            <TableHead>Session</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Messages</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((conv) => (
            <TableRow key={conv.id}>
              <TableCell>
                <Link
                  href={`/admin/conversations/${conv.id}`}
                  className="hover:underline"
                >
                  <div>
                    <p className="font-mono text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                      {conv.sessionId}
                    </p>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                {conv.site && (
                  <Link
                    href={`/admin/sites/${conv.site.id}`}
                    className="hover:underline"
                  >
                    <p className="font-medium">{conv.site.siteName}</p>
                  </Link>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {conv.messageCount}
                </Badge>
              </TableCell>
              <TableCell>
                <TimeAgo date={conv.startedAt} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-3 w-3" />
                  <TimeAgo date={conv.lastMessageAt} />
                </div>
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
                      <Link href={`/admin/conversations/${conv.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(conv)}
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
            itemName="conversations"
          />
        </div>
      )}
    </div>
  );
}
