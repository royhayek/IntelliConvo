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

interface UrlsFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  siteId: string | null;
  onSiteChange: (id: string | null) => void;
  isActive: string;
  onIsActiveChange: (value: string) => void;
  hasEmbeddings: string;
  onHasEmbeddingsChange: (value: string) => void;
}

export function UrlsFilters({
  searchInput,
  onSearchInputChange,
  onSearch,
  siteId,
  onSiteChange,
  isActive,
  onIsActiveChange,
  hasEmbeddings,
  onHasEmbeddingsChange,
}: UrlsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by URL or title..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
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

        <Select value={isActive} onValueChange={onIsActiveChange}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Embedding Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="SCRAPED">Discovered</SelectItem>
            <SelectItem value="PENDING">Queued</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="EXCLUDED">Excluded</SelectItem>
          </SelectContent>
        </Select>

        <Select value={hasEmbeddings} onValueChange={onHasEmbeddingsChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Embeddings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All URLs</SelectItem>
            <SelectItem value="true">With Embeddings</SelectItem>
            <SelectItem value="false">Without Embeddings</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
