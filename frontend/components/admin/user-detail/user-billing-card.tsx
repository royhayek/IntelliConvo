"use client";

import { Receipt } from "lucide-react";
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

interface BillingInfo {
  fullName?: string | null;
  email?: string | null;
  companyName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  vatNumber?: string | null;
}

interface BillingHistoryItem {
  id: string;
  invoiceId?: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface UserBillingCardProps {
  billingInfo?: BillingInfo | null;
  billingHistory: BillingHistoryItem[];
}

export function UserBillingCard({ billingInfo, billingHistory }: UserBillingCardProps) {
  return (
    <>
      {billingInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1">{billingInfo.fullName || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1">{billingInfo.email || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="mt-1">{billingInfo.companyName || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="mt-1">
                  {[
                    billingInfo.addressLine1,
                    billingInfo.addressLine2,
                    billingInfo.city,
                    billingInfo.state,
                    billingInfo.postalCode,
                    billingInfo.country,
                  ].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">VAT Number</label>
                <p className="mt-1">{billingInfo.vatNumber || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {billingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Billing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      {item.invoiceId || "—"}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: item.currency,
                      }).format(item.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "PAID" ? "default" : "outline"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TimeAgo date={item.createdAt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
