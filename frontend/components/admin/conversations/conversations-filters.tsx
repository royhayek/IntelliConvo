"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteFilter } from "@/components/admin/site-filter";

interface ConversationsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  siteId: string | null;
  onSiteChange: (id: string | null) => void;
}

export function ConversationsFilters({
  search,
  onSearchChange,
  onSearch,
  siteId,
  onSiteChange,
}: ConversationsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by session ID or user..."
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
      </div>
    </div>
  );
}
