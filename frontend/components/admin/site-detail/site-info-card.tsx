"use client";

import { Globe, Calendar, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimeAgo } from "@/components/ui/time-ago";
import { getCrawlStatusBadgeConfig } from "@/lib/utils/badge-helpers";
import type { AdminSiteDetail } from "@/lib/api/generated/models";

interface SiteInfoCardProps {
  site: AdminSiteDetail;
}

export function SiteInfoCard({ site }: SiteInfoCardProps) {
  const crawlStatusConfig = getCrawlStatusBadgeConfig(site.crawlStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Site Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Site Name</label>
            <p className="mt-1 text-lg font-medium">{site.siteName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">URL</label>
            <p className="mt-1">
              <a
                href={site.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                {site.siteUrl}
                <ExternalLink className="h-4 w-4" />
              </a>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Crawl Status</label>
            <p className="mt-1">
              <Badge variant={crawlStatusConfig.variant} className={crawlStatusConfig.className}>
                {crawlStatusConfig.label || site.crawlStatus}
              </Badge>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Industry</label>
            <p className="mt-1">{site.siteIndustry || "—"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Created
            </label>
            <p className="mt-1">
              {new Date(site.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Clock className="h-4 w-4" /> Last Crawled
            </label>
            <p className="mt-1">
              {site.lastCrawledAt ? (
                <TimeAgo date={site.lastCrawledAt} />
              ) : (
                <span className="text-gray-400">Never</span>
              )}
            </p>
          </div>
          {site.siteDescription && (
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{site.siteDescription}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
