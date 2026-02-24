import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const STORE_NAME = import.meta.env.VITE_STORE_NAME;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'x-gemini-api-key': API_KEY,
  },
});

export interface Message {
  role: 'user' | 'assistant' | 'model';
  content: string;
  timestamp?: string;
}

export const startChat = async () => {
  if (!STORE_NAME) throw new Error("Store Name not configured");
  try {
    const response = await api.post('/api/chat/start', {
      store_name: STORE_NAME
    });
    return response.data;
  } catch (error: any) {
    console.error('startChat error:', error.response?.data || error.message);
    throw error;
  }
};

export const sendMessage = async (sessionId: string, message: string) => {
  try {
    const response = await api.post('/api/chat/message', {
      session_id: sessionId,
      message: message
    });
    return response.data;
  } catch (error: any) {
    console.error('sendMessage error:', error.response?.data || error.message);
    throw error;
  }
};

export const getHistory = async (sessionId: string) => {
  try {
    // 嚴格遵守 0213-2 規格：/api/chat/history/{session_id}
    const response = await api.get(`/api/chat/history/${sessionId}`);
    return response.data;
  } catch (error: any) {
    console.error('getHistory error:', error.response?.data || error.message);
    throw error;
  }
};

export const getConversations = async () => {
  if (!STORE_NAME) throw new Error("Store Name not configured");
  try {
    // 嚴格遵守 0213-2 規格：GET /api/chat/history?store_name=...
    const response = await api.get('/api/chat/history', {
      params: { store_name: STORE_NAME }
    });
    return response.data;
  } catch (error: any) {
    console.error('getConversations error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteSession = async (sessionId: string) => {
  try {
    // 嚴格遵守 0213-2 規格：DELETE /api/chat/history/{session_id}
    const response = await api.delete(`/api/chat/history/${sessionId}`);
    return response.data;
  } catch (error: any) {
    console.error('deleteSession error:', error.response?.data || error.message);
    throw error;
  }
};
