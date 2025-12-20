/**
 * Hook for real-time conversation updates via Socket.IO
 */

import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../socket';
import type { Socket } from 'socket.io-client';

interface UseConversationSocketOptions {
  siteId?: string;
  conversationId?: string;
  onConversationEscalated?: (conversation: any) => void;
  onConversationStatusChanged?: (data: any) => void;
  onConversationMessage?: (message: any) => void;
  onAgentJoined?: (data: any) => void;
  onAgentTyping?: (data: { isTyping: boolean }) => void;
  onAgentLeft?: (data: any) => void;
}

export const useConversationSocket = (options: UseConversationSocketOptions = {}) => {
  const {
    siteId,
    conversationId,
    onConversationEscalated,
    onConversationStatusChanged,
    onConversationMessage,
    onAgentJoined,
    onAgentTyping,
    onAgentLeft,
  } = options;

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Get socket instance
    const socket = getSocket();
    socketRef.current = socket;

    // Connect if not connected
    if (!socket.connected) {
      socket.connect();
    }

    // Join site room if siteId provided
    if (siteId) {
      socket.emit('join-site', siteId);
    }

    // Join conversation room if conversationId provided
    if (conversationId) {
      socket.emit('join-conversation', conversationId);
    }

    // Set up event listeners
    if (onConversationEscalated) {
      socket.on('conversation-escalated', onConversationEscalated);
    }

    if (onConversationStatusChanged) {
      socket.on('conversation-status-changed', onConversationStatusChanged);
    }

    if (onConversationMessage) {
      socket.on('conversation-message', onConversationMessage);
    }

    if (onAgentJoined) {
      socket.on('agent-joined', onAgentJoined);
    }

    if (onAgentTyping) {
      socket.on('agent-typing', onAgentTyping);
    }

    if (onAgentLeft) {
      socket.on('agent-left', onAgentLeft);
    }

    // Listen for conversation-taken success
    socket.on('conversation-taken', (data: any) => {
      console.log('✅ Conversation taken successfully:', data);
    });

    // Listen for socket errors
    socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
    });

    // Cleanup
    return () => {
      if (siteId) {
        socket.emit('leave-site', siteId);
      }

      if (conversationId) {
        socket.emit('leave-conversation', conversationId);
      }

      socket.off('conversation-escalated');
      socket.off('conversation-status-changed');
      socket.off('conversation-message');
      socket.off('agent-joined');
      socket.off('agent-typing');
      socket.off('agent-left');
      socket.off('conversation-taken');
      socket.off('error');
    };
  }, [
    siteId,
    conversationId,
    onConversationEscalated,
    onConversationStatusChanged,
    onConversationMessage,
    onAgentJoined,
    onAgentTyping,
    onAgentLeft,
  ]);

  // Helper functions for emitting events
  const takeConversation = useCallback(
    (conversationId: string, agentId: string) => {
      console.log('🔵 Taking conversation:', { conversationId, agentId, connected: socketRef.current?.connected });
      if (!socketRef.current?.connected) {
        console.error('❌ Socket not connected! Cannot take conversation.');
        return;
      }
      socketRef.current?.emit('agent-take-conversation', { conversationId, agentId });
      console.log('✅ Emitted agent-take-conversation event');
    },
    []
  );

  const sendAgentMessage = useCallback(
    (conversationId: string, agentId: string, content: string) => {
      socketRef.current?.emit('agent-send-message', { conversationId, agentId, content });
    },
    []
  );

  const setAgentTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      socketRef.current?.emit('agent-typing', { conversationId, isTyping });
    },
    []
  );

  const resolveConversation = useCallback(
    (conversationId: string, agentId: string, notes?: string) => {
      socketRef.current?.emit('agent-resolve-conversation', { conversationId, agentId, notes });
    },
    []
  );

  const requestAgent = useCallback((conversationId: string, reason?: string) => {
    socketRef.current?.emit('request-agent', { conversationId, reason });
  }, []);

  return {
    socket: socketRef.current,
    takeConversation,
    sendAgentMessage,
    setAgentTyping,
    resolveConversation,
    requestAgent,
  };
};
