"use client";

import { useState } from "react";
import {
  MessageSquare,
  Users,
  TrendingUp,
  BarChart3,
  FileText,
  Database,
  Clock,
  PieChart,
  Activity,
  Loader2,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { DateRangeFilter, type DateRange } from "@/components/ui/date-range-filter";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useGetSitesSiteIdAnalytics } from "@/lib/api/generated/queries/sites/sites";
import { type SiteResponse, type GetSitesSiteIdAnalyticsParams } from "@/lib/api/generated/models";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from "@/lib/utils";

interface OverviewTabProps {
  site: SiteResponse;
}

// Stat card component for consistency
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor = "indigo",
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  iconColor?: "indigo" | "blue" | "green" | "purple" | "orange" | "red" | "emerald" | "amber";
  className?: string;
}) {
  const colorMap = {
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
  };

  return (
    <Card className={cn("hover:shadow-md transition-all duration-200", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={cn("p-2 sm:p-2.5 rounded-xl", colorMap[iconColor])}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {label}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {subValue && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {subValue}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Progress bar component
function ProgressBar({
  label,
  value,
  total,
  color = "indigo",
}: {
  label: string;
  value: number;
  total: number;
  color?: "indigo" | "green" | "red" | "amber" | "blue";
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorMap = {
    indigo: "bg-indigo-500",
    green: "bg-green-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorMap[color])}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function OverviewTab({ site }: OverviewTabProps) {
  const [dateFilter, setDateFilter] = useState<DateRange>("30d");

  // Map dateFilter to API period
  const getApiPeriod = (filter: DateRange): GetSitesSiteIdAnalyticsParams["period"] => {
    switch (filter) {
      case "7d": return "7d";
      case "30d": return "30d";
      case "90d": return "90d";
      case "all": return "1y";
      default: return "30d";
    }
  };

  // Get comprehensive analytics data
  const { data: analytics, isLoading } = useGetSitesSiteIdAnalytics(
    site.id,
    { period: getApiPeriod(dateFilter) }
  );

  // Chart configurations
  const areaChartConfig = {
    conversations: {
      label: "Conversations",
      color: "hsl(var(--chart-1))",
    },
    messages: {
      label: "Messages",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  const barChartConfig = {
    tokens: {
      label: "Tokens",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig;

  const pieChartConfig = {
    ready: {
      label: "Ready",
      color: "hsl(142 76% 36%)", // green
    },
    processing: {
      label: "Processing",
      color: "hsl(217 91% 60%)", // blue
    },
    pending: {
      label: "Pending",
      color: "hsl(45 93% 47%)", // amber
    },
    failed: {
      label: "Failed",
      color: "hsl(0 84% 60%)", // red
    },
    excluded: {
      label: "Excluded",
      color: "hsl(215 16% 47%)", // gray
    },
  } satisfies ChartConfig;

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

  // Transform URL status data for pie chart
  const urlStatusData = analytics?.knowledgeBase ? [
    { name: 'Ready', value: analytics.knowledgeBase.urlsByStatus?.ready || 0, fill: COLORS[0] },
    { name: 'Processing', value: analytics.knowledgeBase.urlsByStatus?.processing || 0, fill: COLORS[1] },
    { name: 'Pending', value: analytics.knowledgeBase.urlsByStatus?.pending || 0, fill: COLORS[2] },
    { name: 'Failed', value: analytics.knowledgeBase.urlsByStatus?.failed || 0, fill: COLORS[3] },
    { name: 'Excluded', value: analytics.knowledgeBase.urlsByStatus?.excluded || 0, fill: COLORS[4] },
  ].filter(item => item.value > 0) : [];

  // Transform peak hours data for bar chart
  const peakHoursData = analytics?.engagement?.peakHours?.slice(0, 12).map(item => ({
    hour: `${item.hour}:00`,
    count: item.count,
  })) || [];

  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Overview"
        description="Monitor your AI assistant's performance and engagement"
        action={<DateRangeFilter value={dateFilter} onChange={setDateFilter} />}
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={MessageSquare}
          label="Total Conversations"
          value={analytics?.overview?.totalConversations ?? 0}
          subValue={`${analytics?.engagement?.conversationsToday ?? 0} today`}
          iconColor="indigo"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Messages"
          value={analytics?.overview?.totalMessages ?? 0}
          subValue={`~${(analytics?.overview?.averageMessagesPerConversation ?? 0).toFixed(1)} per conv.`}
          iconColor="blue"
        />
        <StatCard
          icon={Users}
          label="Active Users"
          value={analytics?.overview?.activeUsers ?? 0}
          subValue="Unique visitors"
          iconColor="green"
        />
        <StatCard
          icon={Bot}
          label="AI Responses"
          value={analytics?.responseMetrics?.totalAssistantMessages ?? 0}
          subValue={`${(analytics?.overview?.averageMessagesPerConversation ?? 0).toFixed(1)} per conv.`}
          iconColor="purple"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Conversations & Messages Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
              Activity Over Time
            </CardTitle>
            <CardDescription>
              Daily conversations and messages over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={areaChartConfig} className="h-[280px] sm:h-[300px] w-full">
              <AreaChart
                data={analytics?.timeSeriesData || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  fontSize={12}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  stroke="var(--color-conversations)"
                  strokeWidth={2}
                  fill="url(#colorConversations)"
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="var(--color-messages)"
                  strokeWidth={2}
                  fill="url(#colorMessages)"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats & Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Knowledge Base Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Database className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              Knowledge Base
            </CardTitle>
            <CardDescription>
              URL indexing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {urlStatusData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ChartContainer config={pieChartConfig} className="h-[160px] w-full">
                  <RechartsPieChart>
                    <Pie
                      data={urlStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {urlStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </RechartsPieChart>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {urlStatusData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                No URL data available
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total URLs</span>
                <span className="font-semibold">{analytics?.knowledgeBase?.totalUrls ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Embeddings</span>
                <span className="font-semibold">{(analytics?.knowledgeBase?.totalEmbeddings ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>
              File processing status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics?.knowledgeBase?.totalFiles ?? 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Files</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatBytes(analytics?.knowledgeBase?.totalFileSizeBytes ?? 0)}
              </p>
            </div>
            <div className="space-y-3">
              <ProgressBar
                label="Completed"
                value={analytics?.knowledgeBase?.filesByStatus?.completed ?? 0}
                total={analytics?.knowledgeBase?.totalFiles ?? 1}
                color="green"
              />
              <ProgressBar
                label="Pending"
                value={analytics?.knowledgeBase?.filesByStatus?.pending ?? 0}
                total={analytics?.knowledgeBase?.totalFiles ?? 1}
                color="amber"
              />
              <ProgressBar
                label="Failed"
                value={analytics?.knowledgeBase?.filesByStatus?.failed ?? 0}
                total={analytics?.knowledgeBase?.totalFiles ?? 1}
                color="red"
              />
            </div>
          </CardContent>
        </Card>

        {/* Response Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              Message Statistics
            </CardTitle>
            <CardDescription>
              Conversation and message breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {(analytics?.responseMetrics?.totalUserMessages ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">User Messages</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {(analytics?.responseMetrics?.totalAssistantMessages ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI Responses</p>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Messages/Conv.</span>
                <span className="text-sm font-semibold">{(analytics?.overview?.averageMessagesPerConversation ?? 0).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Messages</span>
                <span className="text-sm font-semibold">{(analytics?.overview?.totalMessages ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Response Rate</span>
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {analytics?.responseMetrics?.totalUserMessages && analytics?.responseMetrics?.totalUserMessages > 0
                    ? `${((analytics?.responseMetrics?.totalAssistantMessages ?? 0) / analytics.responseMetrics.totalUserMessages * 100).toFixed(0)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours & Engagement Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Peak Hours Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              Peak Activity Hours
            </CardTitle>
            <CardDescription>
              When your visitors are most active (top 12 hours)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {peakHoursData.length > 0 ? (
              <ChartContainer config={barChartConfig} className="h-[200px] w-full">
                <BarChart
                  data={peakHoursData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                    fontSize={10}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--chart-3))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                No activity data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engagement Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
              Engagement Summary
            </CardTitle>
            <CardDescription>
              Conversation trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/30 dark:to-indigo-800/20 rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {analytics?.engagement?.conversationsToday ?? 0}
                </p>
                <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">Today</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {analytics?.engagement?.conversationsThisWeek ?? 0}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70">This Week</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20 rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {analytics?.engagement?.conversationsThisMonth ?? 0}
                </p>
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70">This Month</p>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">URLs Ready</span>
                </div>
                <span className="text-sm font-medium">{analytics?.knowledgeBase?.urlsByStatus?.ready ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Processing</span>
                </div>
                <span className="text-sm font-medium">{analytics?.knowledgeBase?.urlsByStatus?.processing ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Failed</span>
                </div>
                <span className="text-sm font-medium">{analytics?.knowledgeBase?.urlsByStatus?.failed ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
