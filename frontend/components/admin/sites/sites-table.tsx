"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ExternalLink,
  Database,
} from "lucide-react";
import { SiteAvatar } from "@/components/site/site-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimeAgo } from "@/components/ui/time-ago";
import {
  getCrawlStatusBadgeConfig,
  getSubscriptionBadgeConfig,
} from "@/lib/utils/badge-helpers";
import type { AdminSite } from "@/lib/api/generated/models";

interface SitesTableProps {
  sites: AdminSite[];
  onRecrawl: (siteId: string) => void;
  onClearCache: (siteId: string) => void;
  onDelete: (site: AdminSite) => void;
  isRecrawling?: boolean;
  isClearingCache?: boolean;
}

export function SitesTable({
  sites,
  onRecrawl,
  onClearCache,
  onDelete,
  isRecrawling,
  isClearingCache,
}: SitesTableProps) {
  const renderCrawlStatusBadge = (status: string) => {
    const config = getCrawlStatusBadgeConfig(status);
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const renderSubscriptionBadge = (
    subscription: { id: string; status: string; planType: string } | null | undefined
  ) => {
    const config = getSubscriptionBadgeConfig(subscription);
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.displayText}
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg dark:border-slate-700">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-slate-800">
            <TableHead>Site</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Crawl Status</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>URLs</TableHead>
            <TableHead>Conversations</TableHead>
            <TableHead>Last Crawled</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No sites found
              </TableCell>
            </TableRow>
          ) : (
            sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell>
                  <Link href={`/admin/sites/${site.id}`} className="hover:underline">
                    <div className="flex items-center gap-3">
                      <SiteAvatar
                        siteName={site.siteName}
                        imageUrl={site.faviconUrl ?? undefined}
                        size="sm"
                        animated={false}
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {site.siteName}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          {site.siteUrl}
                          <a
                            href={site.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/users/${site.user?.id}`} className="hover:underline">
                    <p className="font-medium">{site.user?.fullName || "—"}</p>
                    <p className="text-sm text-gray-500">{site.user?.email}</p>
                  </Link>
                </TableCell>
                <TableCell>{renderCrawlStatusBadge(site.crawlStatus)}</TableCell>
                <TableCell>
                  {renderSubscriptionBadge(
                    (site as AdminSite & { subscription?: { id: string; status: string; planType: string } | null }).subscription
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{site.urlsCount ?? 0}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{site.conversationsCount ?? 0}</Badge>
                </TableCell>
                <TableCell>
                  {site.lastCrawledAt ? (
                    <TimeAgo date={site.lastCrawledAt} />
                  ) : (
                    <span className="text-gray-400">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/sites/${site.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/sites/${site.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onRecrawl(site.id)}
                        disabled={isRecrawling}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Trigger Recrawl
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onClearCache(site.id)}
                        disabled={isClearingCache}
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Clear Cache
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(site)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
