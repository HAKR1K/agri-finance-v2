// ⚙️ frontend/src/config.js



// This decides which server to connect to.

// If .env exists (in production), use that. Otherwise use localhost (dev).

//export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// ⚙️ frontend/src/config.js




// Logic to switch between Local, Develop, and Production
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isDevelop = window.location.hostname.includes('develop') || window.location.hostname.includes('8j5gjynth');

export const API_BASE_URL = isLocal 
  ? 'http://localhost:10000/api' 
  : 'https://agrifinance-app.onrender.com/api'; // Your Develop Backend URL