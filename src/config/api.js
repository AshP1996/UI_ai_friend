// const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8000";


// export const API_ENDPOINTS = {
// CHAT: `${API_BASE_URL}/chat`,
// HEALTH: `${API_BASE_URL}/health`,
// WS: `ws://localhost:8000/ws/chat`,
// };

const API_BASE_URL =
  import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,

  CHAT: `${API_BASE_URL}/chat`,
  HEALTH: `${API_BASE_URL}/health`,
  WS: `ws://127.0.0.1:8000/api/chat/ws`,
};
