"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Globe, X } from "lucide-react";
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
import { useGetApiV1AdminSites } from "@/lib/api/generated/queries/admin-sites/admin-sites";

interface SiteFilterProps {
  value: string | null;
  onChange: (siteId: string | null, siteName?: string) => void;
  placeholder?: string;
  className?: string;
}

export function SiteFilter({
  value,
  onChange,
  placeholder = "Filter by site...",
  className,
}: SiteFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch sites with search
  const { data, isLoading } = useGetApiV1AdminSites({
    limit: "50",
    ...(search && { search }),
  });

  const sites = useMemo(() => {
    return data?.data?.sites || [];
  }, [data]);

  // Find selected site name
  const selectedSite = useMemo(() => {
    if (!value) return null;
    return sites.find((site) => site.id === value);
  }, [value, sites]);

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
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            {value ? (
              <span className="truncate">
                {selectedSite?.siteName || "Loading..."}
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
            placeholder="Search sites..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No sites found."}
            </CommandEmpty>
            <CommandGroup>
              {sites.map((site) => (
                <CommandItem
                  key={site.id}
                  value={site.id}
                  onSelect={() => {
                    onChange(site.id === value ? null : site.id, site.siteName);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === site.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{site.siteName}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                      {site.siteUrl}
                    </span>
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
