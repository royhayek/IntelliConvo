"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopAdmin {
  adminId: string;
  adminEmail: string;
  actionCount: number;
}

interface TopAdminsCardProps {
  topAdmins: TopAdmin[] | undefined;
}

export function TopAdminsCard({ topAdmins }: TopAdminsCardProps) {
  if (!topAdmins || topAdmins.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Most Active Admins</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topAdmins.map((admin, index) => (
            <div key={admin.adminId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                <div>
                  <p className="font-medium">{admin.adminEmail}</p>
                </div>
              </div>
              <Badge variant="secondary">{admin.actionCount} actions</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
