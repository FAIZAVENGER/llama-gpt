import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  console.log('App rendering');

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>LeadSOC AI</h1>
      <p>This is a test to verify React is working in Electron.</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          marginTop: '20px',
          cursor: 'pointer',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        Click me: {count}
      </button>
      <div style={{ marginTop: '20px', color: '#666' }}>
        <p>If you see this and the button works, React is working correctly!</p>
      </div>
    </div>
  );
}

export default App;
