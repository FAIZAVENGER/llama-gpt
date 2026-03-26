// src/components/SimpleSidebar.jsx
import React from 'react';

export default function SimpleSidebar({ onNewChat, isOpen, onToggle }) {
  return (
    <div style={{
      width: isOpen ? '250px' : '60px',
      height: '100vh',
      background: '#1e1e1e',
      borderRight: '1px solid #333',
      transition: 'width 0.3s',
      padding: '20px 10px',
      color: 'white'
    }}>
      <button 
        onClick={onToggle}
        style={{
          background: '#007acc',
          border: 'none',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px',
          width: '100%'
        }}
      >
        {isOpen ? '←' : '→'}
      </button>
      
      <button
        onClick={onNewChat}
        style={{
          background: '#007acc',
          border: 'none',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          cursor: 'pointer',
          width: '100%',
          marginBottom: '20px'
        }}
      >
        {isOpen ? '+ New Chat' : '+'}
      </button>
      
      {isOpen && (
        <div style={{ color: '#888' }}>
          No chats yet
        </div>
      )}
    </div>
  );
}