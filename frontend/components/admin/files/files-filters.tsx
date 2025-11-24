"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteFilter } from "@/components/admin/site-filter";

interface FilesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  siteId: string | null;
  onSiteChange: (id: string | null) => void;
  status: string;
  onStatusChange: (value: string) => void;
}

export function FilesFilters({
  search,
  onSearchChange,
  onSearch,
  siteId,
  onSiteChange,
  status,
  onStatusChange,
}: FilesFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by file name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={onSearch}>Search</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <SiteFilter
          value={siteId}
          onChange={onSiteChange}
          placeholder="All Sites"
        />
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
