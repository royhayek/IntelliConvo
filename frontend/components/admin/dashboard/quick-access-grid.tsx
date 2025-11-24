"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuickLink } from "@/lib/types/admin-dashboard";

interface QuickAccessGridProps {
  links: QuickLink[];
}

export function QuickAccessGrid({ links }: QuickAccessGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Access</CardTitle>
        <CardDescription>Navigate to different sections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
                <link.icon className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">{link.label}</span>
                <Badge variant="outline" className="text-xs">
                  {link.count.toLocaleString()}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
