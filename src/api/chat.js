import api from "./client";
import { getCurrentUser } from "./auth";

// Standard message send with emotion analysis
export const sendMessage = async (message) => {
  const response = await api.post("/chat/send", {
    message,
    save_to_memory: true,
  });

  return {
    response: response.data.response,
    emotion: {
      primaryEmotion: response.data.emotion?.primary_emotion || "neutral",
      confidence: response.data.emotion?.confidence || 0.5,
      sentimentScore: response.data.emotion?.sentiment_score || 0,
      intensity: response.data.emotion?.intensity || "low"
    },
    processingTime: response.data.processing_time || 0,
    memoriesUsed: response.data.memories_used || 0,
    sessionId: response.data.session_id
  };
};

// Stream message for real-time response
export const streamMessage = async (message, onChunk) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";
  const url = `${API_BASE_URL}/chat/stream?message=${encodeURIComponent(message)}`;
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const content = line.slice(6).trim();
        if (content && content !== 'complete') {
          accumulated += content;
          onChunk(accumulated);
        }
      }
    }
  }

  return accumulated;
};

// Get chat history
export const getChatHistory = async (limit = 50) => {
  const response = await api.get(`/chat/history?limit=${limit}`);
  return {
    conversationId: response.data.conversation_id,
    sessionId: response.data.session_id,
    messages: response.data.messages || [],
    stats: {
      messageCount: response.data.stats?.message_count || 0,
      avgProcessingTime: response.data.stats?.avg_processing_time || 0
    }
  };
};

// Clear conversation
export const clearChat = async () => {
  const response = await api.delete("/chat/clear");
  return response.data;
};

// WebSocket chat for real-time messages
export const connectChatWS = (onMessage, onError) => {
  const user = getCurrentUser();
  const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";
  const WS_BASE_URL = "ws://127.0.0.1:8000/api";

  const url = BYPASS_AUTH
    ? `${WS_BASE_URL}/chat/ws/${user.id}`
    : `${WS_BASE_URL}/chat/ws/${user.id}?token=${localStorage.getItem("access_token")}`;

  const ws = new WebSocket(url);

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    onMessage({
      response: data.response,
      emotion: {
        primaryEmotion: data.emotion?.primary_emotion,
        confidence: data.emotion?.confidence,
        intensity: data.emotion?.intensity
      },
      memoriesUsed: data.memories_used
    });
  };

  ws.onerror = (e) => onError?.(e);

  return ws;
};