"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChatInterface, type ChatMessage } from "@/components/ui/chat-interface";
import { SuggestedQuestions } from "@/components/playground/suggested-questions";
import { AssistantInfoCard } from "@/components/playground/assistant-info-card";
import { type SiteResponse } from "@/lib/api/generated/models";

interface PlaygroundTabProps {
  site: SiteResponse;
}

// Generate a unique session ID for the playground
function generateSessionId(): string {
  return `playground-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function PlaygroundTab({ site }: PlaygroundTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant for this website. How can I help you today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());
  const streamingMessageRef = useRef<string>('');

  // Initialize socket connection
  useEffect(() => {
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
      // Join the site room
      socketRef.current?.emit("join-site", site.id);
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });

    // Handle streaming response chunks
    socketRef.current.on("stream", (data: { chunk: string }) => {
      streamingMessageRef.current += data.chunk;

      // Update the last message with streaming content
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id.startsWith('streaming-')) {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: streamingMessageRef.current }
          ];
        }
        return prev;
      });
    });

    // Handle complete response
    socketRef.current.on("complete", (data: { messageId: string; content: string }) => {
      setIsLoading(false);
      streamingMessageRef.current = '';

      // Finalize the streaming message
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id.startsWith('streaming-')) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              id: data.messageId, // Use the actual message ID from backend
              content: data.content
            }
          ];
        }
        return prev;
      });
    });

    // Handle typing indicator
    socketRef.current.on("typing", (data: { isTyping: boolean }) => {
      setIsLoading(data.isTyping);
    });

    // Handle errors
    socketRef.current.on("error", (data: { message: string }) => {
      setIsLoading(false);
      streamingMessageRef.current = '';

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: data.message || "Sorry, an error occurred. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => {
        // Remove any streaming message and add error
        const filtered = prev.filter(m => !m.id.startsWith('streaming-'));
        return [...filtered, errorMessage];
      });
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [site.id]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!socketRef.current || !isConnected) {
      // Fallback message if not connected
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "Unable to connect to the chat server. Please refresh the page and try again.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    streamingMessageRef.current = '';

    // Add placeholder for streaming response
    const streamingMessage: ChatMessage = {
      id: `streaming-${Date.now()}`,
      content: '',
      role: 'assistant',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, streamingMessage]);

    // Send message via socket
    socketRef.current.emit('message', {
      sessionId: sessionIdRef.current,
      siteId: site.id,
      content
    });
  }, [isConnected, site.id]);

  const resetConversation = useCallback(() => {
    // Generate new session ID for fresh conversation
    sessionIdRef.current = generateSessionId();
    streamingMessageRef.current = '';

    setMessages([
      {
        id: '1',
        content: 'Hello! I\'m your AI assistant for this website. How can I help you today?',
        role: 'assistant',
        timestamp: new Date()
      }
    ]);
  }, []);

  const suggestedQuestions = [
    "What services do you offer?",
    "How can I get started?",
    "What are your pricing plans?",
    "How do I contact support?",
    "Tell me about your company"
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Playground"
        description="Test your AI assistant and see how it responds to questions"
        action={
          <Button variant="outline" onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Chat
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            subtitle={isConnected ? "Connected" : "Connecting..."}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <SuggestedQuestions
            questions={suggestedQuestions}
            onQuestionClick={handleSendMessage}
            disabled={isLoading}
          />

          <AssistantInfoCard
            siteName={site.siteName}
            urlsCount={site._count?.siteUrls || 0}
            knowledgeFilesCount={site._count?.knowledgeFiles || 0}
            lastUpdated={site.lastCrawledAt}
          />

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Ask questions about your website content</li>
                <li>• Try different conversation starters</li>
                <li>• Test how the AI handles edge cases</li>
                <li>• Check if responses match your brand voice</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset Chat?"
        description="This will clear all messages in the playground. This action cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        variant="warning"
        onConfirm={resetConversation}
      />
    </div>
  );
}
