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

interface SubscriptionsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  userId: string | null;
  onUserChange: (id: string | null) => void;
  status: string;
  onStatusChange: (value: string) => void;
  planType: string;
  onPlanTypeChange: (value: string) => void;
}

export function SubscriptionsFilters({
  search,
  onSearchChange,
  onSearch,
  userId,
  onUserChange,
  status,
  onStatusChange,
  planType,
  onPlanTypeChange,
}: SubscriptionsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by user email or site name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={onSearch}>Search</Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <UserFilter value={userId} onChange={onUserChange} placeholder="All Users" />
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="TRIAL">Trial</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planType} onValueChange={onPlanTypeChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="PREMIUM_MONTHLY">Monthly</SelectItem>
            <SelectItem value="PREMIUM_ANNUAL">Annual</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
