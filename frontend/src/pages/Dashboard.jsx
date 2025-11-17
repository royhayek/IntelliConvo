import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus, MessageSquare, Globe, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      const response = await axios.get(`${API}/assistants`);
      setAssistants(response.data);
    } catch (error) {
      toast.error('Failed to load assistants');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'status-completed',
      crawling: 'status-crawling',
      pending: 'status-pending',
      failed: 'status-failed'
    };
    return colors[status] || 'status-pending';
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Sideconvo</h1>
                <p className="text-white/80 text-sm">AI-powered chat for your website</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/create')}
              className="bg-white text-purple-600 hover:bg-white/90 font-semibold"
              data-testid="create-assistant-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-white text-lg">Loading assistants...</div>
          </div>
        ) : assistants.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in" data-testid="empty-state">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk', color: '#1a202c' }}>No Assistants Yet</h2>
              <p className="text-gray-600 mb-6">Create your first AI assistant to get started with intelligent chat on your website.</p>
              <Button
                onClick={() => navigate('/create')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-3"
                data-testid="create-first-assistant-btn"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Assistant
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>Your Assistants</h2>
              <p className="text-white/80">Manage your AI-powered chat assistants</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="assistants-grid">
              {assistants.map((assistant, index) => (
                <Card
                  key={assistant.id}
                  className="glass-card cursor-pointer hover:shadow-2xl transition-all duration-300 animate-fade-in border-0"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/assistant/${assistant.id}`)}
                  data-testid={`assistant-card-${assistant.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <span className={`status-badge ${getStatusColor(assistant.crawl_status)}`}>
                        {assistant.crawl_status}
                      </span>
                    </div>
                    <CardTitle className="text-xl" style={{ fontFamily: 'Space Grotesk', color: '#1a202c' }}>{assistant.name}</CardTitle>
                    <CardDescription className="text-gray-600">{assistant.website_url}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assistant.description && (
                        <p className="text-sm text-gray-700 line-clamp-2">{assistant.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4" />
                          <span>{assistant.urls_count || 0} pages</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/assistant/${assistant.id}/chat`);
                          }}
                          data-testid={`test-chat-btn-${assistant.id}`}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Test Chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
