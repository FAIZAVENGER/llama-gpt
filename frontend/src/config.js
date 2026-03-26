// src/config.js
// Detect if running on mobile/network
const getBaseUrl = () => {
  // Check if we're accessing from a non-localhost domain
  const hostname = window.location.hostname;
  console.log('Current hostname:', hostname);
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5010';
  } else {
    // Use the same IP as the frontend but with port 5010
    return `http://${hostname}:5010`;
  }
};

export const API_BASE_URL = getBaseUrl();
console.log('API Base URL:', API_BASE_URL);