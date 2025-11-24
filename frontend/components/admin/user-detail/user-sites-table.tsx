"use client";

import Link from "next/link";
import { Globe, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimeAgo } from "@/components/ui/time-ago";
import { getCrawlStatusBadgeConfig } from "@/lib/utils/badge-helpers";

interface Site {
  id: string;
  siteName: string;
  siteUrl: string;
  crawlStatus: string;
  createdAt: string;
  _count: {
    urls: number;
    conversations: number;
  };
}

interface UserSitesTableProps {
  sites: Site[];
}

export function UserSitesTable({ sites }: UserSitesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Sites ({sites.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sites.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No sites created</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URLs</TableHead>
                <TableHead>Conversations</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => {
                const statusConfig = getCrawlStatusBadgeConfig(site.crawlStatus);
                return (
                  <TableRow key={site.id}>
                    <TableCell>
                      <Link
                        href={`/admin/sites/${site.id}`}
                        className="font-medium hover:underline"
                      >
                        {site.siteName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <a
                        href={site.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {site.siteUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} className={statusConfig.className}>
                        {statusConfig.label || site.crawlStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{site._count.urls}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{site._count.conversations}</Badge>
                    </TableCell>
                    <TableCell>
                      <TimeAgo date={site.createdAt} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/sites/${site.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
