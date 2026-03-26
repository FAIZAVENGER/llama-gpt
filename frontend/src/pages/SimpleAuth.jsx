// src/pages/SimpleAuth.jsx
import React from 'react';

export default function SimpleAuth() {
  return (
    <div style={{
      height: '100vh',
      background: '#1a1a1a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px'
    }}>
      <h1 style={{ color: '#007acc' }}>LeadSOC-AI</h1>
      <div style={{
        background: '#2d2d2d',
        padding: '30px',
        borderRadius: '10px',
        width: '300px'
      }}>
        <input 
          placeholder="Username" 
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            background: '#1a1a1a',
            border: '1px solid #333',
            color: 'white',
            borderRadius: '5px'
          }}
        />
        <input 
          type="password"
          placeholder="Password" 
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '20px',
            background: '#1a1a1a',
            border: '1px solid #333',
            color: 'white',
            borderRadius: '5px'
          }}
        />
        <button style={{
          width: '100%',
          padding: '10px',
          background: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Login
        </button>
      </div>
    </div>
  );
}