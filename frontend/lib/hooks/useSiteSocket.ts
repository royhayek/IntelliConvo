"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface CrawlStatusUpdate {
  siteId: string;
  crawlStatus: "PENDING" | "CRAWLING" | "PAUSED" | "COMPLETED" | "FAILED" | "AWAITING_PAYMENT" | "PROCESSING" | "READY" | "PARTIAL";
  urlCount?: number;
}

export interface CrawlProgressUpdate {
  siteId: string;
  crawled: number;  // Total processed (success + failed)
  total: number;
  currentUrl: string;
  estimatedSecondsRemaining?: number;
  successCount?: number;  // Successfully crawled
  failedCount?: number;   // Failed to crawl
}

export interface DiscoveryStatusUpdate {
  siteId: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  urlCount?: number;
}

export interface EmbeddingProgressUpdate {
  siteId: string;
  completed: number;
  total: number;
  currentUrl?: string;
  estimatedSecondsRemaining?: number;
  phase: "embedding";
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
  onCrawlProgress?: (update: CrawlProgressUpdate) => void;
  onUrlStatusUpdate?: (update: UrlStatusUpdate) => void;
  onDiscoveryStatusUpdate?: (update: DiscoveryStatusUpdate) => void;
  onEmbeddingProgress?: (update: EmbeddingProgressUpdate) => void;
  autoConnect?: boolean;
}

export function useSiteSocket(options: UseSiteSocketOptions) {
  const { siteId, onCrawlStatusUpdate, onCrawlProgress, onUrlStatusUpdate, onDiscoveryStatusUpdate, onEmbeddingProgress, autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onCrawlStatusUpdateRef = useRef(onCrawlStatusUpdate);
  const onCrawlProgressRef = useRef(onCrawlProgress);
  const onUrlStatusUpdateRef = useRef(onUrlStatusUpdate);
  const onDiscoveryStatusUpdateRef = useRef(onDiscoveryStatusUpdate);
  const onEmbeddingProgressRef = useRef(onEmbeddingProgress);

  // Keep the callback refs updated
  useEffect(() => {
    onCrawlStatusUpdateRef.current = onCrawlStatusUpdate;
  }, [onCrawlStatusUpdate]);

  useEffect(() => {
    onCrawlProgressRef.current = onCrawlProgress;
  }, [onCrawlProgress]);

  useEffect(() => {
    onUrlStatusUpdateRef.current = onUrlStatusUpdate;
  }, [onUrlStatusUpdate]);

  useEffect(() => {
    onDiscoveryStatusUpdateRef.current = onDiscoveryStatusUpdate;
  }, [onDiscoveryStatusUpdate]);

  useEffect(() => {
    onEmbeddingProgressRef.current = onEmbeddingProgress;
  }, [onEmbeddingProgress]);

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

    socketRef.current.on("crawl-progress", (update: CrawlProgressUpdate) => {
      onCrawlProgressRef.current?.(update);
    });

    socketRef.current.on("url-status-update", (update: UrlStatusUpdate) => {
      onUrlStatusUpdateRef.current?.(update);
    });

    socketRef.current.on("discovery-status-update", (update: DiscoveryStatusUpdate) => {
      onDiscoveryStatusUpdateRef.current?.(update);
    });

    socketRef.current.on("embedding-progress", (update: EmbeddingProgressUpdate) => {
      onEmbeddingProgressRef.current?.(update);
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
