import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/App.css';
import Dashboard from '@/pages/Dashboard';
import CreateAssistant from '@/pages/CreateAssistant';
import AssistantDetail from '@/pages/AssistantDetail';
import ChatPlayground from '@/pages/ChatPlayground';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateAssistant />} />
          <Route path="/assistant/:id" element={<AssistantDetail />} />
          <Route path="/assistant/:id/chat" element={<ChatPlayground />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
