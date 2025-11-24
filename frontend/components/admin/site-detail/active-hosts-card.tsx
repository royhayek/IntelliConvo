"use client";

import { Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimeAgo } from "@/components/ui/time-ago";

interface ActiveHost {
  id: string;
  hostName: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ActiveHostsCardProps {
  hosts: ActiveHost[];
}

export function ActiveHostsCard({ hosts }: ActiveHostsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Active Hosts ({hosts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hosts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No active hosts</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Host</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hosts.map((host) => (
                <TableRow key={host.id}>
                  <TableCell className="font-mono">{host.hostName}</TableCell>
                  <TableCell>
                    <Badge variant={host.isEnabled ? "default" : "outline"}>
                      {host.isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TimeAgo date={host.createdAt} />
                  </TableCell>
                  <TableCell>
                    <TimeAgo date={host.updatedAt} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
