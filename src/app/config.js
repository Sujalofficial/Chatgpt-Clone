export const API_BASE = import.meta.env.VITE_API_URL || 'https://synapse-ai-94f3.onrender.com';
export const API_URL = API_BASE.includes('localhost') ? `${API_BASE}/api` : `${API_BASE}/api`; 
export const AUTH_URL = `${API_BASE}/auth`;
