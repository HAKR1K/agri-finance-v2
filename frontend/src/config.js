// ⚙️ frontend/src/config.js

const hostname = window.location.hostname;

// 1. Local Development (MacBook Air M2)
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

// 2. Specific Develop/Preview detection
// We look for 'develop' or the unique Vercel hash '8j5gjynth' first
const isDevelop = hostname.includes('develop') || hostname.includes('8j5gjynth');

export const API_BASE_URL = isLocal 
  ? 'http://localhost:10000/api' 
  : isDevelop 
    ? 'https://agrifinance-app.onrender.com/api'  // 🌿 DEVELOP BACKEND
    : 'https://agri-backend-i38f.onrender.com/api'; // 🚀 MAIN BACKEND