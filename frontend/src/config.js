// Use localhost if we are running locally (on localhost or a local IP)
// Otherwise, use the production Render URL.


// Use localhost if we are running locally (on localhost or a local IP)
// Otherwise, use the production Render URL.
//#const isLocal = window.location.hostname === 'localhost' || 
//                window.location.hostname === '127.0.0.1' || 
//                window.location.hostname.startsWith('192.168.') || 
//                window.location.hostname.startsWith('10.') ||
//                window.location.hostname.endsWith('.local');

const isLocal = false;

export const API_BASE_URL = isLocal
  ? `http://${window.location.hostname}:5001/api`
  : 'https://agri-finance-v2-ani8.onrender.com/api';