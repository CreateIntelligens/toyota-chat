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
      store_name: STORE_NAME,
      model: 'gemini-2.5-flash' // 恢復 OpenAPI 定義的預設模型名稱
    });
    return response.data;
  } catch (error: any) {
    console.error('startChat error:', error.response?.data || error.message);
    throw error;
  }
};

export const sendMessage = async (sessionId: string, message: string) => {
  try {
    // 嚴格遵守 ChatMessageRequest 定義
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
    const response = await api.get('/api/chat/history', {
      params: { session_id: sessionId }
    });
    return response.data;
  } catch (error: any) {
    console.error('getHistory error:', error.response?.data || error.message);
    throw error;
  }
};

export const getConversations = async () => {
  if (!STORE_NAME) throw new Error("Store Name not configured");
  try {
    const response = await api.get('/api/chat/conversations', {
      params: { store_name: STORE_NAME }
    });
    return response.data;
  } catch (error: any) {
    console.error('getConversations error:', error.response?.data || error.message);
    throw error;
  }
};
