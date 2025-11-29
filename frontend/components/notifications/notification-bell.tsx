"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotificationSocket } from "@/lib/hooks/useNotificationSocket";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  useGetNotifications,
  usePatchNotificationsNotificationIdRead,
  usePatchNotificationsReadAll,
  useDeleteNotificationsNotificationId,
  getGetNotificationsQueryKey,
} from "@/lib/api/generated/queries/notifications/notifications";
import type { Notification, NotificationType } from "@/lib/api/generated/models";

// Icon mapping
const typeIcons: Record<NotificationType, typeof Info> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

const typeColors: Record<NotificationType, string> = {
  INFO: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  SUCCESS: "text-green-500 bg-green-100 dark:bg-green-900/30",
  WARNING: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30",
  ERROR: "text-red-500 bg-red-100 dark:bg-red-900/30",
};

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevUnreadCountRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasInitializedRef = useRef(false);

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      // Create AudioContext lazily (must be created after user interaction)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      // Resume context if it was suspended (browser autoplay policy)
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create a soft, gentle two-tone notification sound
      const now = ctx.currentTime;

      // First tone (soft, lower pitch)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 440; // A4 - softer, lower note
      osc1.type = "sine";
      gain1.gain.setValueAtTime(0.04, now);
      gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.2);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Second tone (gentle chime, delayed)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 523; // C5 - harmonious with A4
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.035, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.4);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.4);
    } catch (err) {
      // Web Audio API might not be available, that's ok
      console.debug("Could not play notification sound:", err);
    }
  }, []);

  // Trigger badge animation
  const triggerBadgeAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  }, []);

  // Fetch notifications using generated query
  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useGetNotifications(
    { limit: "50" },
    {
      query: {
        enabled: !!user?.id,
        refetchInterval: 60000, // Refresh every minute
      },
    }
  );

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = notificationsData?.unreadCount ?? 0;

  // Detect when new notifications arrive and play sound/animation
  useEffect(() => {
    // Skip the initial load
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevUnreadCountRef.current = unreadCount;
      return;
    }

    // If unread count increased, we have new notifications
    if (unreadCount > prevUnreadCountRef.current) {
      playNotificationSound();
      triggerBadgeAnimation();
    }

    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, playNotificationSound, triggerBadgeAnimation]);

  // Mutations
  const markAsReadMutation = usePatchNotificationsNotificationIdRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      },
    },
  });

  const markAllAsReadMutation = usePatchNotificationsReadAll({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      },
    },
  });

  const deleteNotificationMutation = useDeleteNotificationsNotificationId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      },
    },
  });

  // Socket connection for real-time notifications
  useNotificationSocket({
    userId: user?.id || null,
    onNotification: () => {
      // Refresh notifications when a new one arrives
      refetch();
    },
  });

  // Refetch when popover opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all"
          title="Notifications"
        >
          <Bell className={cn("w-4 h-4", isAnimating && "animate-wiggle")} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
                {/* Ping animation when new notification arrives */}
                {isAnimating && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                )}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "group relative flex gap-2 p-4 transition-colors cursor-pointer",
                      !notification.isRead
                        ? "bg-indigo-50/50 dark:bg-indigo-900/10"
                        : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        typeColors[notification.type]
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            !notification.isRead
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-700 dark:text-gray-300"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-3">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    {/* Actions (shown on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                        disabled={deleteNotificationMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
