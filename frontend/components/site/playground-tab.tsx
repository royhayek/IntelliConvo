"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RotateCcw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type GetApiSitesSiteId200 } from "@/lib/api/generated/models";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface PlaygroundTabProps {
  site: GetApiSitesSiteId200;
}

export function PlaygroundTab({ site }: PlaygroundTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant for this website. How can I help you today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
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
          message: userMessage.content,
          conversationId: null // New conversation for playground
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm sorry, I couldn't process your request right now.",
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Fallback response for demonstration
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm currently in demo mode. In a real implementation, I would search through your website's content and provide relevant answers based on what you've taught me.",
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Playground</h2>
          <p className="text-gray-600">Test your AI assistant and see how it responds to questions</p>
        </div>
        <Button variant="outline" onClick={resetConversation}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base">Chat with your AI Assistant</CardTitle>
              </div>
              <div className="ml-auto">
                <span className="text-sm text-gray-500">Testing mode</span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-[80%]">
                      <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Suggested Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Suggested Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(question)}
                  className="w-full text-left p-2 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Site Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assistant Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs font-medium text-gray-600">Site:</span>
                <p className="text-sm text-gray-900">{site.siteName}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">URLs Trained:</span>
                <p className="text-sm text-gray-900">{site._count?.urls || 0}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">Knowledge Files:</span>
                <p className="text-sm text-gray-900">{site._count?.knowledgeFiles || 0}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">Last Updated:</span>
                <p className="text-sm text-gray-900">
                  {site.lastCrawledAt
                    ? new Date(site.lastCrawledAt).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Ask questions about your website content</li>
                <li>• Try different conversation starters</li>
                <li>• Test how the AI handles edge cases</li>
                <li>• Check if responses match your brand voice</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}