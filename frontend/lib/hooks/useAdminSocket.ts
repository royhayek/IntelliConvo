"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    byAuthProvider: { provider: string; count: number }[];
    activeLastWeek: number;
    activeLastMonth: number;
    adminCount: number;
  };
  sites: {
    total: number;
    byCrawlStatus: { status: string; count: number }[];
    failedCrawlsLast24h: number;
    totalUrlsIndexed: number;
    urlsPendingCrawl: number;
  };
  embeddings: {
    total: number;
    createdLast24h: number;
    urlsWithoutEmbeddings: number;
    averageChunksPerUrl: number;
  };
  files: {
    total: number;
    byStatus: { status: string; count: number }[];
    failedFiles: number;
    stuckFiles: number;
    totalStorageBytes: string;
  };
  conversations: {
    total: number;
    activeLast24h: number;
    totalMessages: number;
    messagesLast24h: number;
    avgMessagesPerConversation: number;
    totalTokensUsed: number;
    estimatedCostCents: number;
  };
  subscriptions: {
    total: number;
    byStatus: { status: string; count: number }[];
    byPlanType: { planType: string; count: number }[];
    expiringTrialsNext7Days: number;
  };
  security: {
    activeSessions: number;
    sessionsCreatedLast24h: number;
    expiredTokensNeedingCleanup: number;
    usersWithMultipleSessions: number;
  };
  billing: {
    totalTransactions: number;
    totalRevenue: number;
    revenueThisMonth: number;
    transactionsByStatus: { status: string; count: number }[];
  };
}

interface UseAdminSocketOptions {
  onStatsUpdate?: (stats: DashboardStats) => void;
  autoConnect?: boolean;
}

export function useAdminSocket(options: UseAdminSocketOptions = {}) {
  const { onStatsUpdate, autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("accessToken");

    socketRef.current = io(apiUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      setIsConnected(true);
      // Join admin dashboard room
      socketRef.current?.emit("join-admin-dashboard");
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current.on("stats-update", (stats: DashboardStats) => {
      setLastUpdate(new Date());
      onStatsUpdate?.(stats);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Admin socket connection error:", error);
    });
  }, [onStatsUpdate]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("leave-admin-dashboard");
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const requestRefresh = useCallback(() => {
    if (socketRef.current?.connected) {
      // Request fresh stats by re-joining the room
      socketRef.current.emit("leave-admin-dashboard");
      socketRef.current.emit("join-admin-dashboard");
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    lastUpdate,
    connect,
    disconnect,
    requestRefresh,
  };
}
