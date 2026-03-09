// ⚙️ frontend/src/config.js



// This decides which server to connect to.

// If .env exists (in production), use that. Otherwise use localhost (dev).
//export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// ⚙️ frontend/src/config.js
//⚙️ frontend/src/config.js




const hostname = window.location.hostname;

//1. Check if we are running locally
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

//2. Check if this is a Vercel "Develop" or "Preview" deployment
const isDevelop = hostname.includes('develop') || hostname.includes('8j5gjynth') || hostname.includes('vercel.app');

export const API_BASE_URL = isLocal 
  ? 'http://localhost:10000/api' 
  : isDevelop 
    ? 'https://agrifinance-app.onrender.com/api' // 👈 YOUR DEVELOP BACKEND
    : 'https://agri-backend-i38f.onrender.com/api'; // YOUR MAIN BACKEND