import { Capacitor } from '@capacitor/core';

// frontend/src/config.js
const hostname = window.location.hostname;

// Current Machine IP: 192.168.0.6 (Update if it changes)
const MACHINE_IP = '192.168.0.6';

const PROD_BACKEND = 'https://agrifinance-app.onrender.com/api';

const LOCAL_BACKEND = Capacitor.isNativePlatform() 
  ? `http://${MACHINE_IP}:5001/api` 
  : 'http://localhost:5001/api';

export const API_BASE_URL = 
  hostname === 'localhost' || hostname === '127.0.0.1' || Capacitor.isNativePlatform()
    ? (hostname === '10.0.2.2' ? 'http://10.0.2.2:5001/api' : LOCAL_BACKEND)
    : PROD_BACKEND;