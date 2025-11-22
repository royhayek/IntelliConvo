"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Palette,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Globe,
  User,
  MessageSquare,
  Link as LinkIcon,
  Settings,
  Layout,
  Bell,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useGetApiV1AdminWidgetsWidgetId,
  usePostApiV1AdminWidgetsWidgetIdReset,
  getGetApiV1AdminWidgetsWidgetIdQueryKey,
} from "@/lib/api/generated/queries/admin-widgets/admin-widgets";

// Extended interface for the full widget detail response
// The generated AdminWidget type doesn't include all fields returned by the API
interface WidgetDetail {
  id: string;
  siteId: string;
  // Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  // Typography
  fontFamily: string;
  fontSize: number;
  // Launcher
  launcherPosition: string;
  launcherSize: string;
  launcherShape: string;
  launcherIcon: string;
  launcherTooltip: string;
  launcherAnimation: string;
  // Chat Window
  chatWindowWidth: number;
  chatWindowHeight: number;
  headerTitle: string;
  headerSubtitle: string | null;
  // Behavior
  theme: string;
  autoOpenEnabled: boolean;
  autoOpenDelay: number;
  enableAnimations: boolean;
  showTypingIndicator: boolean;
  enableSoundNotifications: boolean;
  enableVoiceInput: boolean;
  enableFileAttachments: boolean;
  // Content
  botName: string;
  welcomeMessage: string;
  showPoweredBy: boolean;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  site: {
    id: string;
    siteName: string;
    siteUrl: string;
    siteDescription: string | null;
    welcomeMessage: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
      fullName: string | null;
    };
    subscription: {
      id: string;
      status: string;
      planType: string;
    } | null;
    _count: {
      conversations: number;
      urls: number;
    };
  };
}

export default function AdminWidgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const widgetId = params.id as string;

  // Fetch widget details using the generated hook
  const {
    data: widgetResponse,
    isLoading,
    error,
  } = useGetApiV1AdminWidgetsWidgetId<{ data: WidgetDetail }>(widgetId, {
    query: {
      enabled: !!widgetId,
    },
  });

  const widget = widgetResponse?.data;

  // Reset mutation using the generated hook
  const resetMutation = usePostApiV1AdminWidgetsWidgetIdReset({
    mutation: {
      onSuccess: () => {
        // Invalidate the widget query to refetch fresh data
        queryClient.invalidateQueries({
          queryKey: getGetApiV1AdminWidgetsWidgetIdQueryKey(widgetId),
        });
      },
    },
  });

  const handleReset = () => {
    resetMutation.mutate({ widgetId });
  };

  const getThemeIcon = () => {
    switch (widget?.theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "auto":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !widget) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : "Widget not found"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Palette className="h-6 w-6" />
              Widget Settings
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {widget.site.siteName}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={resetMutation.isPending}
        >
          {resetMutation.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Site Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Site Name</p>
              <Link href={`/admin/sites/${widget.site.id}`} className="font-medium hover:underline">
                {widget.site.siteName}
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-500">Site URL</p>
              <p className="font-mono text-sm truncate">{widget.site.siteUrl}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Owner</p>
              <Link href={`/admin/users/${widget.site.user.id}`} className="hover:underline">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{widget.site.user.email}</span>
                </div>
              </Link>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-gray-500">Conversations</p>
                <Badge variant="outline">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {widget.site._count.conversations}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">URLs</p>
                <Badge variant="outline">
                  <LinkIcon className="h-3 w-3 mr-1" />
                  {widget.site._count.urls}
                </Badge>
              </div>
            </div>
            {widget.site.subscription && (
              <div>
                <p className="text-sm text-gray-500">Subscription</p>
                <Link href={`/admin/subscriptions/${widget.site.subscription.id}`}>
                  <Badge className={
                    widget.site.subscription.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }>
                    {widget.site.subscription.status}
                  </Badge>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Theme</p>
              <div className="flex items-center gap-2 mt-1">
                {getThemeIcon()}
                <span className="capitalize">{widget.theme}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Colors</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: widget.primaryColor }}
                  />
                  <span className="text-sm">Primary: {widget.primaryColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: widget.secondaryColor }}
                  />
                  <span className="text-sm">Secondary: {widget.secondaryColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: widget.backgroundColor }}
                  />
                  <span className="text-sm">Background: {widget.backgroundColor}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Font</p>
              <p>{widget.fontFamily} ({widget.fontSize}px)</p>
            </div>
          </CardContent>
        </Card>

        {/* Launcher Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Launcher
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Position</p>
              <Badge variant="outline" className="capitalize">
                {widget.launcherPosition.replace("-", " ")}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Size</p>
              <p className="capitalize">{widget.launcherSize}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Shape</p>
              <p className="capitalize">{widget.launcherShape}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Icon</p>
              <p className="capitalize">{widget.launcherIcon}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Animation</p>
              <p className="capitalize">{widget.launcherAnimation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tooltip</p>
              <p>{widget.launcherTooltip}</p>
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Chat Window
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Dimensions</p>
              <p>{widget.chatWindowWidth}px x {widget.chatWindowHeight}px</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Header Title</p>
              <p className="font-medium">{widget.headerTitle}</p>
            </div>
            {widget.headerSubtitle && (
              <div>
                <p className="text-sm text-gray-500">Header Subtitle</p>
                <p>{widget.headerSubtitle}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Bot Name</p>
              <p className="font-medium">{widget.botName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Welcome Message</p>
              <p className="text-sm">{widget.welcomeMessage}</p>
            </div>
          </CardContent>
        </Card>

        {/* Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Behavior
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto Open</span>
              <Badge variant={widget.autoOpenEnabled ? "default" : "outline"}>
                {widget.autoOpenEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            {widget.autoOpenEnabled && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Auto Open Delay</span>
                <span>{widget.autoOpenDelay}ms</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm">Animations</span>
              <Badge variant={widget.enableAnimations ? "default" : "outline"}>
                {widget.enableAnimations ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Typing Indicator</span>
              <Badge variant={widget.showTypingIndicator ? "default" : "outline"}>
                {widget.showTypingIndicator ? "Shown" : "Hidden"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sound Notifications</span>
              <Badge variant={widget.enableSoundNotifications ? "default" : "outline"}>
                {widget.enableSoundNotifications ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Voice Input</span>
              <Badge variant={widget.enableVoiceInput ? "default" : "outline"}>
                {widget.enableVoiceInput ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">File Attachments</span>
              <Badge variant={widget.enableFileAttachments ? "default" : "outline"}>
                {widget.enableFileAttachments ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Show "Powered By"</span>
              <Badge variant={widget.showPoweredBy ? "default" : "outline"}>
                {widget.showPoweredBy ? "Shown" : "Hidden"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p>{new Date(widget.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p>{new Date(widget.updatedAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
