// ⚙️ frontend/src/config.js

// This decides which server to connect to.
// If .env exists (in production), use that. Otherwise use localhost (dev).
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";