"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChatInterface, type ChatMessage } from "@/components/ui/chat-interface";
import { SuggestedQuestions } from "@/components/playground/suggested-questions";
import { AssistantInfoCard } from "@/components/playground/assistant-info-card";
import { type GetApiV1SitesSiteId200 } from "@/lib/api/generated/models";

interface PlaygroundTabProps {
  site: GetApiV1SitesSiteId200;
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

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to conversation endpoint
      const response = await fetch(`/api/sites/${site.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          message: content,
          conversationId: null // New conversation for playground
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm sorry, I couldn't process your request right now.",
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Fallback response for demonstration
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm currently in demo mode. In a real implementation, I would search through your website's content and provide relevant answers based on what you've taught me.",
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([
      {
        id: '1',
        content: 'Hello! I\'m your AI assistant for this website. How can I help you today?',
        role: 'assistant',
        timestamp: new Date()
      }
    ]);
  };

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
            subtitle="Testing mode"
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
            urlsCount={site._count?.urls || 0}
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