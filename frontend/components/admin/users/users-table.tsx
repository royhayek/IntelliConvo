"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Edit, Trash2, LogOut, Shield } from "lucide-react";
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
import {
  getAuthProviderBadgeConfig,
  getUserRoleBadgeConfig,
} from "@/lib/utils/badge-helpers";
import type { AdminUser } from "@/lib/api/generated/models";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsersTableProps {
  users: AdminUser[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onForceLogout: (userId: string) => void;
  onDelete: (user: AdminUser) => void;
}

export function UsersTable({ users, pagination, onPageChange, onForceLogout, onDelete }: UsersTableProps) {
  const renderAuthProviderBadge = (provider: string) => {
    const config = getAuthProviderBadgeConfig(provider);
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const renderRoleBadge = (isAdmin: boolean) => {
    const config = getUserRoleBadgeConfig(isAdmin);
    if (isAdmin) {
      return (
        <Badge variant={config.variant} className={config.className}>
          <Shield className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      );
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="border rounded-lg dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-slate-800">
            <TableHead>User</TableHead>
            <TableHead>Auth Provider</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Sites</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link href={`/admin/users/${user.id}`} className="hover:underline">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.fullName || "-"}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>{renderAuthProviderBadge(user.authProvider)}</TableCell>
                <TableCell>{renderRoleBadge(user.isAdmin)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.sitesCount ?? 0}</Badge>
                </TableCell>
                <TableCell>
                  {user.lastLoginAt ? (
                    <TimeAgo date={user.lastLoginAt} />
                  ) : (
                    <span className="text-gray-400">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <TimeAgo date={user.createdAt} />
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
                        <Link href={`/admin/users/${user.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onForceLogout(user.id)}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Force Logout
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(user)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
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
            itemName="users"
          />
        </div>
      )}
    </div>
  );
}
