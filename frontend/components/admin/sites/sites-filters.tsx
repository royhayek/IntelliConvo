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
import { UserFilter } from "@/components/admin/user-filter";

interface SitesFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  userId: string | null;
  onUserIdChange: (id: string | null) => void;
  crawlStatus: string;
  onCrawlStatusChange: (status: string) => void;
}

export function SitesFilters({
  searchInput,
  onSearchInputChange,
  onSearch,
  userId,
  onUserIdChange,
  crawlStatus,
  onCrawlStatusChange,
}: SitesFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by site name or URL..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={onSearch}>Search</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <UserFilter
          value={userId}
          onChange={onUserIdChange}
          placeholder="All Users"
        />

        <Select value={crawlStatus} onValueChange={onCrawlStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Crawl Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CRAWLING">Crawling</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="AWAITING_PAYMENT">Awaiting Payment</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
