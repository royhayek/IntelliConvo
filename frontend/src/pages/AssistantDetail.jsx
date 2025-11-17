import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Globe, MessageSquare, Code2, Settings, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssistantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assistant, setAssistant] = useState(null);
  const [knowledge, setKnowledge] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    welcome_message: '',
    system_prompt: '',
    conversation_starters: []
  });
  const [newStarter, setNewStarter] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [assistantRes, knowledgeRes, conversationsRes, analyticsRes, embedRes] = await Promise.all([
        axios.get(`${API}/assistants/${id}`),
        axios.get(`${API}/assistants/${id}/knowledge`),
        axios.get(`${API}/assistants/${id}/conversations`),
        axios.get(`${API}/assistants/${id}/analytics`),
        axios.get(`${API}/assistants/${id}/embed-code`)
      ]);
      
      setAssistant(assistantRes.data);
      setKnowledge(knowledgeRes.data);
      setConversations(conversationsRes.data);
      setAnalytics(analyticsRes.data);
      setEmbedCode(embedRes.data.code);
      setFormData({
        welcome_message: assistantRes.data.welcome_message || '',
        system_prompt: assistantRes.data.system_prompt || '',
        conversation_starters: assistantRes.data.conversation_starters || []
      });
    } catch (error) {
      toast.error('Failed to load assistant data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecrawl = async () => {
    try {
      await axios.post(`${API}/assistants/${id}/crawl`);
      toast.success('Recrawling started!');
      setTimeout(fetchData, 2000);
    } catch (error) {
      toast.error('Failed to start recrawl');
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await axios.patch(`${API}/assistants/${id}`, formData);
      toast.success('Settings updated!');
      fetchData();
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleAddStarter = () => {
    if (newStarter.trim()) {
      setFormData({
        ...formData,
        conversation_starters: [...formData.conversation_starters, newStarter.trim()]
      });
      setNewStarter('');
    }
  };

  const handleRemoveStarter = (index) => {
    setFormData({
      ...formData,
      conversation_starters: formData.conversation_starters.filter((_, i) => i !== index)
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 mb-4"
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }} data-testid="assistant-name">{assistant?.name}</h1>
              <p className="text-white/80 mt-1">{assistant?.website_url}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRecrawl}
                variant="outline"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                data-testid="recrawl-btn"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recrawl
              </Button>
              <Button
                onClick={() => navigate(`/assistant/${id}/chat`)}
                className="bg-white text-purple-600 hover:bg-white/90"
                data-testid="test-chat-btn"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Test Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-2xl font-bold text-gray-800" data-testid="crawl-status">{assistant?.crawl_status}</p>
                </div>
                <Globe className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">URLs Crawled</p>
                  <p className="text-2xl font-bold text-gray-800" data-testid="urls-count">{analytics?.urls_crawled || 0}</p>
                </div>
                <Globe className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversations</p>
                  <p className="text-2xl font-bold text-gray-800" data-testid="conversations-count">{analytics?.total_conversations || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Messages</p>
                  <p className="text-2xl font-bold text-gray-800" data-testid="messages-count">{analytics?.total_messages || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="knowledge" className="w-full">
          <TabsList className="glass-card border-0 p-1">
            <TabsTrigger value="knowledge" data-testid="knowledge-tab">Knowledge Base</TabsTrigger>
            <TabsTrigger value="conversations" data-testid="conversations-tab">Conversations</TabsTrigger>
            <TabsTrigger value="settings" data-testid="settings-tab">Settings</TabsTrigger>
            <TabsTrigger value="embed" data-testid="embed-tab">Embed Code</TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge" className="mt-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Crawled Pages</CardTitle>
                <CardDescription>Content extracted from your website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3" data-testid="knowledge-list">
                  {knowledge.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No pages crawled yet</p>
                  ) : (
                    knowledge.map((item) => (
                      <div key={item.id} className="p-4 bg-white/50 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-800">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.url}</p>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversations" className="mt-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Recent Conversations</CardTitle>
                <CardDescription>View conversations from website visitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3" data-testid="conversations-list">
                  {conversations.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No conversations yet</p>
                  ) : (
                    conversations.map((conv) => (
                      <div key={conv.id} className="p-4 bg-white/50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">Visitor: {conv.visitor_id}</p>
                            <p className="text-sm text-gray-600">{conv.message_count} messages</p>
                          </div>
                          <p className="text-xs text-gray-500">{new Date(conv.last_message_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Assistant Settings</CardTitle>
                <CardDescription>Customize your AI assistant behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Welcome Message</Label>
                  <Textarea
                    value={formData.welcome_message}
                    onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                    placeholder="Hello! How can I help you today?"
                    rows={3}
                    data-testid="welcome-message-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>System Prompt</Label>
                  <Textarea
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    placeholder="You are a helpful assistant..."
                    rows={4}
                    data-testid="system-prompt-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conversation Starters</Label>
                  <div className="space-y-2">
                    {formData.conversation_starters.map((starter, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={starter} disabled className="flex-1" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveStarter(index)}
                          data-testid={`remove-starter-${index}`}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Input
                      value={newStarter}
                      onChange={(e) => setNewStarter(e.target.value)}
                      placeholder="Add a conversation starter..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddStarter()}
                      data-testid="new-starter-input"
                    />
                    <Button onClick={handleAddStarter} data-testid="add-starter-btn">Add</Button>
                  </div>
                </div>

                <Button
                  onClick={handleUpdateSettings}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  data-testid="save-settings-btn"
                >
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embed" className="mt-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Embed Code</CardTitle>
                <CardDescription>Add this code to your website to enable the chat widget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm" data-testid="embed-code">
                      <code>{embedCode}</code>
                    </pre>
                    <Button
                      onClick={copyToClipboard}
                      className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white"
                      size="sm"
                      data-testid="copy-code-btn"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Installation Instructions</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                      <li>Copy the code above</li>
                      <li>Paste it in the &lt;head&gt; section of your website</li>
                      <li>The chat widget will appear automatically</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AssistantDetail;
