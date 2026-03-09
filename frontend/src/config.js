// Remove all the if/else logic for a moment and just do this:
// export const API_BASE_URL = "https://agrifinance-app.onrender.com/api";


// frontend/src/config.js

const hostname = window.location.hostname;

export const API_BASE_URL = 
  hostname === 'localhost' || hostname === '127.0.0.1'
    ? 'https://agrifinance-app.onrender.com/api' // Points to Develop Backend even when local
    : 'https://agrifinance-app.onrender.com/api'; // Points to Develop Backend on Vercel