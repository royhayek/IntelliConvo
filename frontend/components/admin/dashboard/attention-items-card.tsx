"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AttentionItem } from "@/lib/types/admin-dashboard";

interface AttentionItemsCardProps {
  items: AttentionItem[];
}

export function AttentionItemsCard({ items }: AttentionItemsCardProps) {
  if (items.length === 0) return null;

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          Needs Attention
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Link key={index} href={item.link}>
              <Badge
                variant={item.severity === "error" ? "destructive" : "outline"}
                className="text-sm cursor-pointer hover:opacity-80"
              >
                {item.label}: {item.value}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
