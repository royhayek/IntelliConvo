"use client";

import { memo, useMemo } from "react";
import { AlertTriangle, Clock, MessageSquare, MessagesSquare, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTrialStatus, calculateTrialUsage, type TrialStatus } from "@/lib/hooks/useTrialStatus";
import { cn } from "@/lib/utils";

interface TrialStatusBannerProps {
  siteId: string;
  onUpgrade?: () => void;
  className?: string;
}

function TrialStatusBannerComponent({ siteId, onUpgrade, className }: TrialStatusBannerProps) {
  const { data: trialStatus, isLoading } = useTrialStatus(siteId);

  const usage = useMemo(() => calculateTrialUsage(trialStatus), [trialStatus]);

  // Don't show if loading, not in trial, or trial is disabled
  if (isLoading || !trialStatus?.limits?.trialEnabled) {
    return null;
  }

  // Not in trial and not expired - active subscription
  if (!trialStatus.isInTrial && !trialStatus.trialExpired) {
    return null;
  }

  // Trial expired
  if (trialStatus.trialExpired) {
    return (
      <Card className={cn("border-destructive bg-destructive/5", className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-destructive">Trial Ended</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {trialStatus.reason || "Your free trial has ended. Upgrade to continue using your AI assistant."}
              </p>
            </div>
            {onUpgrade && (
              <Button onClick={onUpgrade} size="sm" className="flex-shrink-0">
                <Zap className="h-4 w-4 mr-1" />
                Upgrade Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active trial
  if (!usage) return null;

  const isNearLimit = usage.daysPercent >= 75 || usage.conversationsPercent >= 75 || usage.messagesPercent >= 75;

  return (
    <Card className={cn(isNearLimit ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20" : "border-primary/20 bg-primary/5", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center",
              isNearLimit ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10"
            )}>
              <Clock className={cn("h-4 w-4", isNearLimit ? "text-amber-600" : "text-primary")} />
            </div>
            <div>
              <h3 className={cn("font-semibold text-sm", isNearLimit ? "text-amber-700 dark:text-amber-400" : "text-primary")}>
                Free Trial
              </h3>
              <p className="text-xs text-muted-foreground">
                {trialStatus.daysRemaining} {trialStatus.daysRemaining === 1 ? "day" : "days"} remaining
              </p>
            </div>
          </div>
          {onUpgrade && (
            <Button onClick={onUpgrade} size="sm" variant={isNearLimit ? "default" : "outline"}>
              <Zap className="h-4 w-4 mr-1" />
              Upgrade
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Days */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                Days
              </span>
              <span className="font-medium">
                {usage.daysUsed} / {usage.daysTotal}
              </span>
            </div>
            <Progress
              value={usage.daysPercent}
              className={cn("h-1.5", usage.daysPercent >= 75 && "bg-amber-100 [&>div]:bg-amber-500")}
            />
          </div>

          {/* Conversations */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <MessagesSquare className="h-3 w-3" />
                Conversations
              </span>
              <span className="font-medium">
                {usage.conversationsUsed} / {usage.conversationsTotal}
              </span>
            </div>
            <Progress
              value={usage.conversationsPercent}
              className={cn("h-1.5", usage.conversationsPercent >= 75 && "bg-amber-100 [&>div]:bg-amber-500")}
            />
          </div>

          {/* Messages */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                Messages
              </span>
              <span className="font-medium">
                {usage.messagesUsed} / {usage.messagesTotal}
              </span>
            </div>
            <Progress
              value={usage.messagesPercent}
              className={cn("h-1.5", usage.messagesPercent >= 75 && "bg-amber-100 [&>div]:bg-amber-500")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const TrialStatusBanner = memo(TrialStatusBannerComponent);
