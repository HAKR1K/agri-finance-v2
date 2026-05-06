const origin = "https://agri-finance-v2-six.vercel.app";
const allowedOrigins = [
    'https://agri-finance-v2-six.vercel.app',
    'https://agrifinance-app.onrender.com'
];
const isAllowed = allowedOrigins.includes(origin);
const isDev = origin.startsWith('http://localhost') || origin.startsWith('capacitor://localhost');
const isVercel = origin.endsWith('.vercel.app') && (origin.includes("agrifinance") || origin.includes("agri-finance"));
console.log("isAllowed:", isAllowed);
console.log("isVercel:", isVercel);
