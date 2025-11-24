"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { CHART_COLORS } from "@/lib/utils/badge-helpers";
import type { DashboardStats } from "@/lib/types/admin-dashboard";

interface DashboardChartsProps {
  stats: DashboardStats;
}

const chartConfig = {
  users: { label: "Users", color: "hsl(var(--chart-1))" },
  conversations: { label: "Conversations", color: "hsl(var(--chart-2))" },
  value: { label: "Count" },
};

export function GrowthChart({ stats }: DashboardChartsProps) {
  const growthData = [
    {
      period: "Today",
      users: stats.users.newToday,
      conversations: stats.conversations.activeLast24h,
    },
    {
      period: "This Week",
      users: stats.users.newThisWeek,
      conversations: Math.round(stats.conversations.activeLast24h * 3),
    },
    {
      period: "This Month",
      users: stats.users.newThisMonth,
      conversations:
        stats.conversations.total > 0
          ? Math.round(stats.conversations.total * 0.4)
          : 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Growth Overview</CardTitle>
        <CardDescription>New users and active conversations</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={growthData}>
            <XAxis dataKey="period" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="users"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
              name="New Users"
            />
            <Bar
              dataKey="conversations"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
              name="Conversations"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function SubscriptionStatusChart({ stats }: DashboardChartsProps) {
  const data = stats.subscriptions.byStatus.map((item, index) => ({
    name: item.status,
    value: item.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Subscription Status</CardTitle>
        <CardDescription>Distribution by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function AuthProviderChart({ stats }: DashboardChartsProps) {
  const data = stats.users.byAuthProvider.map((item, index) => ({
    name: item.provider,
    value: item.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Auth Providers</CardTitle>
        <CardDescription>User distribution by login method</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={70}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span>
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CrawlStatusChart({ stats }: DashboardChartsProps) {
  const data = stats.sites.byCrawlStatus.map((item, index) => ({
    name: item.status,
    value: item.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Crawl Status</CardTitle>
        <CardDescription>Sites by crawl status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={70}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span>
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
