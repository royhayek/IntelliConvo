"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
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
import { getSubscriptionStatusBadgeConfig } from "@/lib/utils/badge-helpers";

interface Subscription {
  id: string;
  planType: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  site?: {
    id: string;
    siteName: string;
  } | null;
}

interface UserSubscriptionsTableProps {
  subscriptions: Subscription[];
}

export function UserSubscriptionsTable({ subscriptions }: UserSubscriptionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscriptions ({subscriptions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No subscriptions</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Trial Ends</TableHead>
                <TableHead>Period End</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => {
                const statusConfig = getSubscriptionStatusBadgeConfig(sub.status);
                return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Badge variant="secondary">{sub.planType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} className={statusConfig.className}>
                        {statusConfig.label || sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.site ? (
                        <Link
                          href={`/admin/sites/${sub.site.id}`}
                          className="hover:underline"
                        >
                          {sub.site.siteName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.trialEndsAt
                        ? new Date(sub.trialEndsAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : "—"}
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
