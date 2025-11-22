"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

interface CrawlStatusUpdate {
  siteId: string;
  crawlStatus: "PENDING" | "CRAWLING" | "COMPLETED" | "FAILED" | "AWAITING_PAYMENT" | "PROCESSING" | "READY" | "PARTIAL";
  urlCount?: number;
}

interface UrlStatusItem {
  urlId: string;
  embeddingStatus: "PENDING" | "SCRAPED" | "PROCESSING" | "READY" | "FAILED";
}

interface UrlStatusUpdate {
  siteId: string;
  urls: UrlStatusItem[];
}

interface UseSiteSocketOptions {
  siteId: string | null;
  onCrawlStatusUpdate?: (update: CrawlStatusUpdate) => void;
  onUrlStatusUpdate?: (update: UrlStatusUpdate) => void;
  autoConnect?: boolean;
}

export function useSiteSocket(options: UseSiteSocketOptions) {
  const { siteId, onCrawlStatusUpdate, onUrlStatusUpdate, autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onCrawlStatusUpdateRef = useRef(onCrawlStatusUpdate);
  const onUrlStatusUpdateRef = useRef(onUrlStatusUpdate);

  // Keep the callback refs updated
  useEffect(() => {
    onCrawlStatusUpdateRef.current = onCrawlStatusUpdate;
  }, [onCrawlStatusUpdate]);

  useEffect(() => {
    onUrlStatusUpdateRef.current = onUrlStatusUpdate;
  }, [onUrlStatusUpdate]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected || !siteId) return;

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
      // Join site room
      socketRef.current?.emit("join-site", siteId);
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current.on("crawl-status-update", (update: CrawlStatusUpdate) => {
      onCrawlStatusUpdateRef.current?.(update);
    });

    socketRef.current.on("url-status-update", (update: UrlStatusUpdate) => {
      onUrlStatusUpdateRef.current?.(update);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Site socket connection error:", error);
    });
  }, [siteId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (autoConnect && siteId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, siteId, connect, disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
  };
}
