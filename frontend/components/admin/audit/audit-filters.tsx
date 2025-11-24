"use client";

import { Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditFiltersProps {
  actionFilter: string;
  onActionFilterChange: (value: string) => void;
  entityTypeFilter: string;
  onEntityTypeFilterChange: (value: string) => void;
  successFilter: string;
  onSuccessFilterChange: (value: string) => void;
}

export function AuditFilters({
  actionFilter,
  onActionFilterChange,
  entityTypeFilter,
  onEntityTypeFilterChange,
  successFilter,
  onSuccessFilterChange,
}: AuditFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">Action</label>
            <Select value={actionFilter} onValueChange={onActionFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="FORCE_LOGOUT">Force Logout</SelectItem>
                <SelectItem value="EXTEND_TRIAL">Extend Trial</SelectItem>
                <SelectItem value="RECRAWL">Recrawl</SelectItem>
                <SelectItem value="REPROCESS">Reprocess</SelectItem>
                <SelectItem value="CLEANUP">Cleanup</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">Entity Type</label>
            <Select value={entityTypeFilter} onValueChange={onEntityTypeFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="SITE">Site</SelectItem>
                <SelectItem value="URL">URL</SelectItem>
                <SelectItem value="EMBEDDING">Embedding</SelectItem>
                <SelectItem value="FILE">File</SelectItem>
                <SelectItem value="CONVERSATION">Conversation</SelectItem>
                <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                <SelectItem value="SESSION">Session</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">Status</label>
            <Select value={successFilter} onValueChange={onSuccessFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="true">Success</SelectItem>
                <SelectItem value="false">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
