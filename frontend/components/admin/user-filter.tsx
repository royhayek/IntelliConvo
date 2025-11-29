"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGetAdminUsers } from "@/lib/api/generated/queries/admin-users/admin-users";

interface UserFilterProps {
  value: string | null;
  onChange: (userId: string | null, userEmail?: string) => void;
  placeholder?: string;
  className?: string;
}

export function UserFilter({
  value,
  onChange,
  placeholder = "Filter by user...",
  className,
}: UserFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch users with search
  const { data, isLoading } = useGetAdminUsers({
    limit: "50",
    ...(search && { search }),
  });

  const users = useMemo(() => {
    return data?.data?.users || [];
  }, [data]);

  // Find selected user
  const selectedUser = useMemo(() => {
    if (!value) return null;
    return users.find((user) => user.id === value);
  }, [value, users]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[220px] justify-between", className)}
        >
          <div className="flex items-center gap-2 truncate">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            {value ? (
              <span className="truncate">
                {selectedUser?.email || "Loading..."}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {value && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search users..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No users found."}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => {
                    onChange(user.id === value ? null : user.id, user.email);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{user.email}</span>
                    {user.fullName && (
                      <span className="text-xs text-muted-foreground">
                        {user.fullName}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
