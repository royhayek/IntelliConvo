"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  Search,
  MoreHorizontal,
  Eye,
  AlertTriangle,
  User,
  MapPin,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TimeAgo } from "@/components/ui/time-ago";
import { useGetApiV1AdminBillingInfo } from "@/lib/api/generated/queries/admin-billing/admin-billing";

interface BillingInfo {
  id: string;
  fullName: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
}

interface BillingInfoResponse {
  data: {
    billingInfos: BillingInfo[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export default function AdminBillingInfoPage() {
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: response, isLoading, error } = useGetApiV1AdminBillingInfo<BillingInfoResponse>(
    {
      page: page.toString(),
      limit: "20",
      ...(searchQuery && { search: searchQuery }),
    }
  );

  const data = response?.data;

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(search);
  };

  const formatAddress = (info: BillingInfo) => {
    const parts = [info.address, info.city, info.state, info.postalCode, info.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "No address";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileCheck className="h-6 w-6" />
          Billing Info
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          View customer billing information
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to fetch billing info"}
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : data ? (
        <>
          <div className="border rounded-lg dark:border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-800">
                  <TableHead>User</TableHead>
                  <TableHead>Billing Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.billingInfos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No billing info found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.billingInfos.map((info) => (
                    <TableRow key={info.id}>
                      <TableCell>
                        <Link href={`/admin/users/${info.user.id}`} className="hover:underline">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{info.user.fullName || info.user.email}</p>
                              <p className="text-sm text-gray-500">{info.user.email}</p>
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>{info.fullName || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-xs">
                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate text-sm">{formatAddress(info)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TimeAgo date={info.updatedAt} />
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
                              <Link href={`/admin/users/${info.user.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View User
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} records
              </p>
              <Pagination
                currentPage={page}
                totalPages={data.pagination.pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
