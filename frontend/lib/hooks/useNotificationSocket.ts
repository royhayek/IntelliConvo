"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

interface Notification {
  id?: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  link?: string;
  createdAt?: string;
}

interface UseNotificationSocketOptions {
  userId: string | null;
  onNotification?: (notification: Notification) => void;
  autoConnect?: boolean;
}

export function useNotificationSocket(options: UseNotificationSocketOptions) {
  const { userId, onNotification, autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onNotificationRef = useRef(onNotification);
  const queryClient = useQueryClient();

  // Keep the callback ref updated
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected || !userId) return;

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
      // Join user room for notifications
      socketRef.current?.emit("join-user", userId);
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current.on("notification", (notification: Notification) => {
      // Invalidate notifications query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // Call the callback if provided
      onNotificationRef.current?.(notification);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Notification socket connection error:", error);
    });
  }, [userId, queryClient]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (userId) {
        socketRef.current.emit("leave-user", userId);
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [userId]);

  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId, connect, disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
  };
}
