"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  ChevronDown,
  ChevronUp,
  Check,
  Search,
  Clock,
  FileText,
  HelpCircle,
  Home,
  ShoppingBag,
  Newspaper,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  Plus,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Types for discovered URLs
export interface DiscoveredUrl {
  url: string;
  title?: string | null;
  source: "sitemap" | "discovery" | "manual";
  category: "homepage" | "product" | "blog" | "about" | "support" | "other";
  priority: "high" | "medium" | "low";
  suggested: boolean;
}

export interface DiscoveryResult {
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  urls: DiscoveredUrl[];
  sitemapFound: boolean;
  sitemapUrl?: string | null;
  totalCount: number;
  selectedCount: number;
  estimatedCrawlTime: number;
  planLimits?: {
    maxUrls: number;
    discoveryLimit: number;
    isAtLimit: boolean;
  };
}

interface UrlSelectionStepProps {
  siteUrl: string;
  discovery: DiscoveryResult | null;
  isDiscovering: boolean;
  onStartDiscovery: () => void;
  onUpdateSelections: (selections: { url: string; selected: boolean }[]) => void;
  onBulkSelect: (action: "select" | "deselect", category?: string) => void;
  onAddManualUrls: (urls: string[]) => void;
  onContinue: (selectedUrls: string[]) => void;
  onBack: () => void;
  error?: string;
}

const categoryConfig = {
  homepage: { icon: Home, label: "Homepage", color: "bg-blue-500" },
  product: { icon: ShoppingBag, label: "Products & Services", color: "bg-green-500" },
  about: { icon: FileText, label: "About & Contact", color: "bg-purple-500" },
  support: { icon: HelpCircle, label: "Help & Support", color: "bg-yellow-500" },
  blog: { icon: Newspaper, label: "Blog & News", color: "bg-orange-500" },
  other: { icon: MoreHorizontal, label: "Other Pages", color: "bg-gray-500" },
};

const priorityConfig = {
  high: { label: "High Priority", color: "text-green-600 bg-green-50" },
  medium: { label: "Medium", color: "text-yellow-600 bg-yellow-50" },
  low: { label: "Low", color: "text-gray-600 bg-gray-50" },
};

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

export function UrlSelectionStep({
  siteUrl,
  discovery,
  isDiscovering,
  onStartDiscovery,
  onUpdateSelections,
  onBulkSelect,
  onAddManualUrls,
  onContinue,
  onBack,
  error,
}: UrlSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["homepage", "product", "about", "support"])
  );
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUrls, setManualUrls] = useState("");
  const [localSelections, setLocalSelections] = useState<Map<string, boolean>>(new Map());
  const [visibleCountPerCategory, setVisibleCountPerCategory] = useState<Map<string, number>>(new Map());

  const URLS_PER_PAGE = 20;

  // Initialize local selections from discovery data
  useEffect(() => {
    if (discovery?.urls) {
      const selections = new Map<string, boolean>();
      discovery.urls.forEach((url) => {
        selections.set(url.url, url.suggested);
      });
      setLocalSelections(selections);
    }
  }, [discovery?.urls]);

  // Group URLs by category
  const groupedUrls = useMemo(() => {
    if (!discovery?.urls) return {};

    const filtered = discovery.urls.filter(
      (url) =>
        searchQuery === "" ||
        url.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        url.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: Record<string, DiscoveredUrl[]> = {};
    filtered.forEach((url) => {
      if (!groups[url.category]) {
        groups[url.category] = [];
      }
      groups[url.category].push(url);
    });

    return groups;
  }, [discovery?.urls, searchQuery]);

  // Calculate selection stats
  const selectionStats = useMemo(() => {
    const selectedCount = Array.from(localSelections.values()).filter(Boolean).length;
    const estimatedTime = Math.ceil(selectedCount / 5) * 10;
    return { selectedCount, estimatedTime };
  }, [localSelections]);

  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; selected: number }> = {};
    Object.entries(groupedUrls).forEach(([category, urls]) => {
      const selected = urls.filter((url) => localSelections.get(url.url)).length;
      stats[category] = { total: urls.length, selected };
    });
    return stats;
  }, [groupedUrls, localSelections]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleUrlToggle = useCallback(
    (url: string, selected: boolean) => {
      setLocalSelections((prev) => {
        const next = new Map(prev);
        next.set(url, selected);
        return next;
      });
      onUpdateSelections([{ url, selected }]);
    },
    [onUpdateSelections]
  );

  const handleCategoryToggle = useCallback(
    (category: string, select: boolean) => {
      const urls = groupedUrls[category] || [];
      const updates = urls.map((url) => ({ url: url.url, selected: select }));

      setLocalSelections((prev) => {
        const next = new Map(prev);
        urls.forEach((url) => {
          next.set(url.url, select);
        });
        return next;
      });

      onBulkSelect(select ? "select" : "deselect", category);
    },
    [groupedUrls, onBulkSelect]
  );

  const handleAddManualUrls = useCallback(() => {
    const urls = manualUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length > 0) {
      onAddManualUrls(urls);
      setManualUrls("");
      setShowManualInput(false);
    }
  }, [manualUrls, onAddManualUrls]);

  const getVisibleCount = useCallback((category: string) => {
    return visibleCountPerCategory.get(category) || URLS_PER_PAGE;
  }, [visibleCountPerCategory]);

  const handleShowMore = useCallback((category: string, totalUrls: number) => {
    setVisibleCountPerCategory((prev) => {
      const next = new Map(prev);
      const currentVisible = prev.get(category) || URLS_PER_PAGE;
      // Show 20 more, or all remaining if less than 20 left
      const newVisible = Math.min(currentVisible + URLS_PER_PAGE, totalUrls);
      next.set(category, newVisible);
      return next;
    });
  }, []);

  // Discovery in progress
  if (isDiscovering) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium mb-2">Discovering Pages</h3>
              <p className="text-sm text-muted-foreground text-center">
                Finding all pages on <span className="font-medium">{siteUrl}</span>
                <br />
                This usually takes less than 30 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Discovery not started or failed
  if (!discovery || discovery.status === "PENDING" || discovery.status === "FAILED") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Globe className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {discovery?.status === "FAILED" ? "Discovery Failed" : "Ready to Discover Pages"}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {discovery?.status === "FAILED"
                  ? "We encountered an issue discovering pages on your website. Would you like to try again?"
                  : `We'll find all pages on ${siteUrl} and let you choose which ones to include.`}
              </p>
              {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button onClick={onStartDiscovery}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {discovery?.status === "FAILED" ? "Try Again" : "Discover Pages"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Discovery completed - show URL selection
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Summary Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  Found {discovery.totalCount} pages
                  {discovery.sitemapFound && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Sitemap
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectionStats.selectedCount} selected
                  {discovery.planLimits && (
                    <span className="text-xs ml-1">
                      (max {discovery.planLimits.maxUrls})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                ~{formatTime(selectionStats.estimatedTime)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Limit Warning */}
      {discovery.planLimits && selectionStats.selectedCount > discovery.planLimits.maxUrls && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span className="text-amber-700 dark:text-amber-300">
            You've selected {selectionStats.selectedCount} pages but your plan allows {discovery.planLimits.maxUrls}.
            Only the first {discovery.planLimits.maxUrls} will be crawled.
          </span>
        </div>
      )}

      {/* Search & Actions */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowManualInput(!showManualInput)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add URLs
        </Button>
      </div>

      {/* Manual URL Input */}
      {showManualInput && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Add URLs manually</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualInput(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                placeholder={`https://${siteUrl}/page1\nhttps://${siteUrl}/page2`}
                value={manualUrls}
                onChange={(e) => setManualUrls(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddManualUrls}>
                  Add URLs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* URL Categories */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {Object.entries(categoryConfig).map(([category, config]) => {
          const urls = groupedUrls[category] || [];
          if (urls.length === 0) return null;

          const stats = categoryStats[category] || { total: 0, selected: 0 };
          const isExpanded = expandedCategories.has(category);
          const allSelected = stats.selected === stats.total;
          const someSelected = stats.selected > 0 && stats.selected < stats.total;

          return (
            <Card key={category}>
              <CardContent className="p-0">
                {/* Category Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                        }
                      }}
                      onCheckedChange={(checked) => {
                        handleCategoryToggle(category, !!checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className={cn("h-8 w-8 rounded flex items-center justify-center", config.color)}>
                      <config.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.selected}/{stats.total} selected
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* URL List */}
                {isExpanded && (
                  <div className="border-t">
                    {urls.slice(0, getVisibleCount(category)).map((url) => (
                      <div
                        key={url.url}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 border-b last:border-b-0"
                      >
                        <Checkbox
                          checked={localSelections.get(url.url) || false}
                          onCheckedChange={(checked) =>
                            handleUrlToggle(url.url, !!checked)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">
                            {url.title || new URL(url.url).pathname || "/"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {url.url}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", priorityConfig[url.priority].color)}
                        >
                          {url.priority}
                        </Badge>
                      </div>
                    ))}
                    {urls.length > getVisibleCount(category) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowMore(category, urls.length);
                        }}
                        className="w-full px-3 py-2.5 text-center text-sm text-primary hover:bg-primary/5 hover:text-primary/80 transition-colors cursor-pointer font-medium flex items-center justify-center gap-2"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Show {Math.min(URLS_PER_PAGE, urls.length - getVisibleCount(category))} more pages
                        <span className="text-muted-foreground font-normal">
                          ({urls.length - getVisibleCount(category)} remaining)
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={() => {
            // Get selected URLs from local state to pass to crawl endpoint
            const selectedUrls = Array.from(localSelections.entries())
              .filter(([, selected]) => selected)
              .map(([url]) => url);
            onContinue(selectedUrls);
          }}
          disabled={selectionStats.selectedCount === 0}
        >
          <Check className="h-4 w-4 mr-2" />
          Continue with {selectionStats.selectedCount} pages
        </Button>
      </div>
    </motion.div>
  );
}
