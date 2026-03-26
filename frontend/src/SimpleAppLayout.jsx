// src/SimpleAppLayout.jsx
import React, { useState } from 'react';
import SimpleSidebar from './components/SimpleSidebar';
import SimpleChat from './pages/SimpleChat';

export default function SimpleAppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SimpleSidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={() => console.log('New chat')}
      />
      <SimpleChat />
    </div>
  );
}