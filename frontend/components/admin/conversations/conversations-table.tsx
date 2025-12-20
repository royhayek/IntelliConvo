"use client";

import Link from "next/link";
import {
  MessageSquare,
  MoreHorizontal,
  Eye,
  Trash2,
  Clock,
  UserCog,
  Coins,
  DollarSign,
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
import { cn, formatCents } from "@/lib/utils";

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
              <TableHead>Status</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-gray-500">
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
            <TableHead>Status</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Messages</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Cost</TableHead>
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
                {conv.status ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium text-xs",
                      conv.status === "ACTIVE" && "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300",
                      conv.status === "NEEDS_AGENT" && "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300",
                      conv.status === "AGENT_ACTIVE" && "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300",
                      conv.status === "RESOLVED" && "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300"
                    )}
                  >
                    {conv.status === "ACTIVE" ? "Active" :
                     conv.status === "NEEDS_AGENT" ? "Needs Agent" :
                     conv.status === "AGENT_ACTIVE" ? "Agent Active" : "Resolved"}
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                {conv.assignedAgent ? (
                  <Link
                    href={`/admin/users/${conv.assignedAgent.id}`}
                    className="hover:underline flex items-center gap-1 text-sm"
                  >
                    <UserCog className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">
                      {conv.assignedAgent.fullName || conv.assignedAgent.email}
                    </span>
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {conv.messageCount}
                </Badge>
              </TableCell>
              <TableCell>
                {conv.totalTokens ? (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Coins className="h-3 w-3" />
                    {conv.totalTokens.toLocaleString()}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                {conv.totalCostCents ? (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="h-3 w-3" />
                    {formatCents(conv.totalCostCents)}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
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
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
            itemName="conversations"
          />
        </div>
      )}
    </div>
  );
}
