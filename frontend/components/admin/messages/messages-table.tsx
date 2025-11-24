"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Trash2, User, Bot, Coins } from "lucide-react";
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
import { formatCents } from "@/lib/utils";

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  tokensUsed: number | null;
  costInCents: number | null;
  conversation: {
    id: string;
    sessionId: string;
    userIdentifier: string | null;
    site: {
      id: string;
      siteName: string;
      user: {
        id: string;
        email: string;
      };
    };
  };
}

interface MessagesTableProps {
  messages: Message[];
  onDelete: (message: Message) => void;
}

function truncateContent(content: string, maxLength: number = 100) {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
}

function getRoleBadge(role: string) {
  if (role === "user" || role === "USER") {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700">
        <User className="h-3 w-3 mr-1" />
        User
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-purple-50 text-purple-700">
      <Bot className="h-3 w-3 mr-1" />
      Assistant
    </Badge>
  );
}

export function MessagesTable({ messages, onDelete }: MessagesTableProps) {
  if (messages.length === 0) {
    return (
      <div className="border rounded-lg dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-slate-800">
              <TableHead>Role</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No messages found
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
            <TableHead>Role</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((message) => (
            <TableRow key={message.id}>
              <TableCell>{getRoleBadge(message.role)}</TableCell>
              <TableCell>
                <p className="text-sm text-gray-700 dark:text-gray-300 max-w-md">
                  {truncateContent(message.content)}
                </p>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/sites/${message.conversation.site.id}`}
                  className="hover:underline"
                >
                  <p className="font-medium">{message.conversation.site.siteName}</p>
                </Link>
                <Link
                  href={`/admin/conversations/${message.conversation.id}`}
                  className="text-sm text-gray-500 hover:underline"
                >
                  View conversation
                </Link>
              </TableCell>
              <TableCell>
                {message.tokensUsed ? (
                  <div className="text-sm">
                    <Badge variant="outline">
                      <Coins className="h-3 w-3 mr-1" />
                      {message.tokensUsed.toLocaleString()}
                    </Badge>
                    {message.costInCents && (
                      <p className="text-gray-500 mt-1">
                        {formatCents(message.costInCents)}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <TimeAgo date={message.timestamp} />
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
                      <Link href={`/admin/conversations/${message.conversation.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Conversation
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(message)}
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
    </div>
  );
}
