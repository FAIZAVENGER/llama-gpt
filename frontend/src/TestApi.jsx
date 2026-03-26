// src/TestApi.jsx
import React, { useState } from 'react';
import api from './api';

export default function TestApi() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testApi = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Testing API connection to:', api.defaults.baseURL);
      const response = await api.get('/api/test');
      console.log('API test response:', response.data);
      setResult({ success: true, data: response.data });
    } catch (err) {
      console.error('API test failed:', err);
      setError(err.message);
      setResult({ 
        success: false, 
        error: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '40px', 
      minHeight: '100vh',
      background: '#1a1a1a',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ color: '#007acc', marginBottom: '30px' }}>🔧 API Connection Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>API Base URL:</strong> {api.defaults.baseURL}</p>
      </div>
      
      <button 
        onClick={testApi}
        disabled={loading}
        style={{
          padding: '12px 24px',
          background: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          marginBottom: '30px'
        }}
      >
        {loading ? 'Testing...' : 'Test API Connection'}
      </button>
      
      {error && (
        <div style={{ 
          padding: '20px', 
          background: '#2d2d2d', 
          borderRadius: '10px',
          border: '1px solid #ff6b6b',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#ff6b6b', marginBottom: '10px' }}>❌ Connection Error</h3>
          <p style={{ color: '#888' }}>{error}</p>
          <p style={{ color: '#888', marginTop: '10px' }}>
            Make sure your Flask backend is running on port 5010
          </p>
        </div>
      )}
      
      {result && result.success && (
        <div style={{ 
          padding: '20px', 
          background: '#2d2d2d', 
          borderRadius: '10px',
          border: '1px solid #4CAF50'
        }}>
          <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>✅ Connection Successful!</h3>
          <pre style={{ 
            background: '#1a1a1a', 
            padding: '15px', 
            borderRadius: '5px',
            color: '#888',
            overflow: 'auto'
          }}>
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
      
      {result && !result.success && !error && (
        <div style={{ 
          padding: '20px', 
          background: '#2d2d2d', 
          borderRadius: '10px',
          border: '1px solid #ff6b6b'
        }}>
          <h3 style={{ color: '#ff6b6b', marginBottom: '10px' }}>❌ API Error</h3>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Error:</strong> {result.error}</p>
          {result.data && (
            <pre style={{ 
              background: '#1a1a1a', 
              padding: '10px', 
              borderRadius: '5px',
              color: '#888',
              marginTop: '10px'
            }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '30px', color: '#888' }}>
        <h4>Troubleshooting Tips:</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>✓ Make sure Flask is running: <code style={{ background: '#2d2d2d', padding: '2px 6px', borderRadius: '4px' }}>python app.py</code></li>
          <li>✓ Check if MongoDB is running</li>
          <li>✓ Verify Ollama is running: <code style={{ background: '#2d2d2d', padding: '2px 6px', borderRadius: '4px' }}>ollama serve</code></li>
          <li>✓ Check if port 5010 is accessible</li>
        </ul>
      </div>
    </div>
  );
}