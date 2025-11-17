import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateAssistant = () => {
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.website_url) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/assistants`, formData);
      toast.success('Assistant created! Crawling website...');
      navigate(`/assistant/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to create assistant');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 mb-4"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Create New Assistant</h1>
          <p className="text-white/80 mt-2">Set up an AI assistant for your website</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="glass-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Space Grotesk', color: '#1a202c' }}>Assistant Details</CardTitle>
            <CardDescription>Enter the information about your website and AI assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-semibold">Assistant Name *</Label>
                <Input
                  id="name"
                  placeholder="My Company Assistant"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  data-testid="assistant-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url" className="text-gray-700 font-semibold">Website URL *</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="website_url"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    required
                    className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    data-testid="website-url-input"
                  />
                </div>
                <p className="text-sm text-gray-500">We'll crawl this website to build the knowledge base</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 font-semibold">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your website or business..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 resize-none"
                  data-testid="description-input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-6 text-base"
                  data-testid="create-assistant-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Assistant'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="glass-card border-0 mt-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Space Grotesk' }}>What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">1.</span>
                <span>We'll automatically crawl your website and extract content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">2.</span>
                <span>The AI will learn from your website to answer visitor questions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">3.</span>
                <span>You can customize the assistant's behavior and get embed code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">4.</span>
                <span>Test the chat and add it to your website with one line of code</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateAssistant;
