/**
 * API Service Client for ShopEase Support Conversational AI.
 * Communicates with FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.detail || errBody.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Chat
  sendMessage: (message, conversationId = null) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId }),
    }),

  listConversations: () => request('/conversations'),
  getConversation: (id) => request(`/conversations/${id}`),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: 'DELETE' }),

  // Intent
  predictIntent: (text, topK = 3) =>
    request('/intents/predict', {
      method: 'POST',
      body: JSON.stringify({ text, top_k: topK }),
    }),
  listIntents: () => request('/intents'),

  // Knowledge Base
  getKnowledgeBase: () => request('/knowledge-base'),
  searchKnowledgeBase: (query, topK = 3) =>
    request('/knowledge-base/search', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK }),
    }),

  // Datasets & Analytics
  getDatasets: () => request('/datasets'),
  getAnalytics: () => request('/analytics'),

  // System & Model Status
  getModelInfo: () => request('/model-info'),
  getHealth: () => request('/health'),
  getSystemStatus: () => request('/system-status'),
};
