"use client";

import { FileText, HardDrive, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { formatBytes } from "@/lib/utils";

interface FileStats {
  total: number;
  byStatus: { status: string; count: number }[];
  failedFiles: number;
  stuckFiles: number;
  totalStorageBytes: string;
}

interface FilesStatsProps {
  stats: FileStats;
}

export function FilesStats({ stats }: FilesStatsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Files"
          value={stats.total.toLocaleString()}
          icon={FileText}
          color="blue"
        />
        <StatCard
          label="Storage Used"
          value={formatBytes(parseInt(stats.totalStorageBytes) || 0)}
          icon={HardDrive}
          color="green"
        />
        <StatCard
          label="Failed Files"
          value={stats.failedFiles}
          icon={XCircle}
          color={stats.failedFiles > 0 ? "red" : "green"}
        />
        <StatCard
          label="Stuck Processing"
          value={stats.stuckFiles}
          icon={Clock}
          color={stats.stuckFiles > 0 ? "orange" : "green"}
        />
      </div>

      {stats.byStatus.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Files by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {stats.byStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <Badge variant="outline">{item.status}</Badge>
                  <span className="text-sm font-medium">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
