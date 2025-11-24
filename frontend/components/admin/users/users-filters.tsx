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

interface UsersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  authProvider: string;
  onAuthProviderChange: (value: string) => void;
  isAdmin: string;
  onIsAdminChange: (value: string) => void;
}

export function UsersFilters({
  search,
  onSearchChange,
  onSearch,
  authProvider,
  onAuthProviderChange,
  isAdmin,
  onIsAdminChange,
}: UsersFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={onSearch}>Search</Button>
      </div>

      <div className="flex gap-2">
        <Select value={authProvider} onValueChange={onAuthProviderChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Auth Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="EMAIL">Email</SelectItem>
            <SelectItem value="GOOGLE">Google</SelectItem>
            <SelectItem value="APPLE">Apple</SelectItem>
          </SelectContent>
        </Select>

        <Select value={isAdmin} onValueChange={onIsAdminChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="User Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="true">Admins</SelectItem>
            <SelectItem value="false">Regular Users</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
